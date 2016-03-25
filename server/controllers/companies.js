var Company 		= require('mongoose').model('Company'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production      = require('mongoose').model('Production'),
    Commodity 	    = require('mongoose').model('Commodity'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

// Transfer.find({$or: [
//     {project:{$in: project.transfers_query}},
//     {site:{$in: project.transfers_query}},
//     {company:{$in: project.transfers_query}},
//     {country:{$in: project.transfers_query}},
//     {concession:{$in: project.transfers_query}}]})
// Production.find({$or: [
//     {project:{$in: project.transfers_query}},
//     {site:{$in: project.transfers_query}},
//     {country:{$in: project.transfers_query}},
//     {concession:{$in: project.transfers_query}}]})

exports.getCompanies = function(req, res) {
    var company_len, link_len, company_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        companyCount,
        getCompanySet,
        getCompanyLinks,
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });

    function companyCount(callback) {
        Company.find({}).count().exec(function(err, company_count) {
            if(company_count) {
                callback(null, company_count);
            } else {
                callback(err);
            }
        });
    }
    function getCompanySet(company_count, callback) {
        Company.find(req.query)
            .sort({
                company_name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .populate('country_of_incorporation.country', '_id iso2 name')
            .populate('company_aliases', ' _id alias')
            .lean()
            .exec(function(err, companies) {
                if(companies) {
                    callback(null, company_count, companies);
                } else {
                    callback(err);
                }
            });
    }
    function getCompanyLinks(company_count, companies, callback) {
        company_len = companies.length;
        company_counter = 0;
        companies.forEach(function (c) {
            Link.find({company: c._id, $or:[ {entities:'company_group'}, {entities:'project'} ] })
                .populate('company_group','_id company_group_name')
                .populate('project')
                .exec(function(err, links) {
                    ++company_counter;
                    link_len = links.length;
                    link_counter = 0;
                    c.company_groups = [];
                    c.projects = 0;
                    links.forEach(function(link) {
                        ++link_counter;

                        var entity = _.without(link.entities, 'company')[0]
                        switch (entity) {
                            case 'company_group':
                                c.company_groups.push({
                                    _id: link.company_group._id,
                                    company_group_name: link.company_group.company_group_name
                                });
                                break;
                            //
                            case 'project':
                                c.projects += 1;
                                break;
                            //
                            default:
                                console.log(entity, 'link skipped...');
                        }

                    });
                    if(company_counter == company_len && link_counter == link_len) {
                        res.send({data:companies, count:company_count});
                    }
                });
        });
    }
};
exports.getCompanyByID = function(req, res) {
    var link_counter, link_len, production_counter, production_len, proj_len, proj_counter, transfers_counter, transfers_len, concession_len, concession_counter, site_len, site_counter;

    async.waterfall([
        getCompany,
        getCompanyLinks,
        getContracts,
        getContractCommodity,
        //TODO finish deeply linked projects and sites
        // getLinkedProjects,
        // getLinkedSites,
        getTransfers,
        getProduction,
        getProjectTransfers,
        getProjectProduction,
        getSiteTransfers,
        getSiteProduction,
        getConcessionTransfers,
        getConcessionProduction,
        getProjectCoordinate
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });
    function getCompany(callback) {
        Company.findOne({_id:req.params.id})
            .populate('company_aliases', ' _id alias')
            .populate('company_group','_id company_group_name')
            .populate('country.country')
            .lean()
            .exec(function(err, company) {
                if(company) {
                    callback(null, company);
                } else {
                    callback(err);
                }
            });
    }
    function getCompanyLinks(company, callback) {
        company.company_groups = [];
        company.projects = [];
        company.contracts_link = [];
        company.sites = [];
        company.site_coordinates = {sites: [], fields: []};
        company.concessions = [];
        company.sources = {};
        company.commodities = {};
        // company.production = [];
        // company.transfers = [];
        Link.find({company: company._id})
            .populate('company_group','_id company_group_name')
            .populate('commodity')
            .populate('contract')
            .deepPopulate('site.site_country.country site.site_commodity.commodity project.proj_country.country project.proj_commodity.commodity concession.concession_country.country concession.concession_commodity.commodity source.source_type_id')
            .exec(function(err, links) {
                link_len = links.length;
                if(link_len>0) {
                    link_counter = 0;
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'company')[0];
                        if(link.source!=undefined) {
                            if (!company.sources[link.source._id]) {
                                company.sources[link.source._id] = link.source;
                            }
                        }
                        switch (entity) {
                            case 'site':
                                company.sites.push({
                                    _id: link.site._id,
                                    field: link.site.field,
                                    site_name: link.site.site_name,
                                    site_type: link.site.site_type,
                                    site_country: link.site.site_country,
                                    site_status: link.site.site_status,
                                    site_commodity: link.site.site_commodity
                                });
                                if (link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        company.site_coordinates.fields.push({
                                            'lat': loc.loc[0],
                                            'lng': loc.loc[1],
                                            'message': link.site.site_name,
                                            'timestamp': loc.timestamp,
                                            'type': 'field',
                                            'id': link.site._id
                                        });
                                    });
                                } else if (!link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        company.site_coordinates.sites.push({
                                            'lat': loc.loc[0],
                                            'lng': loc.loc[1],
                                            'message': link.site.site_name,
                                            'timestamp': loc.timestamp,
                                            'type': 'site',
                                            'id': link.site._id
                                        });
                                    });
                                }
                                link.site.site_commodity.forEach(function(commodity) {
                                    if (!company.commodities.hasOwnProperty(commodity.commodity.commodity_id)) {
                                        company.commodities[commodity.commodity.commodity_id] = {
                                            _id: commodity.commodity._id,
                                            commodity_name: commodity.commodity.commodity_name,
                                            commodity_id: commodity.commodity.commodity_id
                                        };
                                    }
                                });
                                break;
                            case 'company_group':
                                if (!company.company_groups.hasOwnProperty(link.company_group.company_group_name)) {
                                    company.company_groups.push({
                                        _id: link.company_group._id,
                                        company_group_name: link.company_group.company_group_name
                                    });
                                }
                                break;
                            case 'concession':
                                if (!company.concessions.hasOwnProperty(link.concession._id)) {
                                    company.concessions.push({
                                        _id: link.concession._id,
                                        concession_name: link.concession.concession_name,
                                        concession_country: _.find(link.concession.concession_country.reverse()).country,
                                        concession_type: _.find(link.concession.concession_type.reverse()),
                                        concession_commodities: link.concession.concession_commodity,
                                        concession_status: link.concession.concession_status
                                    });
                                }
                                link.concession.concession_commodity.forEach(function(commodity) {
                                    if (!company.commodities.hasOwnProperty(commodity.commodity.commodity_id)) {
                                        company.commodities[commodity.commodity.commodity_id] = {
                                            _id: commodity.commodity._id,
                                            commodity_name: commodity.commodity.commodity_name,
                                            commodity_id: commodity.commodity.commodity_id
                                        };
                                    }
                                });
                                break;
                            case 'contract':
                                // company.contracts_link.push(link.contract);
                                //TODO Add handling for OO and simple URL
                                if (!_.contains(company.contracts_link, link.contract.contract_id)) {
                                    company.contracts_link.push({_id:link.contract.contract_id});
                                }
                                break;
                            case 'project':
                                company.projects.push({
                                    _id: link.project._id,
                                    proj_name: link.project.proj_name,
                                    proj_id: link.project.proj_id,
                                    proj_country: link.project.proj_country,
                                    proj_coordinates: link.project.proj_coordinates,
                                    proj_type: link.project.proj_type,
                                    proj_commodity: link.project.proj_commodity,
                                    proj_status: link.project.proj_status
                                });
                                link.project.proj_commodity.forEach(function(commodity) {
                                    if (!company.commodities.hasOwnProperty(commodity.commodity.commodity_id)) {
                                        company.commodities[commodity.commodity.commodity_id] = {
                                            _id: commodity.commodity._id,
                                            commodity_name: commodity.commodity.commodity_name,
                                            commodity_id: commodity.commodity.commodity_id
                                        };
                                    }
                                });
                                break;
                            case 'transfer':
                                company.transfers.push({
                                    _id: link.transfer._id,
                                    transfer_year: link.transfer.transfer_year,
                                    company: {
                                        company_name: link.transfer.company.company_name,
                                        _id:link.transfer.company._id},
                                    country: {
                                        name: link.transfer.country.name,
                                        iso2: link.transfer.country.iso2},
                                    transfer_type: link.transfer.transfer_type,
                                    transfer_unit: link.transfer.transfer_unit,
                                    transfer_value: link.transfer.transfer_value,
                                    transfer_level: link.transfer.transfer_level,
                                    transfer_audit_type: link.transfer.transfer_audit_type});

                                break;
                            case 'production':
                                company.production.push({
                                    _id: link.production._id,
                                    production_year: link.production.production_year,
                                    production_volume: link.production.production_volume,
                                    production_unit: link.production.production_unit,
                                    production_commodity: {
                                        _id: link.production.production_commodity._id,
                                        commodity_name: link.production.production_commodity.commodity_name,
                                        commodity_id: link.production.production_commodity.commodity_id},
                                    production_price: link.production.production_price,
                                    production_price_unit: link.production.production_price_unit,
                                    production_level: link.production.production_level
                                });
                                if (!company.commodities.hasOwnProperty(link.production.production_commodity.commodity_id)) {
                                    company.commodities[link.production.production_commodity.commodity_id] = {
                                        _id: link.production.production_commodity._id,
                                        commodity_name: link.production.production_commodity.commodity_name,
                                        commodity_id: link.production.production_commodity.commodity_id
                                    };
                                }
                                break;
                            default:
                                console.log(entity, 'link skipped...');
                        }
                        if (link_counter == link_len) {
                            callback(null, company);
                        }
                    });
                } else{
                    callback(null, company);
                }
            });
    }
    function getContracts(company, callback) {
        company.contracts = [];
        var contract_counter = 0;
        var contract_len = company.contracts_link.length;
        if(contract_len>0) {
            _.each(company.contracts_link, function (contract) {
                request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract._id + '/metadata', function (err, res, body) {
                    var body = JSON.parse(body);
                    ++contract_counter;
                    company.contracts.push({
                        _id: contract._id,
                        contract_name: body.name,
                        contract_country: body.country,
                        contract_commodity: body.resource
                    });

                    if (contract_counter == contract_len) {
                        callback(null, company);
                    }
                });
            });
        } else{
            callback(null, company);
        }
    }
    function getContractCommodity(company, callback) {
        var contract_len = company.contracts.length;
        var contract_counter = 0;
        if(contract_len>0) {
            company.contracts.forEach(function (contract) {
                contract.commodity=[];
                var commodity_len = contract.contract_commodity.length;
                if(commodity_len>0) {
                    contract.contract_commodity.forEach(function (commodity_name) {
                        if (commodity_name != undefined) {
                            Commodity.find({commodity_name: commodity_name})
                                .exec(function (err, commodity) {
                                    ++contract_counter;
                                    commodity.map(function (name) {
                                        return contract.commodity.push({
                                            commodity_name: commodity_name,
                                            _id: name._id,
                                            commodity_id: name.commodity_id
                                        });
                                    });
                                    if (contract_counter == contract_len) {
                                        callback(null, company);
                                    }
                                });
                        }
                    })
                }
            })
        } else{
            callback(null, company);
        }
    }
    function getLinkedProjects(company, callback) {
        site_len = company.sites.length;
        site_counter = 0;
        if(site_len>0) {
            company.sites.forEach(function (site) {
                Link.find({site: site._id, entities:'project'})
                    .populate('project')
                    .deepPopulate('project.proj_country.country project.proj_commodity.commodity source.source_type_id')
                    .exec(function (err, links) {
                        ++site_counter;
                        link_len = links.length;
                        link_counter = 0;
                        if (link_len>0) {
                            links.forEach(function (link) {
                                if (!company.sources[link.source._id]) {
                                    company.sources[link.source._id] = link.source;
                                }
                                ++link_counter;
                                var entity = _.without(link.entities, 'site')[0];
                                switch (entity) {
                                    case 'project':
                                        company.projects.push({
                                            _id: link.project._id,
                                            proj_name: link.project.proj_name,
                                            proj_id: link.project.proj_id,
                                            proj_commodity: link.project.proj_commodity,
                                            proj_status: link.project.proj_status,
                                            proj_coordinates: link.project.proj_coordinates
                                        });
                                        break;
                                    default:
                                        console.log(entity, 'link skipped...');
                                }
                            });
                            if (site_counter == site_len && link_counter == link_len) {
                                callback(null, company);
                            }
                        } else {
                            if (site_counter == site_len && link_counter == link_len) {
                                callback(null, company);
                            }
                        }
                    });
            });
        } else {
            callback(null, company);
        }
    }
    function getLinkedSites(company, callback) {
        proj_len = company.projects.length;
        proj_counter = 0;
        if(proj_len>0) {
            callback(null, company);
            company.projects.forEach(function (project) {
                Link.find({project: project._id, entities:'site'})
                    .populate('site')
                    .deepPopulate('site.site_country.country site.site_commodity.commodity source.source_type_id')
                    .exec(function (err, links) {
                        ++proj_counter;
                        link_len = links.length;
                        link_counter = 0;
                        if (link_len>0) {
                            links.forEach(function (link) {
                                if (!company.sources[link.source._id]) {
                                    company.sources[link.source._id] = link.source;
                                }
                                ++link_counter;
                                var entity = _.without(link.entities, 'site')[0];
                                switch (entity) {
                                    case 'project':
                                        company.projects.push({
                                            _id: link.project._id,
                                            proj_name: link.project.proj_name,
                                            proj_id: link.project.proj_id,
                                            proj_commodity: link.project.proj_commodity,
                                            proj_status: link.project.proj_status,
                                            proj_coordinates: link.project.proj_coordinates
                                        });
                                        break;
                                    default:
                                        console.log(entity, 'link skipped...');
                                }
                            });

                        } else {
                            if (site_counter == site_len && link_counter == link_len) {
                                callback(null, company);
                            }
                        }
                    });
            });
        } else {
            callback(null, company);
        }
    }
    function getTransfers(company, callback) {
        company.transfers = [];
        Transfer.find({company: company._id})
            .populate('company country')
            .deepPopulate('source.source_type_id')
            .lean()
            .exec(function(err, transfers) {
                transfers_counter = 0;
                transfers_len = transfers.length;
                if (transfers_len>0) {
                    transfers.forEach(function (transfer) {
                        if (!company.sources[transfer.source._id]) {
                            //TODO clean up returned data if performance lags
                            company.sources[transfer.source._id] = transfer.source;
                        }
                        ++transfers_counter;
                        company.transfers.push({
                            _id: transfer._id,
                            transfer_year: transfer.transfer_year,
                            company: {
                                company_name: transfer.company.company_name,
                                _id: transfer.company._id},
                            country: {
                                name: transfer.country.name,
                                iso2: transfer.country.iso2},
                            transfer_type: transfer.transfer_type,
                            transfer_unit: transfer.transfer_unit,
                            transfer_value: transfer.transfer_value,
                            transfer_level: transfer.transfer_level,
                            transfer_audit_type: transfer.transfer_audit_type
                        });
                        if (transfers_counter===transfers_len) {
                            callback(null, company);
                        }
                    });
                } else {
                    callback(null, company);
                }
            });
    }
    function getProduction(company, callback) {
        company.production = [];
        Production.find({company: company._id})
            .populate('production_commodity')
            .deepPopulate('source.source_type_id')
            .lean()
            .exec(function(err, production) {
                production_counter = 0;
                production_len = production.length;
                if (production_len>0) {
                    production.forEach(function (prod) {
                        if (!company.sources[prod.source._id]) {
                            //TODO clean up returned data if performance lags
                            company.sources[prod.source._id] = prod.source;
                        }
                        ++production_counter;
                        company.production.push({
                            _id: prod._id,
                            production_year: prod.production_year,
                            production_volume: prod.production_volume,
                            production_unit: prod.production_unit,
                            production_commodity: {
                                _id: prod.production_commodity._id,
                                commodity_name: prod.production_commodity.commodity_name,
                                commodity_id: prod.production_commodity.commodity_id},
                            production_price: prod.production_price,
                            production_price_unit: prod.production_price_unit,
                            production_level: prod.production_level});
                        if (production_counter===production_len) {
                            callback(null, company);
                        }
                    });
                } else {
                    callback(null, company);
                }
            });
    }
    function getProjectTransfers(company, callback) {
        proj_len = company.projects.length;
        proj_counter = 0;
        if(proj_len>0) {
            company.projects.forEach(function (project) {
                Transfer.find({project:project._id})
                    .populate('company country')
                    .deepPopulate('source.source_type_id')
                    .exec(function(err, transfers) {
                        ++proj_counter;
                        transfers_counter = 0;
                        transfers_len = transfers.length;
                        if (transfers_len>0) {
                            transfers.forEach(function (transfer) {
                                if (!company.sources[transfer.source._id]) {
                                    //TODO clean up returned data if performance lags
                                    company.sources[transfer.source._id] = transfer.source;
                                }
                                ++transfers_counter;
                                company.transfers.push({
                                    _id: transfer._id,
                                    transfer_year: transfer.transfer_year,
                                    company: {
                                        company_name: transfer.company.company_name,
                                        _id: transfer.company._id},
                                    country: {
                                        name: transfer.country.name,
                                        iso2: transfer.country.iso2},
                                    transfer_type: transfer.transfer_type,
                                    transfer_unit: transfer.transfer_unit,
                                    transfer_value: transfer.transfer_value,
                                    transfer_level: transfer.transfer_level,
                                    transfer_audit_type: transfer.transfer_audit_type,
                                    project: {
                                        _id: project._id,
                                        proj_id: project.proj_id,
                                        proj_name: project.proj_name
                                    }
                                });
                                if (proj_counter===proj_len && transfers_counter===transfers_len) {
                                    callback(null, company);
                                }
                            });
                        } else {
                            if (proj_counter===proj_len && transfers_counter===transfers_len) {
                                callback(null, company);
                            }
                        }
                    });

            });
        } else {
            callback(null, company);
        }
    }
    function getProjectProduction(company, callback) {
        proj_len = company.projects.length;
        proj_counter = 0;
        if(proj_len>0) {
            company.projects.forEach(function (project) {
                Production.find({project:project._id})
                    .populate('production_commodity')
                    .deepPopulate('source.source_type_id')
                    .exec(function(err, production) {
                        ++proj_counter;
                        production_counter = 0;
                        production_len = production.length;
                        if (production_len>0) {
                            production.forEach(function (prod) {
                                if (!company.sources[prod.source._id]) {
                                    //TODO clean up returned data if performance lags
                                    company.sources[prod.source._id] = prod.source;
                                }
                                ++production_counter;
                                company.production.push({
                                    _id: prod._id,
                                    production_year: prod.production_year,
                                    production_volume: prod.production_volume,
                                    production_unit: prod.production_unit,
                                    production_commodity: {
                                        _id: prod.production_commodity._id,
                                        commodity_name: prod.production_commodity.commodity_name,
                                        commodity_id: prod.production_commodity.commodity_id},
                                    production_price: prod.production_price,
                                    production_price_unit: prod.production_price_unit,
                                    production_level: prod.production_level,
                                    project: {
                                        _id: project._id,
                                        proj_id: project.proj_id,
                                        proj_name: project.proj_name
                                    }
                                });
                                if (proj_counter===proj_len && production_counter===production_len) {
                                    callback(null, company);
                                }
                            });
                        } else {
                            if (proj_counter===proj_len && production_counter===production_len) {
                                callback(null, company);
                            }
                        }
                    });

            });
        } else {
            callback(null, company);
        }
    }
    function getSiteTransfers(company, callback) {
        site_len = company.sites.length;
        site_counter = 0;
        if(site_len>0) {
            company.sites.forEach(function (site) {
                Transfer.find({site:site._id})
                    .populate('company country')
                    .deepPopulate('source.source_type_id')
                    .exec(function(err, transfers) {
                        ++site_counter;
                        transfers_counter = 0;
                        transfers_len = transfers.length;
                        if (transfers_len>0) {
                            transfers.forEach(function (transfer) {
                                if (!company.sources[transfer.source._id]) {
                                    //TODO clean up returned data if performance lags
                                    company.sources[transfer.source._id] = transfer.source;
                                }
                                ++transfers_counter;
                                company.transfers.push({
                                    _id: transfer._id,
                                    transfer_year: transfer.transfer_year,
                                    company: {
                                        company_name: transfer.company.company_name,
                                        _id: transfer.company._id},
                                    country: {
                                        name: transfer.country.name,
                                        iso2: transfer.country.iso2},
                                    transfer_type: transfer.transfer_type,
                                    transfer_unit: transfer.transfer_unit,
                                    transfer_value: transfer.transfer_value,
                                    transfer_level: transfer.transfer_level,
                                    transfer_audit_type: transfer.transfer_audit_type,
                                    site: {
                                        _id: site._id,
                                        site_name: site.site_name
                                    }
                                });
                                if (site_counter===site_len && transfers_counter===transfers_len) {
                                    callback(null, company);
                                }
                            });
                        } else {
                            if (site_counter===site_len && transfers_counter===transfers_len) {
                                callback(null, company);
                            }
                        }
                    });

            });
        } else {
            callback(null, company);
        }
    }
    function getSiteProduction(company, callback) {
        site_len = company.sites.length;
        site_counter = 0;
        if(site_len>0) {
            company.sites.forEach(function (site) {
                Production.find({site:site._id})
                    .populate('production_commodity')
                    .deepPopulate('source.source_type_id')
                    .exec(function(err, production) {
                        ++site_counter;
                        production_counter = 0;
                        production_len = production.length;
                        if (production_len>0) {
                            production.forEach(function (prod) {
                                if (!company.sources[prod.source._id]) {
                                    //TODO clean up returned data if performance lags
                                    company.sources[prod.source._id] = prod.source;
                                }
                                ++production_counter;
                                company.production.push({
                                    _id: prod._id,
                                    production_year: prod.production_year,
                                    production_volume: prod.production_volume,
                                    production_unit: prod.production_unit,
                                    production_commodity: {
                                        _id: prod.production_commodity._id,
                                        commodity_name: prod.production_commodity.commodity_name,
                                        commodity_id: prod.production_commodity.commodity_id},
                                    production_price: prod.production_price,
                                    production_price_unit: prod.production_price_unit,
                                    production_level: prod.production_level,
                                    site: {
                                        _id: site._id,
                                        site_id: site.proj_id,
                                        site_name: site.proj_name
                                    }
                                });
                                if (site_counter===site_len && production_counter===production_len) {
                                    callback(null, company);
                                }
                            });
                        } else {
                            if (site_counter===site_len && production_counter===production_len) {
                                callback(null, company);
                            }
                        }
                    });

            });
        } else {
            callback(null, company);
        }
    }
    function getConcessionTransfers(company, callback) {
        concession_len = company.concessions.length;
        concession_counter = 0;
        if(concession_len>0) {
            company.concessions.forEach(function (concession) {
                Transfer.find({concession:concession._id})
                    .populate('company country')
                    .deepPopulate('source.source_type_id')
                    .exec(function(err, transfers) {
                        ++concession_counter;
                        transfers_counter = 0;
                        transfers_len = transfers.length;
                        if (transfers_len>0) {
                            transfers.forEach(function (transfer) {
                                if (!company.sources[transfer.source._id]) {
                                    //TODO clean up returned data if performance lags
                                    company.sources[transfer.source._id] = transfer.source;
                                }
                                ++transfers_counter;
                                company.transfers.push({
                                    _id: transfer._id,
                                    transfer_year: transfer.transfer_year,
                                    transfer_company: {
                                        company_name: transfer.company.company_name,
                                        _id: transfer.company._id},
                                    transfer_country: {
                                        name: transfer.country.name,
                                        iso2: transfer.country.iso2},
                                    transfer_type: transfer.transfer_type,
                                    transfer_unit: transfer.transfer_unit,
                                    transfer_value: transfer.transfer_value,
                                    transfer_level: transfer.transfer_level,
                                    transfer_audit_type: transfer.transfer_audit_type,
                                    concession: {
                                        _id: concession._id,
                                        concession_name: concession.concession_name
                                    }
                                });
                                if (concession_counter===concession_len && transfers_counter===transfers_len) {
                                    callback(null, company);
                                }
                            });
                        } else {
                            if (concession_counter===concession_len && transfers_counter===transfers_len) {
                                callback(null, company);
                            }
                        }
                    });

            });
        } else {
            callback(null, company);
        }
    }
    function getConcessionProduction(company, callback) {
        concession_len = company.concessions.length;
        concession_counter = 0;
        if(concession_len>0) {
            company.concessions.forEach(function (concession) {
                Production.find({concession:concession._id})
                    .populate('production_commodity')
                    .deepPopulate('source.source_type_id')
                    .exec(function(err, production) {
                        ++concession_counter;
                        production_counter = 0;
                        production_len = production.length;
                        if (production_len>0) {
                            production.forEach(function (prod) {
                                if (!company.sources[prod.source._id]) {
                                    //TODO clean up returned data if performance lags
                                    company.sources[prod.source._id] = prod.source;
                                }
                                ++production_counter;
                                company.production.push({
                                    _id: prod._id,
                                    production_year: prod.production_year,
                                    production_volume: prod.production_volume,
                                    production_unit: prod.production_unit,
                                    production_commodity: {
                                        _id: prod.production_commodity._id,
                                        commodity_name: prod.production_commodity.commodity_name,
                                        commodity_id: prod.production_commodity.commodity_id},
                                    production_price: prod.production_price,
                                    production_price_unit: prod.production_price_unit,
                                    production_level: prod.production_level,
                                    concession: {
                                        _id: concession._id,
                                        concession_name: concession.concession_name
                                    }
                                });
                                if (concession_counter===concession_len && production_counter===production_len) {
                                    callback(null, company);
                                }
                            });
                        } else {
                            if (concession_counter===concession_len && production_counter===production_len) {
                                callback(null, company);
                            }
                        }
                    });

            });
        } else {
            callback(null, company);
        }
    }
    function getProjectCoordinate(company,callback) {
        company.proj_coordinates = [];
        if (company.site_coordinates.sites.length>0) {
            company.site_coordinates.sites.forEach(function (site_loc) {
                company.proj_coordinates.push(site_loc);
            })
        }
        if (company.site_coordinates.fields.length>0) {
            company.site_coordinates.fields.forEach(function (field_loc) {
                company.proj_coordinates.push(field_loc);
            })
        }
        var proj_counter = 0;
        var proj_len = company.projects.length;
        if(proj_len>0) {
            company.projects.forEach(function (project) {
                ++proj_counter;
                project.proj_coordinates.forEach(function (loc) {
                    company.proj_coordinates.push({
                        'lat': loc.loc[0],
                        'lng': loc.loc[1],
                        'message': project.proj_name,
                        'timestamp': loc.timestamp,
                        'type': 'project',
                        'id': project.proj_id
                    });
                    if (proj_counter == proj_len) {
                        res.send(company);
                    }
                })
            });
        } else{
            res.send(company);
        }
    }
};
exports.createCompany = function(req, res, next) {
    var companyData = req.body;
    Company.create(companyData, function(err, company) {
        if(err){
            res.status(400);
            err = new Error('Error');
            return res.send({reason:err.toString()})
        } else {
            res.send();
        }
    });
};
exports.updateCompany = function(req, res) {
    var companyUpdates = req.body;
    Company.findOne({_id:req.body._id}).exec(function(err, company) {
        if(err) {
            res.status(400);
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
        company.company_name= companyUpdates.company_name;
        company.company_aliases= companyUpdates.company_aliases;
        company.company_established_source= companyUpdates.company_established_source;
        company.country_of_incorporation= companyUpdates.country_of_incorporation;
        company.countries_of_operation= companyUpdates.countries_of_operation;
        company.description= companyUpdates.description;
        company.save(function(err) {
            if(err) {
                err = new Error('Error');
                return res.send({reason: err.toString()});
            } else {
                res.send();
            }
        })
    });
};
exports.deleteCompany = function(req, res) {
    Company.remove({_id: req.params.id}, function(err) {
        if(!err) {
            res.send();
        } else{
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
    });
};