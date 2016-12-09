var Concession 		= require('mongoose').model('Concession'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    Link            = require('mongoose').model('Link'),
    errors 	        = require('./errorList'),
    mongoose 		= require('mongoose'),
    async           = require('async'),
    _               = require("underscore");

// Get All Concessions
exports.getConcessions = function(req, res) {
    var concessionLen, data={}, concessionCounter, transfersQuery=[],
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);
    async.waterfall([
        getConcessionCount,
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
    function getConcessionCount(callback) {
        data.concessions = [];
        data.errorList = [];
        data.count = 0;
        Concession.find({}).count().exec(function(err, concession_count) {
            if (err) {
                err = new Error('Error: '+ err);
                return res.send({reason: err.toString()});
            } else if (concession_count == 0) {
                return res.send({reason: 'not found'});
            } else {
                data.count = concession_count
                callback(null, data);
            }
        });
    }
    function getConcessionSet(data, callback) {
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
                data.errorList = errors.errorFunction(err, 'Concession links');
                return res.send(data);
            } else if (concessions.length>0) {
                data.concessions = concessions;
                callback(null, data);
            } else {
                return res.send(data);
            }
        });
    }
    function getConcessionLinks(data, callback) {
        var concessionsId = _.pluck(data.concessions, '_id');
        Link.aggregate([
            {$match: {$or: [{concession: {$in: concessionsId }}]}},
            {$lookup: {from: "projects",localField: "project",foreignField: "_id",as: "project"}},
            {$lookup: {from: "sites",localField: "site",foreignField: "_id",as: "site"}},
            {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
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
                site:['$site'],
                project_id: { $concatArrays: [ ["$site"], ["$project"] ] }
            }
            },
            {$project:{_id:1,
                commodity:1,
                project:1,
                field: {
                    $filter: {
                        input: "$site",
                        as: "site",
                        cond: { $and: [ "$$site.field", true ] }
                    }
                },
                site:{
                    $filter: {
                        input: "$site",
                        as: "item",
                        cond: { $and: [ "$$item.field", false ] }
                    }
                },
                project_id:1
            }
            },
            {$unwind: {"path": "$project_id", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$field", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$field", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$commodity", "preserveNullAndEmptyArrays": true}},
            {$group:{
                _id:'$_id',
                commodity:{$addToSet:'$commodity'},
                project:{$addToSet:'$project.proj_id'},
                project_id:{$addToSet:'$project_id._id'},
                site:{$addToSet:'$site._id'},
                field:{$addToSet:'$field._id'}
            }},
            {$project:{
                _id:1,project_count:{$size:'$project'},project_id:1,
                site_count:{$size:'$site'},
                field_count:{$size:'$field'},commodity:1
            }}
        ]).exec(function (err, links) {
                if (err) {
                    data.errorList = errors.errorFunction(err, 'Concession links');
                    callback(null, data);
                }
                else {
                    if (links.length > 0) {
                        _.map(data.concessions, function (concession) {
                            var list = _.find(links, function (link) {
                                if(link.project_id) {link.project_id.reduce(function(result, item) {transfersQuery.push(item)}, {})}
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
                        transfersQuery=_.uniq(transfersQuery)
                        callback(null, data);
                    } else {
                        data.errorList.push({type: 'Concession links', message: 'concession links not found'})
                        callback(null, data);
                    }
                }
            })
    }
    function getTransfersCount(data, callback) {
        concessionLen = data.concessions.length;
        concessionCounter = 0;
        if(concessionLen>0) {
            _.each(data.concessions, function (concession) {
                if(concession.project_id.length>0) {
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
                                data.errorList = errors.errorFunction(err, 'concession transfers');
                                callback(null, data);
                            }
                            else {
                                ++concessionCounter;
                                concession.transfer_count = transfer_count;
                                if (concessionCounter === concessionLen) {
                                    callback(null, data);
                                }
                            }
                        });
                } else{
                    ++concessionCounter;
                    if (concessionCounter === concessionLen) {
                        callback(null, data);
                    }
                }
            });
        }else{
            callback(null, data);
        }
    }
    function getProductionCount(data, callback) {
        concessionLen = data.concessions.length;
        concessionCounter = 0;
        if(concessionLen>0) {
            _.each(data.concessions, function (concession) {
                if(concession.project_id.length>0) {
                    Production.find({
                        $or: [
                            {project: {$in: concession.project_id}},
                            {site: {$in: concession.project_id}},
                            {concession: {$in: concession.project_id}}]
                    })
                        .count()
                        .exec(function (err, production_count) {
                            if (err) {
                                data.errorList = errors.errorFunction(err, 'concession productions');
                                callback(null, data);
                            }
                            else {
                                ++concessionCounter;
                                concession.production_count = production_count;
                                if (concessionCounter === concessionLen) {
                                    callback(null, data);
                                }
                            }
                        });
                } else{
                    ++concessionCounter;
                    if (concessionCounter === concessionLen) {
                        callback(null, data);
                    }
                }
            });
        }else{
            callback(null, data);
        }
    }
};

// Get Concession By ID
exports.getConcessionByID = function(req, res) {
    var id = mongoose.Types.ObjectId(req.params.id);
    var data={};

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
        data.concession = [];
        data.errorList = [];

        Concession.aggregate([
            {$match: {_id:id}},
            {$unwind: {"path": "$concession_country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession_aliases", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession_company_share", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession_status", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "countries", localField: "concession_country.country",foreignField: "_id",as: "concession_country.country"}},
            {$lookup: {from: "companies", localField: "concession_company_share.company",foreignField: "_id",as: "concession_company_share.company"}},
            {$lookup: {from: "commodities", localField: "concession_commodity.commodity",foreignField: "_id",as: "concession_commodity.commodity"}},
            {$unwind: {"path": "$concession_country.country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession_commodity.commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession_company_share.company", "preserveNullAndEmptyArrays": true}},
            {$project:{
                _id:1, concession_established_source:1, concession_name:1,
                concession_company_share:{
                    _id:'$concession_company_share.company._id',
                    iso2:'$concession_company_share.company.company_name',
                    number:'$concession_company_share.number'
                },
                concession_country:{
                    _id:'$concession_country.country._id',
                    iso2:'$concession_country.country.iso2',
                    name:'$concession_country.country.name'
                },
                concession_commodity:{
                    _id:'$concession_commodity.commodity._id',
                    commodity_name:'$concession_commodity.commodity.commodity_name',
                    commodity_type:'$concession_commodity.commodity.commodity_type',
                    commodity_id:'$concession_commodity.commodity.commodity_id'
                },
                concession_aliases: {_id:'$concession_aliases._id', alias:'$concession_aliases.alias'},
                description:1,concession_status:1,oo_url_api:1,oo_url_wiki:1,oo_details:1
            }},
            {$unwind: {"path": "$concession_commodity", "preserveNullAndEmptyArrays": true}},
            {$group:{
                _id:'$_id',
                concession_name:{$first:'$concession_name'},
                concession_established_source:{$first:'$concession_established_source'},
                concession_company_share:{$addToSet:'$concession_company_share'},
                concession_country:{$addToSet:'$concession_country'},
                concession_aliases:{$addToSet:'$concession_aliases'},
                description:{$first:'$description'},
                concession_status:{$addToSet:'$concession_status'},
                concession_commodity:{$addToSet:'$concession_commodity'},
                oo_url_api:{$first:'$oo_url_api'},
                oo_url_wiki:{$first:'$oo_url_wiki'},
                oo_details:{$first:'$oo_details'}
            }}
        ]).exec(function(err, concession) {
                if (err) {
                    data.errorList = errors.errorFunction(err, 'Concession ' + id);
                    res.send(data);
                } else {
                    if (concession.length > 0) {
                        data.concession = concession[0]
                        callback(null, data);
                    } else {
                        data.errorList.push({type: 'Concession ' + id, message: 'concession '+ id+' not found'})
                        callback(null, data);
                    }
                }
            });
    }

    function getConcessionLinks(data, callback) {
        Link.aggregate([
                {$match: {concession:id}},
                {$lookup: {from: "contracts", localField: "contract",foreignField: "_id",as: "contract"}},
                {$lookup: {from: "projects", localField: "project",foreignField: "_id",as: "project"}},
                {$lookup: {from: "sites", localField: "site",foreignField: "_id",as: "site"}},
                {$unwind: {"path": "$contract", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site.site_coordinates", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$project.proj_commodity", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site.site_commodity", "preserveNullAndEmptyArrays": true}},
                {$lookup: {from: "commodities", localField: "project.proj_commodity.commodity",foreignField: "_id",as: "project.proj_commodity"}},
                {$lookup: {from: "commodities", localField: "site.site_commodity.commodity",foreignField: "_id",as: "site.site_commodity"}},
                {$project: {
                    commodity: {$setUnion: ["$project.proj_commodity", "$site.site_commodity"]},
                    concession: 1,
                    contract: 1,
                    coordinates: {
                        $cond: {
                            if: {$not: "$site"},
                            then: [],
                            else: {
                                $cond: {
                                    if: {$not: "$site.site_coordinates"},
                                    then: [],
                                    else: {
                                        _id: '$site._id',
                                        'lat': {"$arrayElemAt": ["$site.site_coordinates.loc", -2]},
                                        'lng': {"$arrayElemAt": ["$site.site_coordinates.loc", -1]},
                                        'message': "$site.site_name",
                                        'timestamp': "$site.site_coordinates.timestamp",
                                        'type': {$cond: {if: {$gte: ["$site.field", true]}, then: 'field', else: 'site'}}

                                    }
                                }}
                        }
                    }
                }},
                {$unwind: {"path": "$commodity", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$coordinates", "preserveNullAndEmptyArrays": true}},
                {$group:{
                    _id:null,
                    commodity:{$addToSet:'$commodity'},
                    contract:{$addToSet:'$contract'},
                    coordinates:{$addToSet:'$coordinates'}
                }}
            ]).exec(function (err, links) {
            if (err) {
                data.errorList = errors.errorFunction(err, 'Concession ' + id + ' links');
                res.send(data);
            } else {
                if (links.length > 0) {
                    data.concession.proj_coordinates = links[0].coordinates;
                    data.concession.contracts = links[0].contract;
                    if(data.concession.concession_commodity.length>0 && !_.isEmpty(data.concession.concession_commodity[0])){
                        data.concession.concession_commodity = _.union(data.concession.concession_commodity, links[0].commodity);
                    } else{
                        data.concession.concession_commodity = links[0].commodity;
                    }
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Concession ' + id, message: 'concession ' + id + ' links not found'})
                    callback(null, data);
                }
            }
        })
    }
};


exports.getConcessionData = function(req, res) {
    var id = mongoose.Types.ObjectId(req.params.id);
    var data={};

    async.waterfall([
        getConcessionCompany,
        getCompanyGroup,
        getLinkedProjects
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

    function getConcessionCompany(callback) {
        data.errorList = [];
        data.companies = [];
        data.projects = [];

        Link.aggregate([
            {$match: {concession: id, entities: "company"}},
            {$lookup: {from: "companies", localField: "company", foreignField: "_id", as: "company"}},
            {$unwind: "$company"},
            {$project:{_id:1, company:{company_name:'$company.company_name', _id:'$company._id',
                company_groups:{$literal:[]}}}},
            {$group:{
                _id: null,
                company:{$addToSet:'$company'}
            }
            },
            {$skip:0},
            {$limit:50}
        ]).exec(function (err, links) {
            if (err) {
                data.errorList = errors.errorFunction(err, 'Concession links');
                callback(null, data);
            } else {
                if (links.length > 0) {
                    data.companies = links[0].company;
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Concession links', message: 'concession links not found'})
                    callback(null, data);
                }
            }
        });
    }

    function getCompanyGroup(data, callback) {
        var companiesId = _.pluck(data.companies, '_id');
        Link.aggregate([
            {$match: {$or: [{company: {$in: companiesId}}], entities: 'company_group'}},
            {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
            {$lookup: {from: "companygroups",localField: "company_group",foreignField: "_id",as: "company_group"}},
            {$unwind: '$company'},
            {$unwind: '$company_group'},
            {$group:{
                _id:'$company._id',company_name:{$first:'$company.company_name'},
                company_groups:{$addToSet:'$company_group'}
            }},
            {$project:{
                _id:1,company_name:1,
                company_groups:1}}
        ]).exec(function (err, links) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Company links');
                callback(null, data);
            }else {
                if (links.length > 0) {
                    _.map(data.companies, function(company){
                        var list = _.find(links, function(link){
                            return company._id.toString() == link._id.toString(); });
                        if(list && list.company_groups) {
                            company.company_groups = list.company_groups;
                        }
                        return company;
                    });
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Company links', message: 'company links not found'})
                    callback(null, data);
                }
            }
        });
    }

    function getLinkedProjects(data, callback) {
        Link.aggregate([
            {$match: {concession: id, entities:"project"}},
            {$lookup: {from: "projects", localField: "project", foreignField: "_id", as: "project"}},
            {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project.proj_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project.proj_country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project.proj_status", "preserveNullAndEmptyArrays": true}},
            {
                $lookup: {
                    from: "commodities",
                    localField: "project.proj_commodity.commodity",
                    foreignField: "_id",
                    as: "project.proj_commodity"
                }
            },
            {
                $lookup: {
                    from: "countries",
                    localField: "project.proj_country.country",
                    foreignField: "_id",
                    as: "project.proj_country"
                }
            },
            {$unwind: {"path": "$project.proj_country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project.proj_commodity", "preserveNullAndEmptyArrays": true}},
            {
                $project: {
                    _id: '$project.proj_id',
                    proj_id: '$project.proj_id',
                    proj_name: '$project.proj_name',
                    proj_commodity: '$project.proj_commodity',
                    proj_country: '$project.proj_country',
                    proj_status: '$project.proj_status'
                }
            },
            {
                $group: {
                    _id: '$_id',
                    proj_id: {$first: '$proj_id'},
                    proj_name: {$first: '$proj_name'},
                    proj_commodity: {$addToSet: '$proj_commodity'},
                    proj_country: {$addToSet: '$proj_country'},
                    proj_status: {$addToSet: '$proj_status'}
                }
            },
            {
                $project: {
                    _id: 1,
                    proj_site: {_id: '$proj_id'},
                    proj_name: 1,
                    proj_id: 1,
                    proj_commodity: 1,
                    proj_country: 1,
                    proj_status: 1,
                    companies_count: {$literal: 0},
                    companies: {$literal: []}
                }
            },
            {$skip: 0},
            {$limit: 50}
        ]).exec(function (err, links) {
                if (err) {
                    data.errorList = errors.errorFunction(err, 'project links');
                    res.send(data);
                } else {
                    if (links.length > 0) {
                        data.projects = links;
                        callback(null, data);
                    } else {
                        data.errorList.push({type: 'project links', message: 'project links not found'})
                        callback(null, data);
                    }
                }
            });
    }

};

exports.createConcession = function(req, res) {
    var concessionData = req.body;
    Concession.create(concessionData, function(err) {
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
    Concession.findOne({_id:req.body._id}).exec(function(err, concession) {
        if(err) {
            res.status(400);
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
        concession.concession_name= req.body.concession_name;
        concession.description= req.body.description;
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