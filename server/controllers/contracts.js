var Contract 		= require('mongoose').model('Contract'),
    Country 		= require('mongoose').model('Country'),
    Source 			= require('mongoose').model('Source'),
    Alias 			= require('mongoose').model('Alias'),
    Link 	        = require('mongoose').model('Link'),
    Company 		= require('mongoose').model('Company'),
    Commodity 		= require('mongoose').model('Commodity'),
    Project 		= require('mongoose').model('Project'),
    async           = require('async'),
    _               = require('underscore'),
    request         = require('request');

exports.getContracts = function(req, res) {
    var contract_len, link_len, contract_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        contractCount,
        getContractSet,
        getContractRCData,
        getCommodity,
        getContractLinks
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });
    function contractCount(callback) {
        Contract.find({}).count().exec(function(err, contract_count) {
            if(contract_count) {
                callback(null, contract_count);
            } else {
                callback(err);
            }
        });
    }
    function getContractSet(contract_count, callback) {
        Contract.find(req.query)
            .sort({
                contract_id: 'asc'
            })
            .skip(skip * limit)
            .limit(limit)
            .lean()
            .exec(function(err, contracts) {
                if(contracts) {
                    callback(null, contract_count, contracts);
                } else {
                    callback(err);
                }
            });
    }
    function getContractRCData(contract_count, contracts, callback) {
        contract_len = contracts.length;
        contract_counter = 0;
        if(contract_len>0) {
            _.each(contracts, function (contract) {
                contract.rc_info=[];
                contract.commodities=[];
                request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract.contract_id + '/metadata', function (err, res, body) {
                    ++contract_counter;
                    var body = JSON.parse(body);
                    contract.rc_info.push({
                        contract_name: body.name,
                        contract_country: body.country,
                        contract_commodity: body.resource,
                        contract_type: body.contract_type
                    });
                    if(body.resource!=undefined){
                        var commodity =body.resource;
                        commodity.map(function(name){return contract.commodities.push(name);});
                    }
                    if (contract_counter == contract_len) {
                        callback(null, contract_count, contracts);
                    }
                });
            });
        } else{
            callback(null, contract_count, contracts);
        }
    }
    function getCommodity(contract_count, contracts, callback) {
        contract_len = contracts.length;
        contract_counter = 0;
        contracts.forEach(function (contract) {
            ++contract_counter;
            contract.commodity=[];
            if(contract.commodities.length>0) {
                contract.commodities.forEach(function (commodity_name) {
                    if (commodity_name != undefined) {
                        Commodity.find({commodity_name: commodity_name})
                            .exec(function (err, commodity) {
                                commodity.map(function (name) {
                                    return contract.commodity.push({
                                        commodity_name: commodity_name,
                                        _id: name._id,
                                        commodity_id: name.commodity_id
                                    });
                                });
                                if (contract_counter == contract_len) {
                                    callback(null, contract_count, contracts);
                                }
                            });
                    }
                })
            }else if(contract_counter == contract_len) {callback(null, contract_count, contracts);}
        })
    }
    function getContractLinks(contract_count, contracts, callback) {
        contract_len = contracts.length;
        contract_counter = 0;
        contracts.forEach(function (c) {
            Link.find({contract: c._id, entities: 'project'})
                .exec(function(err, links) {
                    ++contract_counter;
                    link_len = links.length;
                    link_counter = 0;
                    c.projects = 0;
                    if(link_len>0) {
                        links.forEach(function (link) {
                            ++link_counter;
                            var entity = _.without(link.entities, 'contract')[0]
                            switch (entity) {
                                case 'project':
                                    c.projects += 1;
                                    break;
                                default:
                                //console.log(entity, 'link skipped...');
                            } if (contract_counter == contract_len && link_counter == link_len) {
                                res.send({data: contracts, count: contract_count});
                            }

                        });
                    } else if (contract_counter == contract_len) {
                        res.send({data: contracts, count: contract_count});
                    }
                });
        });
    }
};
exports.getContractByID = function(req, res) {
    var link_counter, link_len;

    async.waterfall([
        getContract,
        getContractRCData,
        getContractLinks,
        getCompanyGroup,
        getCommodity,
        getProjectLinks,
        getSiteLinks,
        getProjectCoordinate
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });

    function getContract(callback) {
        Contract.findOne({contract_id: req.params.id})
            .lean()
            .exec(function(err, contract) {
                if(contract) {
                    callback(null, contract);
                } else {
                    callback(err);
                }
            });
    }
    function getContractRCData(contract, callback) {
        request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract.contract_id + '/metadata', function (err, res, body) {
            contract.rc_info = [];
            contract.commodities=[];
            var body = JSON.parse(body);
            contract.rc_info = {
                contract_name: body.name,
                contract_country: body.country,
                contract_commodity: body.resource,
                contract_type: body.contract_type
            };
            if (body.resource != undefined) {
                var commodity = body.resource;
                commodity.map(function (name) {
                    return contract.commodities.push(name);
                });
            }
            callback(null, contract);
        });
    }
    function getContractLinks(contract, callback) {
        contract.projects = [];
        contract.companies = [];
        contract.concessions = [];
        contract.transfers = [];
        contract.production = [];
        contract.sites = [];
        contract.site_coordinates = {sites: [], fields: []};
        contract.sources = {};
        Link.find({contract: contract._id})
            .populate('company')
            .populate('commodity')
            .populate('site')
            .deepPopulate('project project.proj_country.country project.proj_commodity.commodity concession concession.concession_country.country concession.concession_commodity.commodity source.source_type_id')
            .exec(function (err, links) {
                link_len = links.length;
                link_counter = 0;
                if (link_len > 0) {
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'contract')[0];
                        if(link.source!=undefined) {
                            if (!contract.sources[link.source._id]) {
                                contract.sources[link.source._id] = link.source;
                            }
                        }
                        switch (entity) {
                            case 'site':
                                contract.sites.push({
                                    _id: link.site._id,
                                    field: link.site.field,
                                    site_name: link.site.site_name,
                                });
                                if (link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        contract.site_coordinates.fields.push({
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
                                        contract.site_coordinates.sites.push({
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
                            case 'concession':
                                if (!contract.concessions.hasOwnProperty(link.concession._id)) {
                                    contract.concessions.push({
                                        _id: link.concession._id,
                                        concession_name: link.concession.concession_name,
                                        concession_country: _.find(link.concession.concession_country.reverse()).country,
                                        concession_type: _.find(link.concession.concession_type.reverse()),
                                        concession_commodities: link.concession.concession_commodity,
                                        concession_status: link.concession.concession_status
                                    });
                                }
                                break;
                            case 'company':
                                if (!contract.companies.hasOwnProperty(link.company._id)) {
                                    contract.companies.push({
                                        _id: link.company._id,
                                        company_name: link.company.company_name
                                    });
                                }
                                break;
                            case 'project':
                                //TODO clean up data returned if laggy
                                contract.projects.push(link.project);
                                // contract.projects.push({
                                //     _id: link.project._id,
                                //     proj_name: link.project.proj_name,
                                //     proj_id: link.project.proj_id,
                                //     proj_commodity: link.project.proj_commodity,
                                //     proj_status: link.project.proj_status,
                                //     proj_coordinates: link.project.proj_coordinates
                                // });
                                break;
                            case 'transfer':
                                contract.transfers.push({
                                    _id: link.transfer._id,
                                    transfer_year: link.transfer.transfer_year,
                                    transfer_company: {
                                        company_name: link.transfer.transfer_company.company_name,
                                        _id:link.transfer.transfer_company._id},
                                    transfer_country: {
                                        name: link.transfer.transfer_country.name,
                                        iso2: link.transfer.transfer_country.iso2},
                                    transfer_type: link.transfer.transfer_type,
                                    transfer_unit: link.transfer.transfer_unit,
                                    transfer_value: link.transfer.transfer_value,
                                    transfer_level: link.transfer.transfer_level,
                                    transfer_audit_type: link.transfer.transfer_audit_type});
                                break;
                            case 'production':
                                contract.production.push({
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

                            default:
                                console.log(entity, 'link skipped...');
                        }
                        if (link_counter == link_len) {
                            callback(null, contract);
                        }
                    });
                } else {
                    callback(null, contract);
                }
            });
    }
    function getCompanyGroup(contract, callback) {
        var project_len = contract.companies.length;
        var project_counter = 0;
        if(project_len>0) {
            contract.companies.forEach(function (company) {
                Link.find({company: company._id, entities: 'company_group'})
                    .populate('company_group', '_id company_group_name')
                    .exec(function (err, links) {
                        if (links.length > 0) {
                            ++project_counter;
                            link_len = links.length;
                            link_counter = 0;
                            company.company_groups = [];
                            links.forEach(function (link) {
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
                                if (project_counter == project_len && link_counter == link_len) {
                                    callback(null, contract);
                                }
                            });
                        } else {
                            callback(null, contract);
                        }
                    });
            });
        } else {
            callback(null, contract);
        }
    }
    function getCommodity(contract, callback) {
        var commodity_len = contract.commodities.length;
        var commodity_counter = 0;
        contract.commodity=[];
        if(commodity_len>0) {
            contract.commodities.forEach(function (commodity_name) {
                if (commodity_name != undefined) {
                    Commodity.find({commodity_name: commodity_name})
                        .exec(function (err, commodity) {
                            ++commodity_counter;
                            commodity.map(function (name) {
                                return contract.commodity.push({
                                    commodity_name: commodity_name,
                                    _id: name._id,
                                    commodity_id: name.commodity_id
                                });
                            });
                            if (commodity_counter == commodity_len) {
                                callback(null, contract);
                            }
                        });
                }
            })
        } else{
            callback(null, contract);
        }
    }
    function getProjectLinks(contract, callback) {
        var proj_len = contract.projects.length;
        proj_counter = 0;
        if(proj_len>0) {
            contract.projects.forEach(function (project) {
                Link.find({project: project._id, $or:[ {entities:'transfer'}, {entities:'production'}, {entities:'site'} ] })
                    .populate('site')
                    .deepPopulate('transfer.transfer_company transfer.transfer_country production.production_commodity source.source_type_id')
                    .exec(function (err, links) {
                        ++proj_counter;
                        link_len = links.length;
                        link_counter = 0;
                        links.forEach(function (link) {
                            if (!contract.sources[link.source._id]) {
                                contract.sources[link.source._id] = link.source;
                            }
                            ++link_counter;
                            var entity = _.without(link.entities, 'project')[0];
                            switch (entity) {
                                case 'transfer':
                                    contract.transfers.push({
                                        _id: link.transfer._id,
                                        transfer_year: link.transfer.transfer_year,
                                        transfer_company: {
                                            company_name: link.transfer.transfer_company.company_name,
                                            _id:link.transfer.transfer_company._id},
                                        transfer_country: {
                                            name: link.transfer.transfer_country.name,
                                            iso2: link.transfer.transfer_country.iso2},
                                        transfer_type: link.transfer.transfer_type,
                                        transfer_unit: link.transfer.transfer_unit,
                                        transfer_value: link.transfer.transfer_value,
                                        transfer_level: link.transfer.transfer_level,
                                        transfer_audit_type: link.transfer.transfer_audit_type});
                                    break;
                                case 'production':
                                    contract.production.push({
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
                                    contract.sites.push({
                                        _id: link.site._id,
                                        field: link.site.field,
                                        site_name: link.site.site_name,
                                    });
                                    if (link.site.field && link.site.site_coordinates.length>0) {
                                        link.site.site_coordinates.forEach(function (loc) {
                                            contract.site_coordinates.fields.push({
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
                                            contract.site_coordinates.sites.push({
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
                        });
                        if (proj_counter == proj_len && link_counter == link_len) {
                            callback(null, contract);
                        }
                    });
            });
        } else {
            callback(null, contract);
        }
    }
    function getSiteLinks(contract, callback) {
        site_len = contract.sites.length;
        site_counter = 0;
        if(site_len>0) {
            contract.sites.forEach(function (site) {
                Link.find({site: site._id, $or:[ {entities:'transfer'}, {entities:'production'} ] })
                    .deepPopulate('transfer.transfer_company transfer.transfer_country production.production_commodity source.source_type_id')
                    .exec(function (err, links) {
                        ++site_counter;
                        link_len = links.length;
                        link_counter = 0;
                        links.forEach(function (link) {
                            if (!contract.sources[link.source._id]) {
                                //TODO clean up returned data if performance lags
                                contract.sources[link.source._id] = link.source;
                            }
                            ++link_counter;
                            var entity = _.without(link.entities, 'site')[0];
                            switch (entity) {
                                case 'transfer':
                                    contract.transfers.push({
                                        _id: link.transfer._id,
                                        transfer_year: link.transfer.transfer_year,
                                        transfer_company: {
                                            company_name: link.transfer.transfer_company.company_name,
                                            _id:link.transfer.transfer_company._id},
                                        transfer_country: {
                                            name: link.transfer.transfer_country.name,
                                            iso2: link.transfer.transfer_country.iso2},
                                        transfer_type: link.transfer.transfer_type,
                                        transfer_unit: link.transfer.transfer_unit,
                                        transfer_value: link.transfer.transfer_value,
                                        transfer_level: link.transfer.transfer_level,
                                        transfer_audit_type: link.transfer.transfer_audit_type});
                                    break;
                                case 'production':
                                    contract.production.push({
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
                                default:
                                    console.log(entity, 'link skipped...');
                            }
                        });
                        if (site_counter == site_len && link_counter == link_len) {
                            callback(null, contract);
                        }
                    });
            });
        } else {
            callback(null, contract);
        }
    }
    function getProjectCoordinate(contract,callback) {
        var project_counter = 0;
        contract.location = [];
        if (contract.site_coordinates.sites.length>0) {
            contract.site_coordinates.sites.forEach(function (site_loc) {
                contract.location.push(site_loc);
            })
        }
        if (contract.site_coordinates.fields.length>0) {
            contract.site_coordinates.fields.forEach(function (field_loc) {
                contract.location.push(field_loc);
            })
        }
        var project_len = contract.projects.length;
        if(project_len>0) {
            contract.projects.forEach(function (project) {
                ++project_counter;
                project.proj_coordinates.forEach(function (loc) {
                    contract.location.push({
                        'lat': loc.loc[0],
                        'lng': loc.loc[1],
                        'message': project.proj_name,
                        'timestamp': loc.timestamp,
                        'type': 'project',
                        'id': project.proj_id
                    });
                    if (project_counter == project_len) {
                        res.send(contract);
                    }
                })
            });
        } else{
            res.send(contract);
        }

    }

};

