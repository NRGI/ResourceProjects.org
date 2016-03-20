var Concession 		= require('mongoose').model('Concession'),
    //Country 		= require('mongoose').model('Country'),
    //Source 			= require('mongoose').model('Source'),
    //Alias 			= require('mongoose').model('Alias'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Link            = require('mongoose').model('Link'),
    //Company 		= require('mongoose').model('Company'),
    //Commodity 		= require('mongoose').model('Commodity'),
    //Project 		= require('mongoose').model('Project'),
    //Contract 		= require('mongoose').model('Contract'),
    async           = require('async'),
    _               = require("underscore");

exports.getConcessions = function(req, res) {
    var concession_len, link_len, concession_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        concessionCount,
        getConcessionSet,
        getConcessionLinks
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
            .skip(skip * limit)
            .limit(limit)
            .populate('concession_country.country', '_id iso2 name')
            .populate('concession_commodity.commodity')
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

        concessions.forEach(function (c) {
            Link.find({concession: c._id, entities: 'project'})
                .populate('company_group','_id company_group_name')
                .populate('project')
                .exec(function(err, links) {
                    ++concession_counter;
                    link_len = links.length;
                    link_counter = 0;
                    c.projects = 0;
                    links.forEach(function(link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'concession')[0]
                        switch (entity) {
                            case 'project':
                                c.projects += 1;
                                break;
                            default:
                                console.log(entity, 'link skipped...');
                        }
                        if(concession_counter == concession_len && link_counter == link_len) {
                            res.send({data:concessions, count:concession_count});
                        }
                    });

                });
        });
    }
};
exports.getConcessionByID = function(req, res) {
    var link_counter, link_len,concession_counter, concession_len;

    async.waterfall([
        getConcession,
        getConcessionLinks,
        getProjectLinks,
        getSiteLinks,
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
            .populate('commodity')
            .populate('contract')
            .populate('company')
            .populate('site')
            .deepPopulate('project project.proj_country.country project.proj_commodity.commodity production.production_commodity transfer.transfer_company transfer.transfer_country production.production_commodity source.source_type_id')
            //.deepPopulate()
            .exec(function(err, links) {
                link_len = links.length;
                link_counter = 0;
                concession.commodities = [];
                concession.projects = [];
                concession.companies = [];
                concession.contracts = [];
                concession.sites = [];
                concession.site_coordinates = {sites: [], fields: []};
                concession.transfers = [];
                concession.production = [];
                concession.sources = {};
                if(link_len>0) {
                    //concession.concessions = {};
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
                            case 'commodity':
                                if (!concession.commodities.hasOwnProperty(link.commodity_code)) {
                                    concession.commodities.push({
                                        _id: link.commodity._id,
                                        commodity_name: link.commodity.commodity_name,
                                        commodity_id: link.commodity.commodity_id
                                    });
                                }
                                break;
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
    function getProjectLinks(concession, callback) {
        var proj_len = concession.projects.length;
        proj_counter = 0;
        if(proj_len>0) {
            concession.projects.forEach(function (project) {
                Link.find({project: project._id, $or:[ {entities:'transfer'}, {entities:'production'}, {entities:'site'} ] })
                    .populate('site')
                    .deepPopulate('transfer.transfer_company transfer.transfer_country production.production_commodity source.source_type_id')
                    .exec(function (err, links) {
                        ++proj_counter;
                        link_len = links.length;
                        link_counter = 0;
                        links.forEach(function (link) {
                            if (!concession.sources[link.source._id]) {
                                concession.sources[link.source._id] = link.source;
                            }
                            ++link_counter;
                            var entity = _.without(link.entities, 'project')[0];
                            switch (entity) {
                                case 'transfer':
                                    concession.transfers.push({
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
                        });
                        if (proj_counter == proj_len && link_counter == link_len) {
                            callback(null, concession);
                        }
                    });
            });
        } else {
            callback(null, concession);
        }
    }
    function getSiteLinks(concession, callback) {
        site_len = concession.sites.length;
        site_counter = 0;
        if(site_len>0) {
            concession.sites.forEach(function (site) {
                Link.find({site: site._id, $or:[ {entities:'transfer'}, {entities:'production'} ] })
                    .deepPopulate('transfer.transfer_company transfer.transfer_country production.production_commodity source.source_type_id')
                    .exec(function (err, links) {
                        ++site_counter;
                        link_len = links.length;
                        link_counter = 0;
                        links.forEach(function (link) {
                            if (!concession.sources[link.source._id]) {
                                //TODO clean up returned data if performance lags
                                concession.sources[link.source._id] = link.source;
                            }
                            ++link_counter;
                            var entity = _.without(link.entities, 'site')[0];
                            switch (entity) {
                                case 'transfer':
                                    concession.transfers.push({
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
                                default:
                                    console.log(entity, 'link skipped...');
                            }
                        });
                        if (site_counter == site_len && link_counter == link_len) {
                            callback(null, concession);
                        }
                    });
            });
        } else {
            callback(null, project);
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