var Contract 		= require('mongoose').model('Contract'),
    Country 		= require('mongoose').model('Country'),
    Source 			= require('mongoose').model('Source'),
    Alias 			= require('mongoose').model('Alias'),
    Link 	        = require('mongoose').model('Link'),
    Company 		= require('mongoose').model('Company'),
    Commodity 		= require('mongoose').model('Commodity'),
    Project 		= require('mongoose').model('Project'),
    Transfer 		= require('mongoose').model('Transfer'),
    Production 		= require('mongoose').model('Production'),
    async           = require('async'),
    _               = require('underscore'),
    request         = require('request');
//.populate('comments.author', 'firstName lastName role')
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
        } else {
            res.send(result);
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
                                        commodity_type: name.commodity_type,
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
            Link.find({contract: c._id,  $or:[ {entities:'site'}, {entities:'project'} ] })
                .exec(function(err, links) {
                    ++contract_counter;
                    link_len = links.length;
                    link_counter = 0;
                    c.projects = 0;
                    c.sites = 0;
                    c.fields = 0;
                    if(link_len>0) {
                        links.forEach(function (link) {
                            ++link_counter;
                            var entity = _.without(link.entities, 'contract')[0]
                            switch (entity) {
                                case 'project':
                                    c.projects += 1;
                                    break;
                                case 'site':
                                    if(link.field){
                                        c.fields += 1;
                                    }else{
                                        c.sites += 1;
                                    }
                                    break;
                                default:
                                    console.log(entity, 'link skipped...');
                            } if (contract_counter == contract_len && link_counter == link_len) {
                                callback(null, {data: contracts, count: contract_count});
                            }

                        });
                    } else if (contract_counter == contract_len) {
                        callback(null, {data: contracts, count: contract_count});
                    }
                });
        });
    }
};

exports.getContractByID = function(req, res) {
    var link_counter, link_len, transfers_counter, transfers_len, production_counter, production_len, site_len, site_counter, proj_len, proj_counter;

    async.waterfall([
        getContract,
        getContractRCData,
        getCommodity,
        getContractLinks,
        getCompanyGroup,
        //TODO finish deeply linked projects and sites
        // getLinkedProjects,
        // getLinkedSites,
        getTransfers,
        getProduction,
        // getProjectCoordinate
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
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
    function getContractLinks(contract, callback) {
        contract.projects = [];
        contract.companies = [];
        contract.concessions = [];
        contract.sites = [];
        contract.transfers_query = [];
        contract.site_coordinates = {sites: [], fields: []};
        contract.sources = {};
        Link.find({contract: contract._id})
            .populate('company')
            .populate('site')
            .deepPopulate('project.proj_country.country project.proj_commodity.commodity concession.concession_country.country concession.concession_commodity.commodity source.source_type_id site.site_country.country site.site_commodity.commodity')
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
                                contract.transfers_query.push(link.site._id);
                                contract.sites.push({
                                    _id: link.site._id,
                                    field: link.site.field,
                                    site_name: link.site.site_name,
                                    site_country:link.site.site_country,
                                    site_commodity:link.site.site_commodity,
                                    site_type:link.site.site_type,
                                    site_status:link.site.site_status
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
                                contract.transfers_query.push(link.concession._id);
                                if (!contract.concessions.hasOwnProperty(link.concession._id)) {
                                    contract.concessions.push({
                                        _id: link.concession._id,
                                        concession_name: link.concession.concession_name,
                                        concession_country: _.find(link.concession.concession_country.reverse()).country,
                                        concession_type: _.find(link.concession.concession_type.reverse()),
                                        concession_commodities: link.concession.concession_commodity,
                                        concession_status: link.concession.concession_status,
                                        concession_polygon: link.concession.concession_polygon
                                    });
                                }
                                break;
                            case 'company':
                                contract.transfers_query.push(link.company._id);
                                if (!contract.companies.hasOwnProperty(link.company._id)) {
                                    contract.companies.push({
                                        _id: link.company._id,
                                        company_name: link.company.company_name
                                    });
                                }
                                break;
                            case 'project':
                                //TODO clean up data returned if laggy
                                contract.transfers_query.push(link.project._id);
                                contract.projects.push({
                                    _id: link.project._id,
                                    proj_name: link.project.proj_name,
                                    proj_id: link.project.proj_id,
                                    proj_country: link.project.proj_country,
                                    proj_coordinates: link.project.proj_coordinates,
                                    proj_type: link.project.proj_type,
                                    proj_commodity: link.project.proj_commodity,
                                    proj_status: link.project.proj_status
                                });
                                // contract.projects.push(link.project);
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
    function getLinkedProjects(contract, callback) {
        site_len = contract.sites.length;
        site_counter = 0;
        if(site_len>0) {
            contract.sites.forEach(function (site) {
                Link.find({site: site._id, entities:'project'})
                    .populate('project')
                    .deepPopulate('project.proj_country.country project.proj_commodity.commodity source.source_type_id')
                    .exec(function (err, links) {
                        ++site_counter;
                        link_len = links.length;
                        link_counter = 0;
                        if (link_len>0) {
                            links.forEach(function (link) {
                                if (!contract.sources[link.source._id]) {
                                    contract.sources[link.source._id] = link.source;
                                }
                                ++link_counter;
                                var entity = _.without(link.entities, 'site')[0];
                                switch (entity) {
                                    case 'project':
                                        contract.projects.push({
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
                                callback(null, contract);
                            }
                        } else {
                            if (site_counter == site_len && link_counter == link_len) {
                                callback(null, contract);
                            }
                        }
                    });
            });
        } else {
            callback(null, contract);
        }
    }
    function getLinkedSites(contract, callback) {
        proj_len = contract.projects.length;
        proj_counter = 0;
        if(proj_len>0) {
            callback(null, contract);
            contract.projects.forEach(function (project) {
                Link.find({project: project._id, entities:'site'})
                    .populate('site')
                    .deepPopulate('site.site_country.country site.site_commodity.commodity source.source_type_id')
                    .exec(function (err, links) {
                        ++proj_counter;
                        link_len = links.length;
                        link_counter = 0;
                        if (link_len>0) {
                            links.forEach(function (link) {
                                if (!contract.sources[link.source._id]) {
                                    contract.sources[link.source._id] = link.source;
                                }
                                ++link_counter;
                                var entity = _.without(link.entities, 'site')[0];
                                switch (entity) {
                                    case 'project':
                                        contract.projects.push({
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
                                callback(null, contract);
                            }
                        }
                    });
            });
        } else {
            callback(null, contract);
        }
    }
    function getTransfers(contract, callback) {
        contract.transfers = [];
        Transfer.find({$or: [
                {project:{$in: contract.transfers_query}},
                {site:{$in: contract.transfers_query}},
                {concession:{$in: contract.transfers_query}}]})
            .populate('concession country project site')
            .deepPopulate('source.source_type_id')
            .lean()
            .exec(function(err, transfers) {
                transfers_counter = 0;
                transfers_len = transfers.length;
                if (transfers_len>0) {
                    transfers.forEach(function (transfer) {
                        if(transfer.source!=undefined) {
                            if (!contract.sources[transfer.source._id]) {
                                //TODO clean up returned data if performance lags
                                contract.sources[transfer.source._id] = transfer.source;
                            }
                        }

                        ++transfers_counter;
                        contract.transfers.push({
                            _id: transfer._id,
                            transfer_year: transfer.transfer_year,
                            country: {
                                name: transfer.country.name,
                                iso2: transfer.country.iso2},
                            transfer_type: transfer.transfer_type,
                            transfer_unit: transfer.transfer_unit,
                            transfer_value: transfer.transfer_value,
                            transfer_level: transfer.transfer_level,
                            transfer_audit_type: transfer.transfer_audit_type,
                            transfer_links: []
                        });
                        if (transfer.company!==null && transfer.company) {
                            _.last(contract.transfers).company = {_id: transfer.company._id, company_name: transfer.company.company_name};
                        }
                        if (transfer.project!==null && transfer.project) {
                            _.last(contract.transfers).transfer_links.push({
                                _id: transfer.project._id,
                                route: transfer.project.proj_id,
                                type: 'project',
                                name: transfer.project.proj_name});
                        }
                        if (transfer.site!==null && transfer.site) {
                            var type;
                            if (transfer.site.field) {
                                type = 'field';
                            } else {
                                type = 'site';
                            }
                            _.last(contract.transfers).transfer_links.push({
                                _id: transfer.project._id,
                                route: transfer.project.proj_id,
                                type: type,
                                name: transfer.project.proj_name});
                        }
                        if (transfers_counter===transfers_len) {
                            callback(null, contract);

                        }
                    });
                } else {
                    callback(null, contract);
                }
            });
    }
    function getProduction(contract, callback) {
        contract.production = [];
        Production.find({$or: [
                {project:{$in: contract.transfers_query}},
                {site:{$in: contract.transfers_query}},
                {concession:{$in: contract.transfers_query}}]})
            .populate('production_commodity project site')
            .deepPopulate('source.source_type_id')
            .lean()
            .exec(function(err, production) {
                production_counter = 0;
                production_len = production.length;
                if (production_len>0) {
                    production.forEach(function (prod) {
                        if(prod.source!=undefined) {
                            if (!contract.sources[prod.source._id]) {
                                //TODO clean up returned data if performance lags
                                contract.sources[prod.source._id] = prod.source;
                            }
                        }
                        ++production_counter;
                        contract.production.push({
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
                            production_links: []
                        });
                        if (prod.project!==null && prod.project) {
                            _.last(contract.production).production_links.push({
                                _id: prod.project._id,
                                route: prod.project.proj_id,
                                type: 'project',
                                name: prod.project.proj_name});
                        }
                        if (prod.site!==null && prod.site) {
                            var type;
                            if (prod.site.field) {
                                type = 'field';
                            } else {
                                type = 'site';
                            }
                            _.last(contract.production).production_links.push({
                                _id: prod.project._id,
                                route: prod.project.proj_id,
                                type: type,
                                name: prod.project.proj_name});
                        }
                        if (production_counter===production_len) {
                            callback(null, contract);
                        }
                    });
                } else {
                    callback(null, contract);
                }
            });
    }
    function getProjectCoordinate(contract,callback) {
        var project_counter = 0;
        contract.location = [];
        contract.polygon = [];
        if (contract.site_coordinates.sites.length>0) {
            contract.site_coordinates.sites.forEach(function (site_loc) {
                contract.location.push(site_loc);
            })
        }
        if (contract.concessions.length>0) {
            contract.concessions.forEach(function (concession,i) {
                if (concession.concession_polygon.length>0) {
                    contract.polygon[i]={};
                    contract.coordinate=[];
                    var len=concession.concession_polygon.length;
                    var counter=0;
                    concession.concession_polygon.forEach(function (con_loc) {
                        ++counter;
                        contract.coordinate.push({
                            'lat': con_loc.loc[0],
                            'lng': con_loc.loc[1],
                            message:"<a href='concession/" + concession._id + "'>" + concession.concession_name + "</a></br>" + concession.concession_name
                        });
                        if(len == counter){
                            contract.polygon[i].coordinate=contract.coordinate;
                            contract.polygon[i].message= "<a href='concession/" + concession._id + "'>" + concession.concession_name + "</a></br>" + concession.concession_name;

                        }
                    })
                }
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
                        callback(null, contract);
                    }
                })
            });
        } else{
            callback(null, contract);
        }

    }

};

