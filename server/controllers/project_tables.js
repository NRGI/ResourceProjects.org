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
    _               = require("underscore"),
    request         = require('request');

exports.getProjectTable = function(req, res){
    var link_counter, link_len, companies_len, companies_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);
    var type = req.params.type;
    var query={};
    var projects = {};
    projects.projects = [];
    if(type=='concession') { query={concession:req.params.id, entities:"project"}}
    if(type=='company') { query={company:req.params.id, entities:"project"}}
    if(type=='contract') { query={contract:req.params.id, entities:"project"}}
    if(type=='commodity') { query={'proj_commodity.commodity':req.params.id}}
    if(type=='group') { query={company_group: req.params.id, entities: "company"}}
    if(type=='country') { query={'proj_country.country': req.params.id}}
    async.waterfall([
        getLinkedProjects,
        getCommodityProjects,
        getCountryProjects,
        getCompanyCount,
        getGroupLinkedCompanies,
        getGroupLinkedProjects
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinkedProjects(callback) {
        if(type!='commodity'&&type!='group'&&type!='country') {
            Link.find(query)
                .deepPopulate('project.proj_country.country project.proj_commodity.commodity')
                .lean()
                .exec(function (err, links) {
                    if (links) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            projects.projects.push({
                                proj_id: link.project.proj_id,
                                proj_name: link.project.proj_name,
                                proj_country: link.project.proj_country,
                                proj_commodity: link.project.proj_commodity,
                                proj_status: link.project.proj_status,
                                _id: link.project._id,
                                companies: 0
                            });
                            if (link_len == link_counter) {
                                projects.projects = _.map(_.groupBy(projects.projects,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                projects.projects=projects.projects.splice(skip,limit+skip);
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
                .skip(skip)
                .limit(limit)
                .populate('commodity country')
                .deepPopulate('proj_commodity.commodity proj_country.country')
                .lean()
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
                                companies: 0
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
            Project.find(query)
                .skip(skip)
                .limit(limit)
                .sort({
                    proj_name: 'asc'
                })
                .populate('commodity country')
                .deepPopulate('proj_commodity.commodity proj_country.country')
                .lean()
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
                                companies: 0
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
    function getCompanyCount(projects, callback) {
        if(type!='group') {
            companies_len = projects.projects.length;
            companies_counter = 0;
            if (companies_len > 0) {
                projects.projects.forEach(function (project) {
                    Link.find({project: project._id, entities: 'company'})
                        .populate('company', '_id company_name')
                        .exec(function (err, links) {
                            ++companies_counter;
                            link_counter = 0;
                            links = _.map(_.groupBy(links,function(doc){
                                return doc._id;
                            }),function(grouped){
                                return grouped[0];
                            });
                            link_len = links.length;
                            if(links.length>0) {
                                _.each(links, function (link) {
                                    ++link_counter;
                                    project.companies = +1;
                                });
                            }
                            if (link_len == link_counter && companies_counter == companies_len) {
                                callback(null, projects);
                            }

                        });
                });
            } else {
                callback(null, projects);
            }
        }else {
            callback(null, projects);
        }
    }
    function getGroupLinkedCompanies(projects,callback) {
        var company =[];
        if(type=='group') {
            Link.find(query)
                .exec(function (err, links) {
                    if (links) {
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
                                callback(null, company);
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
    function getGroupLinkedProjects(companies,callback) {
        if(type=='group') {
            if(companies.length>0) {
                companies_len = companies.length;
                companies_counter = 0;
                _.each(companies, function (company) {
                    query = {company: company._id, entities: "project"};
                    Link.find(query)
                        .deepPopulate('project.proj_country.country project.proj_commodity.commodity')
                        .exec(function (err, links) {
                            ++companies_counter;
                            if (links.length>0) {
                                link_len = links.length;
                                link_counter = 0;
                                _.each(links, function (link) {
                                    ++link_counter;
                                    projects.projects.push({
                                        proj_id: link.project.proj_id,
                                        proj_name: link.project.proj_name,
                                        proj_country: link.project.proj_country,
                                        proj_commodity: link.project.proj_commodity,
                                        proj_status: link.project.proj_status,
                                        _id: link.project._id,
                                        companies: 0
                                    });
                                    if (link_len == link_counter&&companies_counter==companies_len) {
                                        projects.projects = _.map(_.groupBy(projects.projects,function(doc){
                                            return doc._id;
                                        }),function(grouped){
                                            return grouped[0];
                                        });
                                        projects.projects=projects.projects.splice(skip,limit+skip);
                                        callback(null, projects);
                                    }
                                })
                            } else {
                                callback(null, projects);
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