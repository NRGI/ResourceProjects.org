var Concession 		= require('mongoose').model('Concession'),
    // Country 		= require('mongoose').model('Country'),
    // Source 			= require('mongoose').model('Source'),
    // Alias 			= require('mongoose').model('Alias'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    Link            = require('mongoose').model('Link'),
    // Company 		= require('mongoose').model('Company'),
    // Commodity 		= require('mongoose').model('Commodity'),
    // Project 		= require('mongoose').model('Project'),
    // Contract 		= require('mongoose').model('Contract'),
    async           = require('async'),
    _               = require("underscore");

exports.getConcessions = function(req, res) {
    var concession_len, link_len, concession_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        concessionCount,
        getConcessionSet,
        getConcessionLinks,
        getTransfersCount,
        getProductionCount
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });
    function concessionCount(callback) {
        Concession.find({}).count().exec(function(err, concession_count) {
            if(concession_count) {
                callback(null, concession_count);
            } else {
                callback(err);
            }
        });
    }
    function getConcessionSet(concession_count, callback) {
        Concession.find(req.query)
            .sort({
                concession_name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .populate('concession_country.country', '_id iso2 name')
            .populate('concession_commodity.commodity', ' _id commodity_name commodity_id')
            .populate('concession_established_source')
            .lean()
            .exec(function(err, concessions) {
                if(concessions) {
                    //TODO clean up returned data if we see performance lags
                    callback(null, concession_count, concessions);
                } else {
                    res.send({data: concessions, count: concession_count});
                }
            });
    }
    function getConcessionLinks(concession_count, concessions, callback) {
        concession_len = concessions.length;
        concession_counter = 0;
        if(concession_len>0) {
            concessions.forEach(function (concession) {
                concession.source_type = {p: false, c: false};
                Link.find({concession: concession._id})
                    .populate('commodity', '_id commodity_name commodity_id')
                    .populate('company')
                    .deepPopulate('source.source_type_id')
                    .exec(function (err, links) {
                        ++concession_counter;
                        link_len = links.length;
                        link_counter = 0;
                        concession.project_count = 0;
                        concession.company_count = 0;
                        concession.site_count = 0;
                        concession.field_count  = 0;
                        concession.contract_count = 0;
                        // concession.transfers = 0;
                        // concession.production = 0;
                        concession.sites = [];
                        concession.fields = [];
                        concession.projects = [];
                        links.forEach(function (link) {
                            ++link_counter;
                            var entity = _.without(link.entities, 'concession')[0];
                            if (!concession.source_type.p || !concession.source_type.c) {
                                if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                    concession.source_type.c = true;
                                } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                    concession.source_type.c = true;
                                } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                    concession.source_type.p = true;
                                }
                            }
                            switch (entity) {
                                case 'company':
                                    concession.company_count += 1;
                                    break;
                                case 'contract':
                                    concession.contract_count += 1;
                                    break;
                                case 'project':
                                    concession.projects.push(link.project._id);
                                    concession.project_count += 1;
                                    break;
                                case 'site':
                                    if (concession.site.field) {
                                        concession.sites.push(link.site._id);
                                        concession.site_count += 1;
                                    } else if (!concession.site.field) {
                                        concession.fields.push(link.site._id);
                                        concession.field_count += 1;
                                    }
                                    break;
                                default:
                                    console.log(entity, 'skipped...');
                            }
                        });
                        if (concession_counter == concession_len && link_counter == link_len) {
                            callback(null, concession_count, concessions);
                        }
                    });
            });
        } else{
            callback(null, concession_count, concessions);
        }
    }
    function getTransfersCount(concession_count, concessions, callback) {
        concession_len = concessions.length;
        concession_counter = 0;

        _.each(concessions, function(concession) {
            Transfer.find({concession: concession._id})
                .count()
                .exec(function (err, transfer_count) {
                    ++concession_counter;
                    concession.transfer_count = transfer_count;
                    if (concession_counter === concession_len) {
                        callback(null, concession_count, concessions);
                    }
                });

        });
    }
    function getProductionCount(concession_count, concessions, callback) {
        concession_len = concessions.length;
        concession_counter = 0;

        _.each(concessions, function(concession) {
            Production.find({concession: concession._id})
                .count()
                .exec(function (err, production_count) {
                    ++concession_counter;
                    concession.production_count = production_count;
                    if (concession_counter === concession_len) {
                        res.send({data: concessions, count: concession_count});
                    }
                });

        });
    }
};
exports.getConcessionByID = function(req, res) {
    var link_counter, link_len,concession_counter, concession_len, proj_counter, proj_len, site_counter, site_len, transfers_counter, transfers_len;

    async.waterfall([
        getConcession,
        getConcessionLinks,
        //TODO finish deeply linked projects and sites
        // getLinkedProjects,
        // getLinkedSites,
        getTransfers,
        getProduction,
        getProjectTransfers,
        getProjectProduction,
        getSiteTransfers,
        getSiteProduction,
        getCompanyGroup,
        getProjectCoordinate
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });

    function getConcession(callback) {
        Concession.findOne({_id:req.params.id})
            .populate('concession_aliases', ' _id alias')
            .populate('concession_country.country')
            .populate('concession_commodity.commodity')
            .lean()
            .exec(function(err, concession) {
                if(concession) {
                    callback(null, concession);
                } else {
                    callback(err);
                }
            });
    }
    function getConcessionLinks(concession, callback) {
        Link.find({concession: concession._id})
            .populate('contract')
            .populate('company')
            .populate('site')
            .deepPopulate('project.proj_country.country project.proj_commodity.commodity source.source_type_id')
            .exec(function(err, links) {
                link_len = links.length;
                link_counter = 0;
                concession.projects = [];
                concession.companies = [];
                concession.contracts = [];
                concession.sites = [];
                concession.site_coordinates = {sites: [], fields: []};
                concession.sources = {};
                if(link_len>0) {
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'concession')[0];
                        if(link.source!=undefined) {
                            if (!concession.sources[link.source._id]) {
                                //TODO clean up returned data if performance lags
                                concession.sources[link.source._id] = link.source;
                            }
                        }
                        switch (entity) {
                            case 'company':
                                if (!concession.companies.hasOwnProperty(link.company._id)) {
                                    concession.companies.push({
                                        _id: link.company._id,
                                        company_name: link.company.company_name
                                    });
                                }
                                break;
                            case 'contract':
                                if (!_.contains(concession.contracts, link.contract.contract_id)) {
                                    concession.contracts.push(link.contract);
                                }
                                break;
                            case 'project':
                                concession.projects.push({
                                    _id: link.project._id,
                                    proj_name: link.project.proj_name,
                                    proj_id: link.project.proj_id,
                                    proj_commodity: link.project.proj_commodity,
                                    proj_status: link.project.proj_status,
                                    proj_coordinates: link.project.proj_coordinates
                                });
                                break;
                            case 'transfer':
                                concession.transfers.push({
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
                                concession.production.push({
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
                                    production_level: link.production.production_level});
                                break;
                            case 'site':
                                concession.sites.push({
                                    _id: link.site._id,
                                    field: link.site.field,
                                    site_name: link.site.site_name,
                                    site_status: link.site.site_status
                                });
                                if (link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        concession.site_coordinates.fields.push({
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
                                        concession.site_coordinates.sites.push({
                                            'lat': loc.loc[0],
                                            'lng': loc.loc[1],
                                            'message': link.site.site_name,
                                            'timestamp': loc.timestamp,
                                            'type': 'site',
                                            'id': link.site._id
                                        });
                                    });
                                }
                                break;
                            default:
                                console.log(entity, 'link skipped...');
                        }
                        if (link_counter == link_len) {
                            callback(null, concession);
                            //res.send(concession);
                        }
                    });
                } else{
                    callback(null, concession);
                }
            });
    }
    function getLinkedProjects(concession, callback) {
        site_len = concession.sites.length;
        site_counter = 0;
        if(site_len>0) {
            concession.sites.forEach(function (site) {
                Link.find({site: site._id, entities:'project'})
                    .populate('project')
                    .deepPopulate('project.proj_country.country project.proj_commodity.commodity source.source_type_id')
                    .exec(function (err, links) {
                        ++site_counter;
                        link_len = links.length;
                        link_counter = 0;
                        if (link_len>0) {
                            links.forEach(function (link) {
                                if (!concession.sources[link.source._id]) {
                                    concession.sources[link.source._id] = link.source;
                                }
                                ++link_counter;
                                var entity = _.without(link.entities, 'site')[0];
                                switch (entity) {
                                    case 'project':
                                        concession.projects.push({
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
                                callback(null, concession);
                            }
                        } else {
                            if (site_counter == site_len && link_counter == link_len) {
                                callback(null, concession);
                            }
                        }
                    });
            });
        } else {
            callback(null, concession);
        }
    }
    function getLinkedSites(concession, callback) {
        proj_len = concession.projects.length;
        proj_counter = 0;
        if(proj_len>0) {
            callback(null, concession);
            concession.projects.forEach(function (project) {
                Link.find({project: project._id, entities:'site'})
                    .populate('site')
                    .deepPopulate('site.site_country.country site.site_commodity.commodity source.source_type_id')
                    .exec(function (err, links) {
                        ++proj_counter;
                        link_len = links.length;
                        link_counter = 0;
                        if (link_len>0) {
                            links.forEach(function (link) {
                                if (!concession.sources[link.source._id]) {
                                    concession.sources[link.source._id] = link.source;
                                }
                                ++link_counter;
                                var entity = _.without(link.entities, 'site')[0];
                                switch (entity) {
                                    case 'project':
                                        concession.projects.push({
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
                                callback(null, concession);
                            }
                        }
                    });
            });
        } else {
            callback(null, concession);
        }
    }
    function getTransfers(concession, callback) {
        concession.transfers = [];
        Transfer.find({concession: concession._id})
            .populate('company country')
            .deepPopulate('source.source_type_id')
            .lean()
            .exec(function(err, transfers) {
                transfers_counter = 0;
                transfers_len = transfers.length;
                if (transfers_len>0) {
                    transfers.forEach(function (transfer) {
                        if (!concession.sources[transfer.source._id]) {
                            //TODO clean up returned data if performance lags
                            concession.sources[transfer.source._id] = transfer.source;
                        }
                        ++transfers_counter;
                        concession.transfers.push({
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
                            callback(null, concession);
                        }
                    });
                } else {
                    callback(null, concession);
                }
            });
    }
    function getProduction(concession, callback) {
        concession.production = [];
        Production.find({concession: concession._id})
            .populate('production_commodity')
            .deepPopulate('source.source_type_id')
            .lean()
            .exec(function(err, production) {
                production_counter = 0;
                production_len = production.length;
                if (production_len>0) {
                    production.forEach(function (prod) {
                        if (!concession.sources[prod.source._id]) {
                            //TODO clean up returned data if performance lags
                            concession.sources[prod.source._id] = prod.source;
                        }
                        ++production_counter;
                        concession.production.push({
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
                            callback(null, concession);
                        }
                    });
                } else {
                    callback(null, concession);
                }
            });
    }
    function getProjectTransfers(concession, callback) {
        proj_len = concession.projects.length;
        proj_counter = 0;
        if(proj_len>0) {
            concession.projects.forEach(function (project) {
                Transfer.find({project:project._id})
                    .populate('company country')
                    .deepPopulate('source.source_type_id')
                    .exec(function(err, transfers) {
                        ++proj_counter;
                        transfers_counter = 0;
                        transfers_len = transfers.length;
                        if (transfers_len>0) {
                            transfers.forEach(function (transfer) {
                                if (!concession.sources[transfer.source._id]) {
                                    //TODO clean up returned data if performance lags
                                    concession.sources[transfer.source._id] = transfer.source;
                                }
                                ++transfers_counter;
                                concession.transfers.push({
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
                                if (proj_counter===proj_len && transfers_counter===transfers_len) {
                                    callback(null, concession);
                                }
                            });
                        } else {
                            if (proj_counter===proj_len && transfers_counter===transfers_len) {
                                callback(null, concession);
                            }
                        }
                    });

            });
        } else {
            callback(null, concession);
        }
    }
    function getProjectProduction(concession, callback) {
        proj_len = concession.projects.length;
        proj_counter = 0;
        if(proj_len>0) {
            concession.projects.forEach(function (project) {
                Production.find({project:project._id})
                    .populate('production_commodity')
                    .deepPopulate('source.source_type_id')
                    .exec(function(err, production) {
                        ++proj_counter;
                        production_counter = 0;
                        production_len = production.length;
                        if (production_len>0) {
                            production.forEach(function (prod) {
                                if (!concession.sources[prod.source._id]) {
                                    //TODO clean up returned data if performance lags
                                    concession.sources[prod.source._id] = prod.source;
                                }
                                ++production_counter;
                                concession.production.push({
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
                                if (proj_counter===proj_len && production_counter===production_len) {
                                    callback(null, concession);
                                }
                            });
                        } else {
                            if (proj_counter===proj_len && production_counter===production_len) {
                                callback(null, concession);
                            }
                        }
                    });

            });
        } else {
            callback(null, concession);
        }
    }
    function getSiteTransfers(concession, callback) {
        site_len = concession.sites.length;
        site_counter = 0;
        if(site_len>0) {
            concession.sites.forEach(function (site) {
                Transfer.find({site:site._id})
                    .populate('company country')
                    .deepPopulate('source.source_type_id')
                    .exec(function(err, transfers) {
                        ++site_counter;
                        transfers_counter = 0;
                        transfers_len = transfers.length;
                        if (transfers_len>0) {
                            transfers.forEach(function (transfer) {
                                if (!concession.sources[transfer.source._id]) {
                                    //TODO clean up returned data if performance lags
                                    concession.sources[transfer.source._id] = transfer.source;
                                }
                                ++transfers_counter;
                                concession.transfers.push({
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
                                if (site_counter===site_len && transfers_counter===transfers_len) {
                                    callback(null, concession);
                                }
                            });
                        } else {
                            if (site_counter===site_len && transfers_counter===transfers_len) {
                                callback(null, concession);
                            }
                        }
                    });

            });
        } else {
            callback(null, concession);
        }
    }
    function getSiteProduction(concession, callback) {
        site_len = concession.sites.length;
        site_counter = 0;
        if(site_len>0) {
            concession.sites.forEach(function (site) {
                Production.find({site:site._id})
                    .populate('production_commodity')
                    .deepPopulate('source.source_type_id')
                    .exec(function(err, production) {
                        ++site_counter;
                        production_counter = 0;
                        production_len = production.length;
                        if (production_len>0) {
                            production.forEach(function (prod) {
                                if (!concession.sources[prod.source._id]) {
                                    //TODO clean up returned data if performance lags
                                    concession.sources[prod.source._id] = prod.source;
                                }
                                ++transfers_counter;
                                concession.production.push({
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
                                if (site_counter===site_len && production_counter===production_len) {
                                    callback(null, concession);
                                }
                            });
                        } else {
                            if (site_counter===site_len && production_counter===production_len) {
                                callback(null, concession);
                            }
                        }
                    });

            });
        } else {
            callback(null, concession);
        }
    }
    function getCompanyGroup(concession, callback) {
        concession_len = concession.companies.length;
        concession_counter = 0;
        if(concession_len>0) {
            concession.companies.forEach(function (company) {
                Link.find({company: company._id, entities:'company_group'})
                    .populate('company_group', '_id company_group_name')
                    .exec(function (err, links) {
                        ++concession_counter;
                        link_len = links.length;
                        link_counter = 0;
                        company.company_groups = [];
                            links.forEach(function (link) {
                                if (!concession.sources[link.source._id]) {
                                    concession.sources[link.source._id] = link.source;
                                }
                                ++link_counter;
                                var entity = _.without(link.entities, 'company')[0];
                                switch (entity) {
                                    case 'company_group':
                                        if (!company.company_groups.hasOwnProperty(link.company_group.company_group_name)) {
                                            company.company_groups.push({
                                                _id: link.company_group._id,
                                                company_group_name: link.company_group.company_group_name
                                            });
                                        }
                                        break;
                                    default:
                                        console.log(entity, 'link skipped...');
                                }
                            });
                        if (concession_counter == concession_len && link_counter == link_len) {
                            callback(null, concession);
                        }
                    });
            });
        } else {
            callback(null, concession);
        }
    }
    function getProjectCoordinate(concession,callback) {
        var project_counter = 0;
        concession.proj_coordinates = [];
        if (concession.site_coordinates.sites.length>0) {
            concession.site_coordinates.sites.forEach(function (site_loc) {
                concession.proj_coordinates.push(site_loc);
            })
        }
        if (concession.site_coordinates.fields.length>0) {
            concession.site_coordinates.fields.forEach(function (field_loc) {
                concession.proj_coordinates.push(field_loc);
            })
        }
        var project_len = concession.projects.length;
        if(project_len>0) {
            concession.projects.forEach(function (project) {
                ++project_counter;
                project.proj_coordinates.forEach(function (loc) {
                    concession.proj_coordinates.push({
                        'lat': loc.loc[0],
                        'lng': loc.loc[1],
                        'message': project.proj_name,
                        'timestamp': loc.timestamp,
                        'type': 'project',
                        'id': project.proj_id
                    });
                    if (project_counter == project_len) {
                        res.send(concession);
                    }
                })
            });
        } else{
            res.send(concession);
        }
    }

};
exports.createConcession = function(req, res, next) {
    var concessionData = req.body;
    Concession.create(concessionData, function(err, concession) {
        if(err){
            res.status(400);
            err = new Error('Error');
            return res.send({reason:err.toString()})
        } else{
            res.send();
        }
    });

};
exports.updateConcession = function(req, res) {
    var concessionUpdates = req.body;
    Concession.findOne({_id:req.body._id}).exec(function(err, concession) {
        if(err) {
            res.status(400);
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
        concession.concession_name= concessionUpdates.concession_name;
        //concession.concession_aliases= concessionUpdates.concession_aliases;
        //concession.concession_established_source= concessionUpdates.concession_established_source;
        concession.description= concessionUpdates.description;
        //concession.concession_country= concessionUpdates.concession_country;
        //concession.concession_status= concessionUpdates.concession_status;
        //concession.concession_type= concessionUpdates.concession_type;
        //concession.concession_commodity= concessionUpdates.concession_commodity;
        //concession.oo_concession_id= concessionUpdates.oo_concession_id;
        //concession.oo_url_api= concessionUpdates.oo_url_api;
        //concession.oo_url_wiki= concessionUpdates.oo_url_wiki;
        //concession.oo_source_date= concessionUpdates.oo_source_date;
        //concession.oo_details= concessionUpdates.oo_details;
        concession.save(function(err) {
            if(err) {
                err = new Error('Error');
                return res.send({reason: err.toString()});
            } else{
                res.send();
            }
        })
    });
};
exports.deleteConcession = function(req, res) {
    Concession.remove({_id: req.params.id}, function(err) {
        if(!err) {
            res.send();
        }else{
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
    });
};