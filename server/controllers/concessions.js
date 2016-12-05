var Concession 		= require('mongoose').model('Concession'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    Link            = require('mongoose').model('Link'),
    errors 	        = require('./errorList'),
    async           = require('async'),
    _               = require("underscore");

exports.getConcessions = function(req, res) {
    var concession_len, link_len, concession_counter, transfers_query=[],
        limit = Number(req.params.limit),errorList=[],
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
            if (err) {
                err = new Error('Error: '+ err);
                return res.send({reason: err.toString()});
            } else if (concession_count == 0) {
                return res.send({reason: 'not found'});
            } else {
                callback(null, concession_count);
            }
        });
    }
    function getConcessionSet(concession_count, callback) {
        Concession.aggregate([
            {$sort: {concession_name: -1}},
            {$unwind: {"path": "$concession_country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession_commodity", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "countries", localField: "concession_country.country", foreignField: "_id", as: "concession_country"}},
            {$lookup: {from: "commodities", localField: "concession_commodity.commodity", foreignField: "_id", as: "concession_commodity"}},
            {$unwind: {"path": "$concession_country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession_status", "preserveNullAndEmptyArrays": true}},
            {$project: {_id:1,concession_name:1,concession_country:{_id:'$concession_country._id', iso2:'$concession_country.iso2',
                name:'$concession_country.name'},
                concession_commodity:{_id:'$concession_commodity._id', commodity_type:'$concession_commodity.commodity_type',
                    commodity_id:'$concession_commodity.commodity_id', commodity_name:'$concession_commodity.commodity_name'},
                concession_status:'$concession_status'
            }
            },
            {$group:{
                _id:'$_id',
                concession_name:{$first:'$concession_name'},
                concession_status:{$first:'$concession_status'},
                concession_country:{$addToSet:'$concession_country'},
                concession_commodity:{$addToSet:'$concession_commodity'}
            }},
            {$project:{_id:1,concession_name:1,concession_status:1,concession_country:1,concession_commodity:1,
             project_count:{$literal:0}, site_count:{$literal:0}, field_count:{$literal:0}, transfer_count:{$literal:0}, production_count:{$literal:0}, project_id:[]
            }},
            {$skip: skip},
            {$limit: limit}
        ]).exec(function(err, concessions) {
            if (err) {
                err = new Error('Error: '+ err);
                return res.send({reason: err.toString()});
            } else if (concessions.length>0) {
                callback(null, concession_count, concessions);
            } else {
                return res.send({reason: 'not found'});
            }
        });
    }
    function getConcessionLinks(concession_count, concessions, callback) {
        var concessions_id = _.pluck(concessions, '_id');
        Link.aggregate([
            {$match: {$or: [{concession: {$in: concessions_id }}]}},
            {$lookup: {from: "projects",localField: "project",foreignField: "_id",as: "project"}},
            {$lookup: {from: "sites",localField: "site",foreignField: "_id",as: "site"}},
            {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project.proj_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site.site_commodity", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "commodities",localField: "project.proj_commodity.commodity",foreignField: "_id",as: "proj_commodity"}},
            {$lookup: {from: "commodities",localField: "site.site_commodity.commodity",foreignField: "_id",as: "site_commodity"}},
            {$unwind: {"path": "$proj_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site_commodity", "preserveNullAndEmptyArrays": true}},
            {$project:{_id:'$concession',
                commodity:{$cond: { if:  {$not: "$proj_commodity" },
                    then: {$cond: { if:  {$not: "$site_commodity" },then:[] , else:{__id:"$site_commodity._id",commodity_type:"$site_commodity.commodity_type",
                        commodity_id:'$site_commodity.commodity_id', commodity_name:'$site_commodity.commodity_name'}
                    }} ,
                    else:  {_id:"$proj_commodity._id",commodity_type:"$proj_commodity.commodity_type",
                        commodity_id:'$proj_commodity.commodity_id', commodity_name:'$proj_commodity.commodity_name'}}},
                project:1,
                fields: {$cond: { if:  {$not: "$site" },
                    then: [], else: {$cond: { if:  {$gte: ["$site.field", true] },then:[] , else: '$site'}}}
                },sites: {$cond: { if:  {$not: "$site" },
                    then: [], else: {$cond: { if:  {$gte: ["$site.field", false] },then:[] , else: '$site'}}}
                },
                project_id: { $concatArrays: [ ["$site"], ["$project"] ] }
            }
            },
            {$unwind: {"path": "$project_id", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$fields", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$sites", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$commodity", "preserveNullAndEmptyArrays": true}},
            {$group:{
                _id:'$_id',
                commodity:{$addToSet:'$commodity'},
                project:{$addToSet:'$project'},
                project_id:{$addToSet:'$project_id._id'},
                site:{$addToSet:'$sites'},
                field:{$addToSet:'$fields'}
            }},
            {$project:{
                _id:1,project_count:{$size:'$project'},project_id:1,
                site_count:{$size:'$site'},
                field_count:{$size:'$field'},commodity:1
            }}
        ]).exec(function (err, links) {
                if (err) {
                    errorList = errors.errorFunction(err, 'Concession links');
                    callback(null, concession_count, concessions, errorList);
                }
                else {
                    if (links.length > 0) {
                        _.map(concessions, function (concession) {
                            var list = _.find(links, function (link) {
                                if(link.project_id) {link.project_id.reduce(function(result, item) {transfers_query.push(item)}, {})}
                                return link._id.toString() == concession._id.toString();
                            });
                            if (list) {
                                concession.concession_commodity.push(list.commodity[0]);
                                concession.project_id = list.project_id;
                                concession.project_count = list.project_count;
                                concession.site_count = list.site_count;
                                concession.field_count = list.field_count;
                            }
                            return concession;
                        });
                        transfers_query=_.uniq(transfers_query)
                        callback(null, concession_count, concessions, errorList);
                    } else {
                        errorList.push({type: 'Concession links', message: 'concession links not found'})
                        callback(null, concession_count, concessions, errorList);
                    }
                }
            })
    }
    function getTransfersCount(concession_count, concessions,errorList, callback) {
        concession_len = concessions.length;
        concession_counter = 0;
        if(concession_len>0) {
            _.each(concessions, function (concession) {
                Transfer.find({
                    $or: [
                        {project: {$in: concession.project_id}},
                        {site: {$in: concession.project_id}},
                        {concession: {$in: concession.project_id}}
                    ]
                })
                    .count()
                    .exec(function (err, transfer_count) {
                        if (err) {
                            errorList = errors.errorFunction(err, 'concession transfers');
                            callback(null, concession_count, concessions, errorList);
                        }
                        else {
                            ++concession_counter;
                            concession.transfer_count = transfer_count;
                            if (concession_counter === concession_len) {
                                callback(null, concession_count, concessions, errorList);
                            }
                        }
                    });
            });
        }else{
            callback(null, concession_count, concessions, errorList);
        }
    }
    function getProductionCount(concession_count, concessions, errorList, callback) {
        concession_len = concessions.length;
        concession_counter = 0;
        if(concession_len>0) {
            _.each(concessions, function (concession) {
                Production.find({
                    $or: [
                        {project: {$in: concession.project_id}},
                        {site: {$in: concession.project_id}},
                        {concession: {$in: concession.project_id}}]
                })
                    .count()
                    .exec(function (err, production_count) {
                        if (err) {
                            errorList = errors.errorFunction(err, 'concession productions');
                            callback(null, {data: concessions, count: concession_count, errorList:errorList});
                        }
                        else {
                            ++concession_counter;
                            concession.production_count = production_count;
                            if (concession_counter === concession_len) {
                            callback(null, {data: concessions, count: concession_count, errorList:errorList});
                            }
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
                    callback(null, concession);
                }
            });
    }

    function getConcessionLinks(concession, callback) {
        if(concession) {
            concession.contracts = [];
            concession.source_type = {p: false, c: false};
            concession.polygon = [];
            concession.proj_coordinates = [];
            var commodities = concession.concession_commodity;
            concession.concession_commodity = [];
            _.each(commodities, function (commodity) {
                concession.concession_commodity.push({
                    _id: commodity.commodity._id,
                    commodity_name: commodity.commodity.commodity_name,
                    commodity_type: commodity.commodity.commodity_type,
                    commodity_id: commodity.commodity.commodity_id
                });
            })
            if (concession.concession_polygon && concession.concession_polygon.length > 0) {
                var len = concession.concession_polygon.length;
                var counter = 0;
                var coordinate = [];
                concession.concession_polygon.forEach(function (con_loc) {
                    ++counter;
                    if (con_loc && con_loc.loc) {
                        coordinate.push({
                            'lat': con_loc.loc[0],
                            'lng': con_loc.loc[1]
                        });
                    }
                    if (len == counter) {
                        concession.polygon.push({coordinate: coordinate});
                    }
                })
            }
            Link.find({concession: concession._id})
                .populate('contract company')
                .deepPopulate('project.proj_country.country project.proj_commodity.commodity site.site_commodity.commodity source.source_type_id')
                .exec(function (err, links) {
                    link_len = links.length;
                    link_counter = 0;
                    if (link_len > 0) {
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
                                case 'contract':
                                    if (!_.contains(concession.contracts, link.contract.contract_id)) {
                                        concession.contracts.push(link.contract);
                                    }
                                    break;
                                case 'project':
                                    if (link.project.proj_commodity.length > 0) {
                                        if (_.where(concession.concession_commodity, {_id: _.last(link.project.proj_commodity).commodity._id}).length < 1) {
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
                                    if (link.site.field && link.site.site_coordinates.length > 0) {
                                        link.site.site_coordinates.forEach(function (loc) {
                                            if (loc && loc.loc) {
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
                                    } else if (!link.site.field && link.site.site_coordinates.length > 0) {
                                        link.site.site_coordinates.forEach(function (loc) {
                                            if (loc && loc.loc) {
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
                                    if (link.site.site_commodity.length > 0) {
                                        if (_.where(concession.concession_commodity, {_id: _.last(link.site.site_commodity).commodity._id}).length < 1) {
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
                    } else {
                        callback(null, concession);
                    }
                });
        } else {
            callback(null, {error:"Error"});
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