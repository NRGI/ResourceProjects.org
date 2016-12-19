var Project 		= require('mongoose').model('Project'),
    Country 		= require('mongoose').model('Country'),
    Source	 		= require('mongoose').model('Source'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    async           = require('async'),
    GoogleSpreadsheet = require('google-spreadsheet'),
    _               = require("underscore"),
    request         = require('request'),
    mongoose 		= require('mongoose'),
    errors 	        = require('./errorList')
    util            = require('util');

var creds = require('../config/ResourceProjectsPersistIDs.json');

//Get all projects
exports.getProjects = function(req, res) {
    var projectLen,  projectCounter,
        data={},
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    data.projects=[];
    data.errorList =[];
    data.count =0;

    async.waterfall([
        projectCount,
        getProjectSet,
        getProjectLinks,
        getTransfersCount,
        getProductionCount,
        getVerified
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Projects');
            return res.send(data);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function projectCount(callback) {
        Project.find({}).count().exec(function(err, project_count) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Projects');
                res.send(data);
            } else if (project_count == 0) {
                data.errorList = errors.errorFunction('Coordinates','Projects not found');
                res.send(data);
            } else {
                data.count = project_count;
                callback(null, data);
            }
        });
    }
    function getProjectSet(data, callback) {
        Project.aggregate([
            {$sort: {proj_name: -1}},
            {$unwind: {"path": "$proj_country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$proj_status", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$proj_commodity", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "countries",localField: "proj_country.country",foreignField: "_id",as: "proj_country"}},
            {$lookup: {from: "commodities",localField: "proj_commodity.commodity",foreignField: "_id",as: "proj_commodity"}},
            {$lookup: {from: "sources",localField: "proj_established_source",foreignField: "_id",as: "proj_established_source"}},
            {$unwind: {"path": "$proj_established_source", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "sourcetypes",localField: "proj_established_source.source_type_id",foreignField: "_id", as: "proj_established_source.source_type_id"}},
            {$unwind: {"path": "$proj_established_source.source_type_id", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$proj_country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$proj_commodity", "preserveNullAndEmptyArrays": true}},
            {$group: {
                _id: '$_id',
                proj_established_source:{$first:'$proj_established_source.source_type_id'},
                proj_name:{$first:'$proj_name'},
                proj_id:{$first:'$proj_id'},
                proj_country:{$addToSet:'$proj_country'},
                proj_status:{$addToSet:'$proj_status'},
                proj_commodity:{$addToSet:'$proj_commodity'}
            }},
            {$project:{
                _id:1, proj_established_source:1, proj_name:1, proj_id:1,
                proj_country:1,proj_status:1,proj_commodity:1,
                source_type:
                {$cond: { if:  {$not: "$proj_established_source" },
                    then: {p: {$literal: false}, c: {$literal: false}},
                    else:{
                        $cond: { if:  {$or: [ { $eq: [ "$proj_established_source.source_type_authority", 'authoritative' ] },
                            { $eq: [ "$proj_established_source.source_type_authority", 'non-authoritative'] } ]},then:{p: {$literal: false}, c: {$literal: true}} , else:
                        {p: {$literal: true}, c: {$literal: false}}
                        }}

                }
                },
                company_count: {$literal: 0},
                transfer_count: {$literal: 0},
                production_count: {$literal: 0},
                queries:{$literal:[]}
            }
            },
            {$skip: skip},
            {$limit: limit}
        ]).exec(function(err, projects) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Projects');
                res.send(data);
            }
            else {
                if (projects && projects.length>0) {
                    data.projects = projects;
                    callback(null,  data);
                } else {
                    data.errorList.push({type: 'Projects', message: 'projects not found'})
                    res.send(data)
                }
            }
        })
    }
    function getProjectLinks(data, callback) {
        var projectsId = _.pluck(data.projects, '_id');
        if(projectsId.length>0) {
            Link.aggregate([
                {$match: {$or: [{project:{$in: projectsId}}]}},
                {$lookup: {from: "sites",localField: "site",foreignField: "_id",as: "site"}},
                {$lookup: {from: "concessions",localField: "concession",foreignField: "_id",as: "concession"}},
                {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
                {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession.concession_commodity", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site.site_commodity", "preserveNullAndEmptyArrays": true}},
                {$lookup: {from: "commodities",localField: "site.site_commodity.commodity",foreignField: "_id",as: "site_commodity"}},
                {$lookup: {from: "commodities",localField: "concession.concession_commodity.commodity",foreignField: "_id",as: "concession_commodity"}},
                {$unwind: {"path": "$site_commodity", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession_commodity", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$source", "preserveNullAndEmptyArrays": true}},
                {$lookup: {from: "sources",localField: "source",foreignField: "_id",as: "source"}},
                {$unwind: {"path": "$source", "preserveNullAndEmptyArrays": true}},
                {$lookup: {from: "sourcetypes",localField: "source.source_type_id",foreignField: "_id", as: "source"}},
                {$unwind: {"path": "$source", "preserveNullAndEmptyArrays": true}},
                {$project: {
                    commodity: {$setUnion: ["$concession_commodity", "$site_commodity"]},
                    project: 1, site: 1, company:1,
                    source:1,
                    source_type:
                    {$cond: {
                        if: {$not: "$source"},
                        then: {p: {$literal: false}, c: {$literal: false}},
                        else: {
                            $cond: {
                                if: {
                                    $or: [{$eq: ["$source.source_type_authority", 'authoritative']},
                                        {$eq: ["$source.source_type_authority", 'non-authoritative']}]
                                }, then: {c: {$literal: true}}, else: {p: {$literal: true}}
                            }
                        }
                    }}
                }},
                {$group:{
                    _id:'$project',
                    commodity:{$addToSet:'$commodity'},
                    site:{$addToSet:'$site._id'},
                    company:{$addToSet:'$company._id'},
                    p:{$addToSet:'$source_type.p'},
                    c:{$addToSet:'$source_type.c'}
                }},
                {$unwind: {"path": "$p", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$c", "preserveNullAndEmptyArrays": true}},
                {$project: {
                    source_type: {p:{$cond: { if:  {$eq: ["$p", true] },then:  true ,else:false}}, c:{$cond: { if:  {$eq: ["$c", true] },then:  true ,else:false}}},
                    site: 1,commodity:1,
                    company_count:{$size:'$company'}
                }}
            ]).exec(function(err, links) {
                if (err) {
                    data.errorList = errors.errorFunction(err,'Project links');
                    callback(null,  data);
                }
                else {
                    if (links && links.length>0) {
                        _.map(data.projects, function (project) {
                            project.queries.push(project._id);
                            var list = _.find(links, function (link) {
                                return link._id.toString() == project._id.toString();
                            });
                            if (list) {
                                project.proj_commodity.push(list.commodity[0]);
                                project.company_count = list.company_count;
                                project.queries = _.union(project.queries,list.site);
                                if(project.source_type.p!=true){
                                    project.source_type.p = list.source_type.p
                                }if(project.source_type.c!=true){
                                    project.source_type.c = list.source_type.c
                                }
                            }
                            return project;
                        });
                        callback(null,  data);
                    } else {
                        data.errorList.push({type: 'Project links', message: 'project links not found'})
                        callback(null,  data);
                    }
                }
            })
        } else{
            res.send(data);
        }
    }
    function getTransfersCount(data, callback) {
        var projectLen = data.projects.length;
        var projectCounter = 0;
        _.each(data.projects, function(project) {
            if (project.queries) {
                Transfer.aggregate([
                    {$match: {$or: [{project: {$in: project.queries}}, {site: {$in: project.queries}}]}},
                    {$unwind: {"path": "$source", "preserveNullAndEmptyArrays": true}},
                    {$lookup: {from: "sources", localField: "source", foreignField: "_id", as: "source"}},
                    {$unwind: {"path": "$source", "preserveNullAndEmptyArrays": true}},
                    {
                        $lookup: {
                            from: "sourcetypes",
                            localField: "source.source_type_id",
                            foreignField: "_id",
                            as: "source"
                        }
                    },
                    {$unwind: {"path": "$source", "preserveNullAndEmptyArrays": true}},
                    {
                        $project: {
                            source: 1,
                            project: 1,
                            source_type: {
                                $cond: {
                                    if: {$not: "$source"},
                                    then: {p: {$literal: false}, c: {$literal: false}},
                                    else: {
                                        $cond: {
                                            if: {
                                                $or: [{$eq: ["$source.source_type_authority", 'authoritative']},
                                                    {$eq: ["$source.source_type_authority", 'non-authoritative']}]
                                            }, then: {c: {$literal: true}}, else: {p: {$literal: true}}
                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        $group: {
                            _id: '$_id',
                            project: {$addToSet: '$project'},
                            p: {$addToSet: '$source_type.p'},
                            c: {$addToSet: '$source_type.c'}
                        }
                    },
                    {$unwind: {"path": "$p", "preserveNullAndEmptyArrays": true}},
                    {$unwind: {"path": "$c", "preserveNullAndEmptyArrays": true}},
                    {
                        $group: {
                            _id: null,
                            count: {$addToSet: '$_id'},
                            p: {$addToSet: '$p'},
                            c: {$addToSet: '$c'}

                        }
                    },
                    {
                        $project: {
                            source_type: {
                                p: {$cond: {if: {$eq: ["$p", true]}, then: true, else: false}},
                                c: {$cond: {if: {$eq: ["$c", true]}, then: true, else: false}}
                            },
                            count: {$size: '$count'}
                        }
                    }]).exec(function (err, transfer_count) {
                    if (err) {
                        data.errorList = errors.errorFunction(err, 'Project transfers');
                        ++projectCounter;
                        if (projectCounter === projectLen) {
                            callback(null, data);
                        }
                    }
                    else {
                        ++projectCounter;
                        if (transfer_count.length > 0) {
                            if (project.source_type.p != true) {
                                project.source_type.p = transfer_count[0].source_type.p
                            }
                            if (project.source_type.c != true) {
                                project.source_type.c = transfer_count[0].source_type.c
                            }
                            project.transfer_count = transfer_count[0].count;
                        }
                        if (projectCounter === projectLen) {
                            callback(null, data);
                        }
                    }
                });
            } else {
                ++projectCounter;
                if (projectCounter === projectLen) {
                    callback(null, data);
                }
            }
        });
    }
    function getProductionCount(data, callback) {
        var projectLen = data.projects.length;
        var projectCounter = 0;
        _.each(data.projects, function(project) {
            if (project.queries) {
                Production.aggregate([
                    {$match: {$or: [{project: {$in: project.queries}}, {site: {$in: project.queries}}]}},
                    {$unwind: {"path": "$source", "preserveNullAndEmptyArrays": true}},
                    {$lookup: {from: "sources", localField: "source", foreignField: "_id", as: "source"}},
                    {$unwind: {"path": "$source", "preserveNullAndEmptyArrays": true}},
                    {
                        $lookup: {
                            from: "sourcetypes",
                            localField: "source.source_type_id",
                            foreignField: "_id",
                            as: "source"
                        }
                    },
                    {$unwind: {"path": "$source", "preserveNullAndEmptyArrays": true}},
                    {
                        $project: {
                            source: 1,
                            project: 1,
                            source_type: {
                                $cond: {
                                    if: {$not: "$source"},
                                    then: {p: {$literal: false}, c: {$literal: false}},
                                    else: {
                                        $cond: {
                                            if: {
                                                $or: [{$eq: ["$source.source_type_authority", 'authoritative']},
                                                    {$eq: ["$source.source_type_authority", 'non-authoritative']}]
                                            }, then: {c: {$literal: true}}, else: {p: {$literal: true}}
                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        $group: {
                            _id: '$_id',
                            project: {$addToSet: '$project'},
                            p: {$addToSet: '$source_type.p'},
                            c: {$addToSet: '$source_type.c'}
                        }
                    },
                    {$unwind: {"path": "$p", "preserveNullAndEmptyArrays": true}},
                    {$unwind: {"path": "$c", "preserveNullAndEmptyArrays": true}},
                    {
                        $group: {
                            _id: null,
                            count: {$addToSet: '$_id'},
                            p: {$addToSet: '$p'},
                            c: {$addToSet: '$c'}

                        }
                    },
                    {
                        $project: {
                            source_type: {
                                p: {$cond: {if: {$eq: ["$p", true]}, then: true, else: false}},
                                c: {$cond: {if: {$eq: ["$c", true]}, then: true, else: false}}
                            },
                            count: {$size: '$count'}
                        }
                    }]).exec(function (err, production_count) {
                    if (err) {
                        data.errorList = errors.errorFunction(err, 'Project production');
                        ++projectCounter;
                        if (projectCounter === projectLen) {
                            callback(null, data);
                        }
                    }
                    else {
                        ++projectCounter;
                        if (production_count.length > 0) {
                            if (project.source_type.p != true) {
                                project.source_type.p = production_count[0].source_type.p
                            }
                            if (project.source_type.c != true) {
                                project.source_type.c = production_count[0].source_type.c
                            }
                            project.production_count = production_count[0].count;
                        }
                        if (projectCounter === projectLen) {
                            callback(null, data);
                        }
                    }
                });
            } else {
                ++projectCounter;
                if (projectCounter === projectLen) {
                    callback(null, data);
                }
            }
        });
    }
    function getVerified (data, callback) {
        projectLen = data.projects.length;
        projectCounter = 0;
        if (projectLen > 0) {
            _.each(data.projects, function (project) {
                ++projectCounter;
                if (!project.source_type.c && !project.source_type.p) {
                    project.verified = 'none';
                } else if (project.source_type.c && !project.source_type.p) {
                    project.verified = 'context';
                } else if (!project.source_type.c && project.source_type.p) {
                    project.verified = 'payment';
                } else if (project.source_type.c && project.source_type.p) {
                    project.verified = 'verified';
                }
                if (projectCounter === projectLen) {
                    callback(null, data);
                }
            });
        } else {
            callback(null, data);
        }
    }
};

//Get project by id
exports.getProjectByID = function(req, res) {
    var data = {};
    data.project = [];
    data.errorList = [];

    async.waterfall([
        getProject,
        getProjectLinks
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Project');
            return res.send(data);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
	function getProject(callback) {
        Project.aggregate([
            {$match: {proj_id: req.params.id}},
            {$unwind: {"path": "$proj_country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$proj_status", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$proj_commodity", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "countries",localField: "proj_country.country",foreignField: "_id",as: "proj_country"}},
            {$lookup: {from: "commodities",localField: "proj_commodity.commodity",foreignField: "_id",as: "proj_commodity"}},
            {$lookup: {from: "sources",localField: "proj_established_source",foreignField: "_id",as: "proj_established_source"}},
            {$unwind: {"path": "$proj_established_source", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "sourcetypes",localField: "proj_established_source.source_type_id",foreignField: "_id", as: "proj_established_source.source_type_id"}},
            {$unwind: {"path": "$proj_established_source.source_type_id", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$proj_country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$proj_commodity", "preserveNullAndEmptyArrays": true}},
            {$group: {
                _id: '$_id',
                proj_established_source:{$first:'$proj_established_source.source_type_id'},
                proj_name:{$first:'$proj_name'},
                proj_id:{$first:'$proj_id'},
                proj_country:{$addToSet:'$proj_country'},
                proj_status:{$addToSet:'$proj_status'},
                proj_commodity:{$addToSet:'$proj_commodity'}
            }},
            {$project:{
                _id:1, proj_established_source:1, proj_name:1, proj_id:1,
                proj_country:1,proj_status:1,proj_commodity:1,
                source_type:
                {$cond: { if:  {$not: "$proj_established_source" },
                    then: {p: {$literal: false}, c: {$literal: false}},
                    else:{
                        $cond: { if:  {$or: [ { $eq: [ "$proj_established_source.source_type_authority", 'authoritative' ] },
                            { $eq: [ "$proj_established_source.source_type_authority", 'non-authoritative'] } ]},then:{p: {$literal: false}, c: {$literal: true}} , else:
                        {p: {$literal: true}, c: {$literal: false}}
                        }}

                }
                },
                company_count: {$literal: 0},
                transfer_count: {$literal: 0},
                production_count: {$literal: 0},
                concessions:{$literal:[]},
                contracts:{$literal:[]},
                coordinates:{$literal:[]}
            }}
        ]).exec(function(err, project) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Projects');
                res.send(data);
            }
            else {
                if (project && project.length>0) {
                    data.project = project[0];
                    callback(null,  data);
                } else {
                    data.errorList.push({type: 'Projects', message: 'projects not found'})
                    res.send(data)
                }
            }
        });
    }
    function getProjectLinks(data, callback) {
        if(data.project) {
            Link.aggregate([
                {$match: {project:data.project._id}},
                {$lookup: {from: "sites",localField: "site",foreignField: "_id",as: "site"}},
                {$lookup: {from: "concessions",localField: "concession",foreignField: "_id",as: "concession"}},
                {$lookup: {from: "contracts",localField: "contract",foreignField: "_id",as: "contract"}},
                {$unwind: {"path": "$contract", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession.concession_commodity", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site.site_commodity", "preserveNullAndEmptyArrays": true}},
                {$lookup: {from: "commodities",localField: "site.site_commodity.commodity",foreignField: "_id",as: "site_commodity"}},
                {$lookup: {from: "commodities",localField: "concession.concession_commodity.commodity",foreignField: "_id",as: "concession_commodity"}},
                {$unwind: {"path": "$site_commodity", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession_commodity", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$source", "preserveNullAndEmptyArrays": true}},
                {$lookup: {from: "sources",localField: "source",foreignField: "_id",as: "source"}},
                {$unwind: {"path": "$source", "preserveNullAndEmptyArrays": true}},
                {$lookup: {from: "sourcetypes",localField: "source.source_type_id",foreignField: "_id", as: "source"}},
                {$unwind: {"path": "$source", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site.site_coordinates", "preserveNullAndEmptyArrays": true}},
                {$project: {
                    commodity: {$setUnion: ["$concession_commodity", "$site_commodity"]},
                    project: 1, site: 1,  contract: 1, concession:{
                        _id:'$concession._id',concession_name:'$concession.concession_name'
                    },
                    source:1,
                    proj_coordinate:{
                        $cond: { if: { $not:  "$site.site_coordinates" }, then:[],
                            else:{
                                'lat':  { "$arrayElemAt": [ "$site.site_coordinates.loc", -2 ] },
                                'lng': { "$arrayElemAt": [ "$site.site_coordinates.loc", -1 ] },
                                'message': "$site.site_name",
                                'timestamp': "$site.site_coordinates.timestamp",
                                'type': {$cond: { if: { $gte: [ "$site.field", true ] }, then: 'field', else: 'site' }
                                }}
                        }},
                    source_type:
                    {$cond: {
                        if: {$not: "$source"},
                        then: {p: {$literal: false}, c: {$literal: false}},
                        else: {
                            $cond: {
                                if: {
                                    $or: [{$eq: ["$source.source_type_authority", 'authoritative']},
                                        {$eq: ["$source.source_type_authority", 'non-authoritative']}]
                                }, then: {c: {$literal: true}}, else: {p: {$literal: true}}
                            }
                        }
                    }}
                }},

                {$unwind: {"path": "$proj_coordinate", "preserveNullAndEmptyArrays": true}},
                {$group:{
                    _id:'$project',
                    concession:{$addToSet:'$concession'},
                    commodity:{$addToSet:'$commodity'},
                    contract:{$addToSet:'$contract'},
                    proj_coordinate:{$addToSet:'$proj_coordinate'},
                    p:{$addToSet:'$source_type.p'},
                    c:{$addToSet:'$source_type.c'}
                }},
                {$unwind: {"path": "$p", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$c", "preserveNullAndEmptyArrays": true}},
                {$project: {
                    concession:1, contract:1, proj_coordinate:1,
                    source_type: {p:{$cond: { if:  {$eq: ["$p", true] },then:  true ,else:false}}, c:{$cond: { if:  {$eq: ["$c", true] },then:  true ,else:false}}},
                    site: 1,commodity:1
                }}
            ]).exec(function(err, links) {
                if (err) {
                    data.errorList = errors.errorFunction(err,'Project links');
                    callback(null,  data);
                }
                else {
                    if (links && links.length>0) {
                        if(links[0].commodity && links[0].commodity.length>0 && _.isEmpty(links[0].commodity)) {
                            data.project.proj_commodity.push(links[0].commodity);
                        }
                        data.project.concessions = links[0].concession;
                        data.project.contracts = links[0].contract;
                        data.project.coordinates = links[0].proj_coordinate;
                        data.project.queries = _.union(data.project.queries,links[0].site);
                        if(data.project.source_type.p!=true){
                            data.project.source_type.p = links[0].source_type.p
                        }if(data.project.source_type.c!=true){
                            data.project.source_type.c = links[0].source_type.c
                        }
                        callback(null,  data);
                    } else {
                        data.errorList.push({type: 'Project links', message: 'project links not found'})
                        callback(null,  data);
                    }
                }
            })
        } else {
            callback(null, data);
        }
    }
};

//Get project tables(transfers, production, companies).
exports.getProjectData = function(req, res) {
    var data = {}, queries = [];
    data.transfers = [];
    data.productions = [];
    data.companies = [];
    data.errorList = [];
    var id = mongoose.Types.ObjectId(req.params.id);

    async.waterfall([
        getCompanies,
        getCompanyGroup,
        getPaymentsProductionsQuery,
        getProductions,
        getTransfers
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Projects');
            return res.send(data);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function getCompanies(callback) {
        Link.aggregate([
            {$match: {project: id, entities: "company"}},
            {$lookup: {from: "companies", localField: "company", foreignField: "_id", as: "company"}},
            {$unwind: "$company"},
            {
                $project: {
                    _id: 1, company: {
                        company_name: '$company.company_name', _id: '$company._id',
                        company_groups: {$literal: []}
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    company: {$addToSet: '$company'}
                }
            },
            {$skip: 0},
            {$limit: 50}
        ]).exec(function (err, links) {
            if (err) {
                data.errorList = errors.errorFunction(err, 'project companies links');
                callback(null, data);
            } else {
                if (links.length > 0) {
                    data.companies = links[0].company;
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'project companies links', message: 'project companies links not found'})
                    callback(null, data);
                }
            }
        });
    }
    function getCompanyGroup(data, callback) {
        var companiesId = _.pluck(data.companies, '_id');
        Link.aggregate([
            {$match: {$or: [{company: {$in: companiesId}}], entities: 'company_group'}},
            {$lookup: {from: "companies", localField: "company", foreignField: "_id", as: "company"}},
            {$lookup: {from: "companygroups", localField: "company_group", foreignField: "_id", as: "company_group"}},
            {$unwind: '$company'},
            {$unwind: '$company_group'},
            {
                $group: {
                    _id: '$company._id', company_name: {$first: '$company.company_name'},
                    company_groups: {$addToSet: '$company_group'}
                }
            },
            {
                $project: {
                    _id: 1, company_name: 1,
                    company_groups: 1
                }
            }
        ]).exec(function (err, links) {
            if (err) {
                data.errorList = errors.errorFunction(err, 'Company groups');
                callback(null, data);
            } else {
                if (links.length > 0) {
                    _.map(data.companies.companies, function (company) {
                        var list = _.find(links, function (link) {
                            return company._id.toString() == link._id.toString();
                        });
                        if (list && list.company_groups) {
                            company.company_groups = list.company_groups;
                        }
                        return company;
                    });
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Company groups', message: 'company groups not found'})
                    callback(null, data);
                }
            }
        });
    }
    function getPaymentsProductionsQuery(data, callback) {
        Link.aggregate([
            {$match: {project: id}},
            {
                $group: {
                    _id: null,
                    project: {$addToSet: '$project'},
                    site: {$addToSet: '$site'},
                    concession: {$addToSet: '$concession'},
                    company: {$addToSet: '$company'}
                }
            },
            {
                $project: {
                    _id: 0,
                    transfers_query: {$setUnion: ["$project", "$site", "$concession", "$company"]}
                }
            }
        ]).exec(function (err, links) {
            if (err) {
                data.errorList = errors.errorFunction(err, 'Company links');
                res.send(data);
            } else {
                if (links && links.length > 0) {
                    queries = links[0].transfers_query
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Company links', message: 'company links not found'})
                    res.send(data);
                }
            }
        });
    }
    function getProductions(data, callback) {
        if (queries && queries.length>0) {
            Production.aggregate([
                {$match: {$or: [{project: {$in: queries}}, {site: {$in: queries}}]}},
                {$lookup: {from: "projects", localField: "project", foreignField: "_id", as: "project"}},
                {
                    $lookup: {
                        from: "commodities",
                        localField: "production_commodity",
                        foreignField: "_id",
                        as: "production_commodity"
                    }
                },
                {$lookup: {from: "sites", localField: "site", foreignField: "_id", as: "site"}},
                {$unwind: {"path": "$production_commodity", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
                {
                    $project: {
                        _id: 1,
                        production_commodity: {
                            _id: "$production_commodity._id", commodity_name: "$production_commodity.commodity_name",
                            commodity_id: "$production_commodity.commodity_id"
                        },
                        company: {
                            $cond: {
                                if: {$not: "$company"},
                                then: '',
                                else: {_id: "$company._id", company_name: "$company.company_name"}
                            }
                        },
                        proj_site: {
                            $cond: {
                                if: {$not: "$site"},
                                then: {
                                    $cond: {
                                        if: {$not: "$project"},
                                        then: [], else: {
                                            _id: "$project.proj_id", name: "$project.proj_name",
                                            type: {$cond: {if: {$not: "$project"}, then: '', else: 'project'}}
                                        }
                                    }
                                },
                                else: {
                                    _id: "$site._id", name: "$site.site_name",
                                    type: {$cond: {if: {$gte: ["$site.field", true]}, then: 'field', else: 'site'}}
                                }
                            }
                        },
                        production_year: 1, production_volume: 1, production_unit: 1, production_price: 1,
                        production_price_unit: 1, production_level: 1
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        production_year: {$first: '$production_year'},
                        production_volume: {$first: '$production_volume'},
                        production_unit: {$first: '$production_unit'},
                        production_price: {$first: '$production_price'},
                        production_price_unit: {$first: '$production_price_unit'},
                        production_level: {$first: '$production_level'},
                        country: {$first: '$country'},
                        production_commodity: {$first: '$production_commodity'},
                        proj_site: {$first: '$proj_site'}
                    }
                },
                {$skip: 0},
                {$limit: 50}
            ]).exec(function (err, production) {
                if (err) {
                    data.errorList = errors.errorFunction(err, 'Productions');
                    callback(null, data);
                } else {
                    if (production.length > 0) {
                        data.productions = production;
                        callback(null, data);
                    } else {
                        data.errorList.push({type: 'Productions', message: 'productions not found'})
                        callback(null, data);
                    }
                }
            })
        } else{
            callback(null, data);
        }
    }
    function getTransfers(data, callback) {
        if (queries && queries.length>0) {
            Transfer.aggregate([
                {$match: {$or: [{project: {$in: queries}}, {site: {$in: queries}}]}},
                {$lookup: {from: "projects", localField: "project", foreignField: "_id", as: "project"}},
                {$lookup: {from: "companies", localField: "company", foreignField: "_id", as: "company"}},
                {$lookup: {from: "sites", localField: "site", foreignField: "_id", as: "site"}},
                {$lookup: {from: "countries", localField: "country", foreignField: "_id", as: "country"}},
                {$unwind: {"path": "$country", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
                {
                    $project: {
                        _id: 1, transfer_year: 1,
                        country: {name: "$country.name", iso2: "$country.iso2"},
                        company: {
                            $cond: {
                                if: {$not: "$company"},
                                then: '',
                                else: {_id: "$company._id", company_name: "$company.company_name"}
                            }
                        },
                        proj_site: {
                            $cond: {
                                if: {$not: "$site"},
                                then: {
                                    $cond: {
                                        if: {$not: "$project"},
                                        then: [], else: {
                                            _id: "$project.proj_id", name: "$project.proj_name",
                                            type: {$cond: {if: {$not: "$project"}, then: '', else: 'project'}}
                                        }
                                    }
                                },
                                else: {
                                    _id: "$site._id", name: "$site.site_name",
                                    type: {$cond: {if: {$gte: ["$site.field", true]}, then: 'field', else: 'site'}}
                                }
                            }
                        },
                        transfer_level: 1, transfer_type: 1, transfer_unit: 1, transfer_value: 1
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        transfer_year: {$first: '$transfer_year'},
                        transfer_type: {$first: '$transfer_type'},
                        transfer_unit: {$first: '$transfer_unit'},
                        transfer_value: {$first: '$transfer_value'},
                        country: {$first: '$country'},
                        company: {$first: '$company'},
                        proj_site: {$first: '$proj_site'}
                    }
                },
                {$skip: 0},
                {$limit: 50}
            ]).exec(function (err, transfers) {
                if (err) {
                    data.errorList = errors.errorFunction(err, 'Transfers');
                    callback(null, data);
                } else {
                    if (transfers.length > 0) {
                        data.transfers = transfers
                        callback(null, data);
                    } else {
                        data.errorList.push({type: 'Transfers', message: 'transfers not found'})
                        callback(null, data);
                    }
                }
            });
        } else {
            callback(null, data);
        }
    }

};

exports.getAllProjects = function(req, res) {
    var limit = Number(req.params.limit),
        skip = Number(req.params.skip);
    var data={};
    data.projects =[];
    data.errorList =[];
    data.count = 0;
    async.waterfall([
        projectCount,
        getProjectSet,
        getProjectLinks
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Projects');
            return res.send(data);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function projectCount(callback) {
        Project.find({}).count().exec(function(err, project_count) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Projects');
                res.send(data);
            } else if (project_count == 0) {
                data.errorList = errors.errorFunction(err,'Projects not found');
                res.send(data);
            } else {
                data.count = project_count;
                callback(null, data);
            }
        });
    }
    function getProjectSet(data, callback) {
        Project.aggregate([
            {$sort: {proj_name: -1}},
            {$unwind: {"path": "$proj_country", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "countries",localField: "proj_country.country",foreignField: "_id",as: "proj_country"}},
            {$unwind: {"path": "$proj_country", "preserveNullAndEmptyArrays": true}},
            {$group: {
                _id: '$_id',
                proj_name:{$first:'$proj_name'},
                proj_id:{$first:'$proj_id'},
                proj_country:{$addToSet:'$proj_country'}
            }},
            {$project: { _id: 1, proj_name:1, proj_id:1, proj_country:1, companies:{$literal:[]} }},
            {$skip: skip},
            {$limit: limit}
        ]).exec(function(err, projects) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Projects');
                res.send(data);
            }
            else {
                if (projects && projects.length>0) {
                    data.projects = projects;
                    callback(null,  data);
                } else {
                    data.errorList.push({type: 'Projects', message: 'projects not found'})
                    res.send(data)
                }
            }
            });
    }
    function getProjectLinks(data, callback) {
        var projectsId = _.pluck(data.projects, '_id');
        if(projectsId.length>0) {
            Link.aggregate([
                {
                    $match: {
                        $or: [{project: {$in: projectsId}}],
                        'company': {$exists: true, $nin: [null]}
                    }
                },
                {$lookup: {from: "companies", localField: "company", foreignField: "_id", as: "company"}},
                {$unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}},
                {
                    $project: {
                        company: {_id: '$company._id', company_name: '$company.company_name'},
                        project: 1
                    }
                },
                {
                    $group: {
                        _id: '$project',
                        company: {$addToSet: '$company'}
                    }
                }
            ]).exec(function (err, links) {
                if (err) {
                    data.errorList = errors.errorFunction(err,'Project links');
                    callback(null,  data);
                }
                else {
                    if (links && links.length>0) {
                        _.map(data.projects, function (project) {
                            var list = _.find(links, function (link) {
                                return link._id.toString() == project._id.toString();
                            });
                            if (list) {
                                project.companies = list.company;
                            }
                            return project;
                        });
                        callback(null,  data);
                    } else {
                        data.errorList.push({type: 'Project links', message: 'project links not found'})
                        callback(null,  data);
                    }
                }
            })
        }
    }
};

exports.persist = function(req, res) {
    var gdoc = new GoogleSpreadsheet('1xj04qdTxMdPfWWX2l4sM902gtloygwEomWNIzC_BMto');
    
    async.series([
        function (gscallback) {
            gdoc.useServiceAccountAuth(creds, function(err) {
                if (err) {
                    return gscallback("Failed to auth Google Sheet for project IDs");
                }
                else {
                    console.log('Authed doc');
                    return gscallback(null);
                }
            });
        },
        function (gscallback) {
            gdoc.getInfo(function(err, info) {
                if (err) {
                    return gscallback("Failed to open Google Sheet for project IDs");
                }
                else {
                    console.log('Loaded doc: '+info.title);
                    sheet = info.worksheets[0];
                    console.log("got sheet");
                    return gscallback(null);
                }
            });
        },
        function (gscallback) {
            Project.find({})
            .populate('proj_country.country', 'iso2')
            .exec(function (err, result) {
							if (err) gscallback(err)
							else {
							    var numRows = result.length;
									sheet.resize({rowCount: numRows + 1, colCount: 3}, function (err) {
                  if (err) gscallback(err);
                  else {
                      sheet.getCells({
                      'min-row': 2,
                      'max-row': numRows + 1,
                      'min-col': 1,
                      'max-col': 3,
                      'return-empty': true
                    }, function(err, cells) {
                      for (var i=2; i<numRows + 2; i++) {
                          //console.log(util.inspect(result[i-2], {depth: 6}));
                          for (var j=1; j<4; j++) {
                              var index = (((i-2)*3) + j) - 1;
                              switch(j) {
                                   case 1:
                                       if (result[i-2].proj_country.length == 0) cells[index].value = 'NULL';
                                       else cells[index].value = result[i-2].proj_country[0].country.iso2;
                                       break;
                                   case 2:
                                       cells[index].value = result[i-2].proj_name;
                                       break;
                                   case 3:
                                       cells[index].value = result[i-2].proj_id;
                                       break;
                              }
                          }
                      }
                      sheet.bulkUpdateCells(cells, function (err) {
                          if (err) gscallback(err);
                          else return gscallback(null);
                      });
                    });
                  }
              });
							}
					  });
         }
    ],
    function (err) {
        if (err) res.send(err);
        else res.send("complete");       
    });
};








