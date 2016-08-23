var Concession 		= require('mongoose').model('Concession'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    Link            = require('mongoose').model('Link'),
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
            } else {
                if (req.query && req.query.callback) {
                    return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
                } else {
                    return res.send(result);
                }
            }
        }
    );
    function concessionCount(callback) {
        Concession.find({}).count().exec(function(err, concession_count) {
            if(concession_count) {
                callback(null, concession_count);
            } else {
                return res.send(err);
            }
        });
    }
    function getConcessionSet(concession_count, callback) {
        Concession.find({})
            .sort({
                concession_name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .populate('concession_country.country', '_id iso2 name')
            .populate('concession_commodity.commodity', ' _id commodity_name commodity_type commodity_id')
            .populate('concession_established_source')
            .lean()
            .exec(function(err, concessions) {
                if(concessions) {
                    //TODO clean up returned data if we see performance lags
                    callback(null, concession_count, concessions);
                } else {
                    return res.send(err);
                }
            });
    }
    function getConcessionLinks(concession_count, concessions, callback) {
        concession_len = concessions.length;
        concession_counter = 0;
        if(concession_len>0) {
            concessions.forEach(function (concession) {
                var commodities=concession.concession_commodity;
                concession.concession_commodity=[];
                _.each(commodities,function(commodity){
                    concession.concession_commodity.push({
                        _id: commodity.commodity._id,
                        commodity_name: commodity.commodity.commodity_name,
                        commodity_type: commodity.commodity.commodity_type,
                        commodity_id: commodity.commodity.commodity_id
                    });
                });
                concession.transfers_query = [concession._id];
                concession.source_type = {p: false, c: false};
                concession.project_count = 0;
                concession.company_count = 0;
                concession.site_count = 0;
                concession.field_count  = 0;
                concession.contract_count = 0;
                Link.find({concession: concession._id})
                    .populate('commodity', '_id commodity_name commodity_type commodity_id')
                    .populate('company site project')
                    .deepPopulate('source.source_type_id site.site_commodity.commodity project.proj_commodity.commodity')
                    .exec(function (err, links) {
                        ++concession_counter;
                        link_len = links.length;
                        link_counter = 0;
                        if(link_len>0) {
                            links.forEach(function (link) {
                                ++link_counter;
                                var entity = _.without(link.entities, 'concession')[0];
                                if (!concession.source_type.p || !concession.source_type.c) {
                                    if (link.source != null) {
                                        if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                            concession.source_type.c = true;
                                        } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                            concession.source_type.c = true;
                                        } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                            concession.source_type.p = true;
                                        }
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
                                        if (link.project.proj_commodity.length>0) {
                                            if (_.where(concession.concession_commodity, {_id:_.last(link.project.proj_commodity)._id}).length<1) {
                                                concession.concession_commodity.push({
                                                    _id: _.last(link.project.proj_commodity).commodity._id,
                                                    commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                        if(link.project._id!=undefined) {
                                            if (!_.contains(concession.transfers_query, link.project._id)) {
                                                concession.transfers_query.push(link.project._id);
                                            }
                                        }
                                        concession.project_count += 1;
                                        break;
                                    case 'site':
                                        if (link.site.site_commodity.length>0) {
                                            if (_.where(concession.concession_commodity, {_id:_.last(link.site.site_commodity)._id}).length<1) {
                                                concession.concession_commodity.push({
                                                    _id: _.last(link.site.site_commodity).commodity._id,
                                                    commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                                });
                                            }
                                        }

                                        if(link.site._id!=undefined) {
                                            if (!_.contains(concession.transfers_query, link.site._id)) {
                                                concession.transfers_query.push(link.site._id);
                                            }
                                        }
                                        if (!link.site.field) {
                                            concession.site_count += 1;
                                        } else if (link.site.field) {
                                            concession.field_count += 1;
                                        }
                                        break;
                                    default:
                                        console.log(entity, 'skipped...');
                                }
                                if (concession_counter == concession_len && link_counter == link_len) {
                                    callback(null, concession_count, concessions);
                                }
                            });
                        } else {
                            if (concession_counter == concession_len) {
                                callback(null, concession_count, concessions);
                            }
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
        if(concession_len>0) {
            _.each(concessions, function (concession) {
                Transfer.find({
                    $or: [
                        {project: {$in: concession.transfers_query}},
                        {site: {$in: concession.transfers_query}},
                        {concession: {$in: concession.transfers_query}}
                    ]
                })
                    .count()
                    .exec(function (err, transfer_count) {
                        ++concession_counter;
                        concession.transfer_count = transfer_count;
                        if (concession_counter === concession_len) {
                            callback(null, concession_count, concessions);
                        }
                    });

            });
        }else{
            callback(null, concession_count, concessions);
        }
    }
    function getProductionCount(concession_count, concessions, callback) {
        concession_len = concessions.length;
        concession_counter = 0;
        if(concession_len>0) {
            _.each(concessions, function (concession) {
                Production.find({
                    $or: [
                        {project: {$in: concession.transfers_query}},
                        {site: {$in: concession.transfers_query}},
                        {concession: {$in: concession.transfers_query}}]
                })
                    .count()
                    .exec(function (err, production_count) {
                        ++concession_counter;
                        concession.production_count = production_count;
                        if (concession_counter === concession_len) {
                            callback(null, {data: concessions, count: concession_count});
                        }
                    });

            });
        }else{
            callback(null, concession_count, concessions);
        }
    }
};

exports.getConcessionByID = function(req, res) {
    var link_counter, link_len;

    async.waterfall([
        getConcession,
        getConcessionLinks
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else{
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });

    function getConcession(callback) {
        Concession.findOne({_id:req.params.id})
            .populate('concession_aliases', ' _id alias')
            .populate('concession_country.country')
            .populate('concession_commodity.commodity')
            .deepPopulate('concession_company_share.company')
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
        concession.contracts = [];
        concession.source_type = {p: false, c: false};
        concession.polygon=[];
        concession.proj_coordinates = [];
        var commodities=concession.concession_commodity;
        concession.concession_commodity=[];
        _.each(commodities,function(commodity){
            concession.concession_commodity.push({
                _id: commodity.commodity._id,
                commodity_name: commodity.commodity.commodity_name,
                commodity_type: commodity.commodity.commodity_type,
                commodity_id: commodity.commodity.commodity_id
            });
        })
        if (concession.concession_polygon && concession.concession_polygon.length>0) {
            var len=concession.concession_polygon.length;
            var counter=0;
            var coordinate=[];
            concession.concession_polygon.forEach(function (con_loc) {
                ++counter;
                if(con_loc && con_loc.loc) {
                    coordinate.push({
                        'lat': con_loc.loc[0],
                        'lng': con_loc.loc[1]
                    });
                }
                if(len==counter){
                    concession.polygon.push({coordinate:coordinate});
                }
            })
        }
        Link.find({concession: concession._id})
            .populate('contract company')
            .deepPopulate('project.proj_country.country project.proj_commodity.commodity site.site_commodity.commodity source.source_type_id')
            .exec(function(err, links) {
                link_len = links.length;
                link_counter = 0;
                if(link_len>0) {
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'concession')[0];
                        if (!concession.source_type.p || !concession.source_type.c) {
                            if(link.source!=null) {
                                if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                    concession.source_type.c = true;
                                } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                    concession.source_type.c = true;
                                } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                    concession.source_type.p = true;
                                }
                            }
                        }
                        switch (entity) {
                            case 'contract':
                                if (!_.contains(concession.contracts, link.contract.contract_id)) {
                                    concession.contracts.push(link.contract);
                                }
                                break;
                            case 'project':
                                if (link.project.proj_commodity.length>0) {
                                    if (_.where(concession.concession_commodity, {_id:_.last(link.project.proj_commodity).commodity._id}).length<1) {
                                        concession.concession_commodity.push({
                                            _id: _.last(link.project.proj_commodity).commodity._id,
                                            commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                        });
                                    }
                                }
                                break;
                            case 'site':
                                if (link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        if(loc && loc.loc) {
                                            concession.proj_coordinates.push({
                                                'lat': loc.loc[0],
                                                'lng': loc.loc[1],
                                                'message': link.site.site_name,
                                                'timestamp': loc.timestamp,
                                                'type': 'field',
                                                'id': link.site._id
                                            });
                                        }
                                    });
                                } else if (!link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        if(loc && loc.loc) {
                                            concession.proj_coordinates.push({
                                                'lat': loc.loc[0],
                                                'lng': loc.loc[1],
                                                'message': link.site.site_name,
                                                'timestamp': loc.timestamp,
                                                'type': 'site',
                                                'id': link.site._id
                                            });
                                        }
                                    });
                                }
                                if (link.site.site_commodity.length>0) {
                                    if (_.where(concession.concession_commodity, {_id:_.last(link.site.site_commodity).commodity._id}).length<1) {
                                        concession.concession_commodity.push({
                                            _id: _.last(link.site.site_commodity).commodity._id,
                                            commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                        });
                                    }
                                }
                                break;
                            default:
                                console.log(entity, 'link skipped...');
                        }
                        if (link_counter == link_len) {
                            callback(null, concession);
                        }
                    });
                } else{
                    callback(null, concession);
                }
            });
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