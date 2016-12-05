var Project 		= require('mongoose').model('Project'),
    Country 		= require('mongoose').model('Country'),
    Source	 		= require('mongoose').model('Source'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    Commodity 	    = require('mongoose').model('Commodity'),
    Contract 	    = require('mongoose').model('Contract'),
    Site 	        = require('mongoose').model('Site'),
    Concession 	    = require('mongoose').model('Concession'),
    async           = require('async'),
    mongoose 		= require('mongoose'),
    _               = require("underscore"),
    errors 	    = require('./errorList'),
    request         = require('request');

exports.getProjectTable = function(req, res){
    var _id = mongoose.Types.ObjectId(req.params.id);
    var link_counter, link_len, companies_len, companies_counter;
    var company =[];
    var type = req.params.type;
    var limit = parseInt(req.params.limit);
    var skip = parseInt(req.params.skip);
    var query={};
    var projects = {};
    projects.projects = [];
    if(type=='concession') { query={concession:_id, entities:"project"}}
    if(type=='company') { query={company:_id, entities:"project"}}
    if(type=='contract') { query={contract:_id, entities:"project"}}
    if(type=='commodity') { query={'proj_commodity.commodity':_id}}
    if(type=='group') { query={company_group: _id, entities: "company"}}
    if(type=='country') { query={'proj_country.country': _id}}
    async.waterfall([
        getLinkedProjects,
        getCommodityProjects,
        getCountryProjects,
        getCompanyCount,
        getGroupLinkedCompanies,
        getGroupLinkedProjects
    ], function (err, result) {
        if (err) {
            res.send({projects:[],error:err});
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function getLinkedProjects(callback) {
        if(type!='commodity'&&type!='group'&&type!='country') {
            Link.find(query)
                .deepPopulate('project.proj_country.country project.proj_commodity.commodity')
                .lean()
                .exec(function (err, links) {
                    if (links.length>0) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            if(link.project) {
                                projects.projects.push({
                                    proj_id: link.project.proj_id,
                                    proj_name: link.project.proj_name,
                                    proj_country: link.project.proj_country,
                                    proj_commodity: link.project.proj_commodity,
                                    proj_status: link.project.proj_status,
                                    _id: link.project._id,
                                    companies_count: 0,
                                    companies: []
                                });
                            }
                            if (link_len == link_counter) {
                                projects.projects = _.map(_.groupBy(projects.projects,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                callback(null, projects);
                            }
                        })
                    } else {
                        callback(null, projects);
                    }
                });
        } else{
            projects.projects = [];
            callback(null, projects);
        }
    }
    function getCommodityProjects(projects, callback) {
        if(type=='commodity') {
            Project.find(query)
                .populate('commodity country')
                .deepPopulate('proj_commodity.commodity proj_country.country')
                .exec(function (err, proj) {
                    link_len = proj.length;
                    link_counter = 0;
                    if(link_len>0) {
                        _.each(proj, function (project) {
                            ++link_counter;
                            projects.projects.push({
                                proj_id: project.proj_id,
                                proj_name: project.proj_name,
                                proj_country: project.proj_country,
                                proj_commodity: project.proj_commodity,
                                proj_status: project.proj_status,
                                _id: project._id,
                                companies_count: 0,
                                companies: []
                            });
                            if (link_len == link_counter) {
                                projects.projects = _.map(_.groupBy(projects.projects,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                callback(null, projects);
                            }
                        })
                    }else{
                        callback(null, projects);
                    }
                });
        } else{
            callback(null, projects);
        }
    }
    function getCountryProjects(projects, callback) {
        if(type=='country') {
            projects.projects = [];
            projects.project_id = [];
            Project.aggregate([
                { $sort : { proj_name : -1 } },
                {$unwind: '$proj_country'},
                {$match:{'proj_country.country':_id}},
                {$unwind: {"path": "$proj_status", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$proj_commodity", "preserveNullAndEmptyArrays": true}},
                {$lookup: {from: "commodities",localField: "proj_commodity.commodity",foreignField: "_id",as: "commodity"}},
                {$group:{
                    "_id": "$_id",
                    "proj_id":{$first:"$proj_id"},
                    "proj_name":{$first:"$proj_name"},
                    "proj_country":{$first:"$proj_country"},
                    "proj_commodity":{$first:"$commodity"},
                    "proj_status":{$last:"$proj_status"},
                    "project_id":{$first:"$_id"}
                }},
                {$project:{_id:1,proj_id:1,proj_name:1,project_id:1,proj_country:1,proj_commodity:1,proj_status:1,companies_count:{$literal:0},companies:[]}},
                { $skip : skip},
                { $limit : limit }
            ]).exec(function (err, proj) {
                projects.projects = proj
                projects.project_id = _.pluck(proj, 'project_id');
                callback(null, projects);
            });
        } else{
            callback(null, projects);
        }
    }
    function getCompanyCount(projects, callback) {
        if(type!='group') {
            Link.aggregate([
                {$match: {$or: [{project: {$in: projects.project_id}}], entities: 'company'}},
                {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
                {$lookup: {from: "projects",localField: "project",foreignField: "_id",as: "project"}},
                {$unwind: '$project'},
                {$unwind: '$company'},
                {$project:{
                    "_id":"$project._id",
                    "company":"$company",
                    "proj_country":"$project.proj_country",
                    "proj_status":"$project.proj_status",
                    "proj_commodity":"$project.proj_commodity",
                    "proj_id":"$project.proj_id",
                    "proj_name":"$project.proj_name"
                }},
                { $sort : { "proj_name" : -1 } },
                {$match:{'proj_country.country':_id}},
                {$unwind: {"path": "$proj_status", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$proj_commodity", "preserveNullAndEmptyArrays": true}},
                {$lookup: {from: "commodities",localField: "proj_commodity.commodity",foreignField: "_id",as: "commodity"}},
                {$group:{
                    "_id": "$_id",
                    "proj_id":{$first:"$proj_id"},
                    "proj_name":{$first:"$proj_name"},
                    "proj_country":{$first:"$proj_country"},
                    "proj_commodity":{$first:"$commodity"},
                    "proj_status":{$last:"$proj_status"},
                    "project_id":{$first:"$_id"},
                    "companies":{$addToSet:"$company"}
                }},
                {$project:{_id:1,companies:1,companies_count:{$size:'$companies'},proj_id:1,proj_name:1,project_id:1,proj_country:1,proj_commodity:1,proj_status:1}}
            ]).exec(function (err, links) {
                _.map(projects.projects, function(proj){
                    var list = _.find(links, function(link){
                        return link.proj_id == proj.proj_id; });
                    if(list && list.companies) {
                        proj.companies = list.companies;
                        proj.companies_count = list.companies_count;
                    }
                    return proj;
                });
                callback(null, projects);
            })
        }else {
            callback(null, projects);
        }
    }
    function getGroupLinkedCompanies(projects,callback) {
        if(type=='group') {
            Link.find(query)
                .exec(function (err, links) {
                    if (links.length>0) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            company.push({_id:link.company});
                            if (link_len == link_counter) {
                                company = _.map(_.groupBy(company,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                callback(null, projects);
                            }
                        })
                    } else {
                        callback(null, projects);
                    }
                });
        } else{
            callback(null, projects);
        }
    }
    function getGroupLinkedProjects(projects, callback) {
        if(type=='group') {
            var companies = company;
            if(companies.length>0) {
                companies_len = companies.length;
                companies_counter = 0;
                _.each(companies, function (company) {
                    var queries = {company: company._id, entities: "project"};
                    Link.find(queries)
                        .populate('project')
                        .deepPopulate('project.proj_country.country project.proj_commodity.commodity')
                        .exec(function (err, links) {
                            ++companies_counter;
                            if (links.length>0) {
                                link_len = links.length;
                                link_counter = 0;
                                _.each(links, function (link) {
                                    ++link_counter;
                                    if(link.project) {
                                        projects.projects.push({
                                            proj_id: link.project.proj_id,
                                            proj_name: link.project.proj_name,
                                            proj_country: link.project.proj_country,
                                            proj_commodity: link.project.proj_commodity,
                                            proj_status: link.project.proj_status,
                                            _id: link.project._id,
                                            companies: 0
                                        });
                                    }
                                    if (link_len == link_counter&&companies_counter==companies_len) {
                                        projects.projects = _.map(_.groupBy(projects.projects,function(doc){
                                            return doc._id;
                                        }),function(grouped){
                                            return grouped[0];
                                        });
                                        callback(null, projects);
                                    }
                                })
                            } else {
                                if (companies_counter==companies_len) {
                                    callback(null, projects);
                                }
                            }
                        });
                })
            } else{
                callback(null, projects);
            }
        } else{
            callback(null, projects);
        }
    }
};