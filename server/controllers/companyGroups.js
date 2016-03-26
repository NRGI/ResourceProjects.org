var CompanyGroup 		= require('mongoose').model('CompanyGroup'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    Project 	    = require('mongoose').model('Project'),
    Commodity 	    = require('mongoose').model('Commodity'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getCompanyGroups = function(req, res) {
    var companyGroup_len, link_len, companyGroup_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        companyGroupCount,
        getCompanyGroupSet,
        getCompanyGroupLinks,
        getLinkedCompanyProjects
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });

    function companyGroupCount(callback) {
        CompanyGroup.find({}).count().exec(function(err, companyGroup_count) {
            if(companyGroup_count) {
                callback(null, companyGroup_count);
            } else {
                callback(err);
            }
        });
    }
    function getCompanyGroupSet(companyGroup_count, callback) {
        CompanyGroup.find(req.query)
            .sort({
                company_group_name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(function(err, companyGroups) {
                if(companyGroups) {
                    callback(null, companyGroup_count, companyGroups);
                } else {
                    callback(err);
                }
            });
    }
    function getCompanyGroupLinks(companyGroup_count, companyGroups, callback) {
        companyGroup_len = companyGroups.length;
        companyGroup_counter = 0;
        companyGroups.forEach(function (group) {
            Link.find({company_group: group._id})
                .populate('company')
                .populate('project')
                .exec(function(err, links) {
                    ++companyGroup_counter;
                    link_len = links.length;
                    link_counter = 0;
                    group.company_count = 0;
                    group.companies = {};
                    links.forEach(function(link) {
                        ++link_counter;

                        var entity = _.without(link.entities, 'company_group')[0];
                        switch (entity) {
                            case 'company':
                                group.companies={company: link.company._id};
                                group.company_count += 1;
                                break;
                            default:
                                console.log(entity, 'link skipped...');
                        }
                    });
                    if(companyGroup_counter == companyGroup_len && link_counter == link_len) {
                        callback(null, companyGroup_count, companyGroups);
                    }
                });
        });
    }
    function getLinkedCompanyProjects (companyGroup_count, companyGroups, callback){
        companyGroup_len = companyGroups.length;
        companyGroup_counter = 0;
        if(companyGroup_len>0) {
            async.forEach(companyGroups, function (group) {
                if(Object.keys(group.companies).length != 0) {
                    Link.find({entities: 'project',$or: [group.companies]})
                        .count()
                        .exec(function (err, proj_count) {
                            ++companyGroup_counter;
                            group.project_count = 0;
                            group.project_count = proj_count;
                            if (companyGroup_counter == companyGroup_len) {
                                res.send({data: companyGroups, count: companyGroup_count});
                            }
                        });
                }else{
                    ++companyGroup_counter;
                }
                if(Object.keys(group.companies).length == 0 && companyGroup_counter == companyGroup_len) {
                    res.send({data: companyGroups, count: companyGroup_count});
                }
                });
        } else {
            res.send({data:companyGroups, count:companyGroup_count});
        }
    }
};

exports.getCompanyGroupByID = function(req, res) {
    var link_counter, link_len, company_counter, company_len;

    async.waterfall([
        getCompanyGroup,
        getCompanyGroupLinks,
        getCompanyLinks,
        getContracts,
        getTransfers,
        getProduction,
        getContractCommodity,
        getProjectCoordinate
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });

    function getCompanyGroup(callback) {
        CompanyGroup.findOne({_id:req.params.id})
            .populate('company_group_aliases', '_id alias')
            .populate('company','_id company_name')
            .lean()
            .exec(function(err, companyGroup) {
                if(companyGroup) {
                    callback(null, companyGroup);
                } else {
                    callback(err);
                }
            });
    }
    function getCompanyGroupLinks(companyGroup, callback) {
        companyGroup.companies = [];
        companyGroup.commodities = [];
        companyGroup.concessions = [];
        companyGroup.transfers_query = [];
        companyGroup.sources = {};
        Link.find({company_group: companyGroup._id})
            .populate('company','_id company_name')
            .populate('commodity')
            .populate('contract')
            .deepPopulate('source.source_type_id')
            .exec(function(err, links) {
                link_len = links.length;
                if(link_len>0) {
                    link_counter = 0;
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'company_group')[0];
                        if(link.source!=undefined) {
                            if (!companyGroup.sources[link.source._id]) {
                                companyGroup.sources[link.source._id] = link.source;
                            }
                        }
                        switch (entity) {
                            case 'commodity':
                                if (!companyGroup.commodities.hasOwnProperty(link.commodity_code)) {
                                    companyGroup.commodities.push({
                                        _id: link.commodity._id,
                                        commodity_code: link.commodity.commodity_code,
                                        commodity_name: link.commodity.commodity_name,
                                        commodity_id: link.commodity.commodity_id
                                    })
                                }
                                break;
                            case 'company':
                                companyGroup.transfers_query.push(link.company._id);
                                if (!companyGroup.companies.hasOwnProperty(link.company.company_name)) {
                                    companyGroup.companies.push({
                                        _id: link.company._id,
                                        company_name: link.company.company_name
                                    });
                                }
                                break;
                            default:
                                console.log(entity, 'link skipped...');
                        }
                        if (link_counter == link_len) {
                            callback(null, companyGroup);
                        }
                    });
                } else{
                    callback(null, companyGroup);

                }
            });
    }
    function getCompanyLinks(companyGroup,callback) {
        company_counter = 0;
        company_len = companyGroup.companies.length;
        companyGroup.projects = [];
        companyGroup.sites = [];
        companyGroup.concessions = [];
        companyGroup.transfers_query = [];
        companyGroup.contracts_link = [];
        companyGroup.site_coordinates = {sites: [], fields: []};
        if(company_len>0) {
            companyGroup.companies.forEach(function (company) {
                companyGroup.transfers_query.push(company._id);
                Link.find({company: company._id})
                    .populate('contract')
                    .deepPopulate('concession.concession_country.country concession.concession_commodity.commodity site.site_country.country site.site_commodity.commodity project.proj_country.country project.proj_commodity.commodity source.source_type_id')
                    .exec(function(err, links) {
                        link_len = links.length;
                        ++company_counter;
                        link_counter = 0;
                        if (link_len>0) {
                            links.forEach(function(link) {
                                ++link_counter;
                                var entity = _.without(link.entities, 'company')[0];
                                if(link.source!=undefined) {
                                    if (!companyGroup.sources[link.source._id]) {
                                        //TODO clean up returned data if performance lags
                                        companyGroup.sources[link.source._id] = link.source;
                                    }
                                }
                                switch (entity) {
                                    case 'site':
                                        companyGroup.transfers_query.push(link.site._id);
                                        companyGroup.sites.push({
                                            _id: link.site._id,
                                            field: link.site.field,
                                            site_name: link.site.site_name,
                                            site_status: link.site.site_status
                                        });
                                        if (link.site.field && link.site.site_coordinates.length>0) {
                                            link.site.site_coordinates.forEach(function (loc) {
                                                companyGroup.site_coordinates.fields.push({
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
                                                companyGroup.site_coordinates.sites.push({
                                                    'lat': loc.loc[0],
                                                    'lng': loc.loc[1],
                                                    'message': link.site.site_name,
                                                    'timestamp': loc.timestamp,
                                                    'type': 'site',
                                                    'id': link.site._id
                                                });
                                            });
                                        }
                                        if (link.site.site_commodity.length>0) {
                                            if (_.where(companyGroup.concession_commodity, {_id:_.last(link.site.site_commodity)._id}).length<1) {
                                                companyGroup.concession_commodity.push({
                                                    _id: _.last(link.project.site_commodity)._id,
                                                    commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                        break;
                                    case 'project':
                                        companyGroup.transfers_query.push(link.project._id);
                                        companyGroup.projects.push({
                                            _id: link.project._id,
                                            proj_name: link.project.proj_name,
                                            proj_id: link.project.proj_id,
                                            proj_country: link.project.proj_country,
                                            proj_coordinates: link.project.proj_coordinates,
                                            proj_type: link.project.proj_type,
                                            proj_commodity: link.project.proj_commodity,
                                            proj_status: link.project.proj_status
                                        });
                                        if (link.project.proj_commodity.length>0) {
                                            if (_.where(companyGroup.commodities, {_id: _.last(link.project.proj_commodity).commodity._id}).length<1) {
                                                companyGroup.commodities.push({
                                                    _id: _.last(link.project.proj_commodity).commodity._id,
                                                    commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                        break;
                                    case 'contract':
                                        if (!_.contains(companyGroup.contracts_link, link.contract.contract_id)) {
                                            companyGroup.contracts_link.push({_id:link.contract.contract_id});
                                        }
                                        break;
                                    case 'concession':
                                        companyGroup.transfers_query.push(link.concession._id);
                                        if (!companyGroup.concessions.hasOwnProperty(link.concession._id)) {
                                            companyGroup.concessions.push({
                                                _id: link.concession._id,
                                                concession_name: link.concession.concession_name,
                                                concession_country: _.first(link.concession.concession_country).country,
                                                concession_commodities: link.concession.concession_commodity,
                                                concession_status: link.concession.concession_status
                                            });
                                        }
                                        if (link.concession.concession_commodity.length>0) {
                                            if (_.where(companyGroup.commodities, {_id: _.last(link.concession.concession_commodity).commodity._id}).length<1) {
                                                companyGroup.commodities.push({
                                                    _id: _.last(link.project.proj_commodity).commodity._id,
                                                    commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                        break;
                                    default:
                                }
                                if(company_counter == company_len && link_counter == link_len) {
                                    callback(null, companyGroup);
                                }
                            });
                        } else {
                            if(company_counter == company_len && link_counter == link_len) {
                                callback(null, companyGroup);
                            }
                        }
                    });
            });
        } else{
            callback(null, companyGroup);
        }
    }
    function getContracts(companyGroup, callback) {
        companyGroup.contracts = [];
        var contract_counter = 0;
        var contract_len = companyGroup.contracts_link.length;
        if(contract_len>0) {
            _.each(companyGroup.contracts_link, function (contract) {
                request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract._id + '/metadata', function (err, res, body) {
                    var body = JSON.parse(body);
                    ++contract_counter;
                    companyGroup.contracts.push({
                        _id: contract._id,
                        contract_name: body.name,
                        contract_country: body.country,
                        contract_commodity: body.resource
                    });
                    if (contract_counter == contract_len) {
                        callback(null, companyGroup);
                    }
                });

            });
        } else{
            callback(null, companyGroup);
        }
    }
    function getTransfers(companyGroup, callback) {
        companyGroup.transfers = [];
        Transfer.find({$or: [
                {project:{$in: companyGroup.transfers_query}},
                {site:{$in: companyGroup.transfers_query}},
                {company:{$in: companyGroup.transfers_query}},
                {concession:{$in: companyGroup.transfers_query}}]})
            .populate('concession country project site')
            .deepPopulate('source.source_type_id')
            .lean()
            .exec(function(err, transfers) {
                transfers_counter = 0;
                transfers_len = transfers.length;
                if (transfers_len>0) {
                    transfers.forEach(function (transfer) {
                        if(transfer.source!=undefined) {
                            if (!companyGroup.sources[transfer.source._id]) {
                                //TODO clean up returned data if performance lags
                                companyGroup.sources[transfer.source._id] = transfer.source;
                            }
                        }

                        ++transfers_counter;
                        companyGroup.transfers.push({
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
                            _.last(companyGroup.transfers).company = {_id: transfer.company._id, company_name: transfer.company.company_name};
                        }
                        if (transfer.project!==null && transfer.project) {
                            _.last(companyGroup.transfers).transfer_links.push({
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
                            _.last(companyGroup.transfers).transfer_links.push({
                                _id: transfer.project._id,
                                route: transfer.project.proj_id,
                                type: type,
                                name: transfer.project.proj_name});
                        }
                        if (transfers_counter===transfers_len) {
                            callback(null, companyGroup);

                        }
                    });
                } else {
                    callback(null, companyGroup);
                }
            });
    }
    function getProduction(companyGroup, callback) {
        companyGroup.production = [];
        Production.find({$or: [
                {project:{$in: companyGroup.transfers_query}},
                {site:{$in: companyGroup.transfers_query}},
                {concession:{$in: companyGroup.transfers_query}}]})
            .populate('production_commodity project site')
            .deepPopulate('source.source_type_id')
            .lean()
            .exec(function(err, production) {
                production_counter = 0;
                production_len = production.length;
                if (production_len>0) {
                    production.forEach(function (prod) {
                        if(prod.source!=undefined) {
                            if (!companyGroup.sources[prod.source._id]) {
                                //TODO clean up returned data if performance lags
                                companyGroup.sources[prod.source._id] = prod.source;
                            }
                        }
                        ++production_counter;
                        companyGroup.production.push({
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
                            _.last(companyGroup.production).production_links.push({
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
                            _.last(companyGroup.production).production_links.push({
                                _id: prod.project._id,
                                route: prod.project.proj_id,
                                type: type,
                                name: prod.project.proj_name});
                        }
                        if (production_counter===production_len) {
                            callback(null, companyGroup);
                        }
                    });
                } else {
                    callback(null, companyGroup);
                }
            });
    }
    function getContractCommodity(companyGroup, callback) {
        var contract_len = companyGroup.contracts.length;
        var contract_counter = 0;
        if(contract_len>0) {
            companyGroup.contracts.forEach(function (contract) {
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
                                        callback(null, companyGroup);
                                    }
                                });
                        }
                    })
                }
            })
        } else{
            callback(null, companyGroup);
        }
    }
    function getProjectCoordinate(companyGroup,callback) {
        companyGroup.proj_coordinates = [];
        if (companyGroup.site_coordinates.sites.length>0) {
            companyGroup.site_coordinates.sites.forEach(function (site_loc) {
                companyGroup.proj_coordinates.push(site_loc);
            })
        }
        if (companyGroup.site_coordinates.fields.length>0) {
            companyGroup.site_coordinates.fields.forEach(function (field_loc) {
                companyGroup.proj_coordinates.push(field_loc);
            })
        }
        var proj_counter = 0;
        var proj_len = companyGroup.projects.length;
        if(proj_len>0) {
            companyGroup.projects.forEach(function (project) {
                ++proj_counter;
                project.proj_coordinates.forEach(function (loc) {
                    companyGroup.proj_coordinates.push({
                        'lat': loc.loc[0],
                        'lng': loc.loc[1],
                        'message': project.proj_name,
                        'timestamp': loc.timestamp,
                        'type': 'project',
                        'id': project.proj_id
                    });
                })
                if (proj_counter == proj_len) {
                    res.send(companyGroup);
                }
            });
        } else{
            res.send(companyGroup);
        }
    }
};

exports.createCompanyGroup = function(req, res, next) {
    var companyGroupData = req.body;
    CompanyGroup.create(companyGroupData, function(err, companyGroup) {
        if(err){
            res.status(400);
            err = new Error('Error');
            return res.send({reason:err.toString()})
        } else{
            res.send();
        }
    });
};

exports.updateCompanyGroup = function(req, res) {
    var companyGroupUpdates = req.body;
    CompanyGroup.findOne({_id:req.body._id}).exec(function(err, companyGroup) {
        if(err) {
            res.status(400);
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
        companyGroup.company_group_name= companyGroupUpdates.company_group_name;
        companyGroup.commodity_aliases= companyGroupUpdates.commodity_aliases;
        companyGroup.company_group_record_established= companyGroupUpdates.company_group_record_established;
        companyGroup.description= companyGroupUpdates.description;
        companyGroup.open_corporates_group_id= companyGroupUpdates.open_corporates_group_id;
        companyGroup.save(function(err) {
            if(err) {
                err = new Error('Error');
                return res.send({reason: err.toString()});
            } else {
                res.send();
            }
        })
    });
};

exports.deleteCompanyGroup = function(req, res) {
    CompanyGroup.remove({_id: req.params.id}, function(err) {
        if(!err) {
            res.send();
        }else{
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
    });
};