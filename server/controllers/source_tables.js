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


exports.getSourceTable = function(req, res){
    var link_counter, link_len,companies_len,companies_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);
    var type = req.params.type;
    var queries=[];
    var project={};
    project.sources = [];
    if(type=='concession') { queries={concession:req.params.id}}
    if(type=='company') { queries={company:req.params.id}}
    if(type=='contract') { queries={contract:req.params.id}}
    if(type=='commodity') { queries={commodity:req.params.id}}
    if(type=='project') { queries={project:req.params.id}}
    if(type=='group') { queries={company_group:req.params.id}}

    var models = [
        {name:'Site',field:{'site_commodity.commodity':req.params.id},params:'site'},
        {name:'Concession',field:{'concession_commodity.commodity':req.params.id},params:'concession'},
        {name:'Project',field:{'proj_commodity.commodity':req.params.id},params:'project'}
    ];
    project.query=[];
    var models_len,models_counter=0,counter=0;
    var country_models = [
        {name:'Site',field:{'site_country.country':req.params.id},params:'site'},
        {name:'Company',field:{'countries_of_operation.country':req.params.id},params:'company'},
        {name:'Company',field:{'country_of_incorporation.country':req.params.id},params:'company'},
        {name:'Concession',field:{'concession_country.country':req.params.id},params:'concession'},
        {name:'Concession',field:{'concession_country.country':req.params.id},params:'concession'},
        {name:'Project',field:{'proj_country.country':req.params.id},params:'project'}
    ];
    async.waterfall([
        getLinkSite,
        getCommodityLinks,
        getCountryLinks,
        getSource,
        getGroupLinkedCompanies,
        getGroupLinkedProjects
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinkSite(callback) {
        if(type!='commodity'&&type!='group'&&type!='country') {
            Link.find(queries)
                .populate('source')
                .deepPopulate('source.source_type_id')
                .exec(function (err, links) {
                    if (links.length > 0) {
                        link_len = links.length;
                        link_counter = 0;
                        links.forEach(function (link) {
                            ++link_counter;
                            project.sources.push(link.source);
                            if (link_counter == link_len) {
                                var uniques = _.map(_.groupBy(project.sources,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                project.sources=uniques.splice(skip,limit+skip);
                                callback(null, project);
                            }
                        });
                    } else {
                        callback(null, project);
                    }
                });
        } else{
            callback(null, project);
        }
    }
    function getCommodityLinks(project,callback) {
        if(type=='commodity') {
            models_counter=0;
            models_len = models.length;
            _.each(models, function(model) {
                var name = require('mongoose').model(model.name);
                var $field = model.field;
                name.find($field).exec(function (err, responce) {
                    models_counter++;
                    _.each(responce, function(re) {
                        counter++;
                        if(model.params=='project'){project.query.push({project:re._id})}
                        if(model.params=='concession'){project.query.push({concession:re._id})}
                        if(model.params=='site'){project.query.push({site:re._id})}
                    });
                    if(models_counter==models_len){
                        callback(null, project);
                    }
                });
            });
        }else {
            callback(null, project);
        }
    }
    function getCountryLinks(project,callback) {
        if(type=='country') {
            models_counter=0;project.query=[];
            models_len = country_models.length;
            _.each(country_models, function(model) {
                var name = require('mongoose').model(model.name);
                var $field = model.field;
                name.find($field).exec(function (err, responce) {
                    models_counter++;
                    _.each(responce, function(re) {
                        counter++;
                        if(model.params=='project'){project.query.push({project:re._id})}
                        if(model.params=='company'){project.query.push({company:re._id})}
                        if(model.params=='concession'){project.query.push({concession:re._id})}
                        if(model.params=='site'){project.query.push({site:re._id})}
                    });
                    if(models_counter==models_len){
                        callback(null, project);
                    }
                });
            });
        }else {
            callback(null, project);
        }
    }
    function getSource(project, callback) {
        if(type=='commodity'||type=='country') {
            companies_len = project.query.length;
            var source =[];
            var i =0;
            companies_counter = 0;
            if (companies_len > 0) {
                project.query.forEach(function (query) {
                    Link.find({$or: [query]})
                        .populate('source')
                        .deepPopulate('source.source_type_id')
                        .exec(function (err, links) {
                            ++companies_counter;
                            link_len = links.length;
                            link_counter = 0;
                            if(link_len>0) {
                                _.each(links, function (link) {
                                    ++link_counter;
                                    if(link.source!=null) {
                                        source.push(link.source);
                                    }
                                });
                            } else{
                                ++link_counter;
                            }
                            if (link_len == link_counter && companies_counter == companies_len) {
                                var uniques = _.map(_.groupBy(source,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                project.sources=uniques.splice(skip,limit+skip);
                                callback(null, project);
                            }
                        });
                });
            } else {
                callback(null, project);
            }
        } else {
            callback(null, project);
        }
    }
    function getGroupLinkedCompanies(project,callback) {
        var company =[];
        if(type=='group') {
            Link.find(queries)
                .populate('source')
                .deepPopulate('source.source_type_id')
                .exec(function (err, links) {
                    if (links) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            project.sources.push(link.source);
                            if(link.company!=undefined) {
                                company.push({_id: link.company});
                            }
                            if (link_len == link_counter) {
                                var uniques = _.map(_.groupBy(company,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                company.sources=uniques.splice(skip,limit+skip);
                                callback(null, company);
                            }
                        })
                    } else {
                        callback(err);
                    }
                });
        } else{
            callback(null, company);
        }
    }
    function getGroupLinkedProjects(companies,callback) {
        if(type=='group') {
            if(companies.length>0) {
                companies_len = companies.length;
                companies_counter = 0;
                _.each(companies, function (company) {
                    if(company._id!=undefined){
                        Link.find({company: company._id})
                            .populate('source')
                            .deepPopulate('source.source_type_id')
                            .exec(function (err, links) {
                                ++companies_counter;
                                if (links.length>0) {
                                    link_len = links.length;
                                    link_counter = 0;
                                    _.each(links, function (link) {
                                        ++link_counter;
                                        project.sources.push(link.source);
                                        if (link_len == link_counter && companies_counter == companies_len) {
                                            var uniques = _.map(_.groupBy(project.sources,function(doc){
                                                return doc._id;
                                            }),function(grouped){
                                                return grouped[0];
                                            });
                                            project.sources=uniques.splice(skip,limit+skip);
                                            callback(null, project);
                                        }

                                    })
                                } else {
                                    callback(null, project);
                                }
                            });
                    }
                })
            } else{
                callback(null, project);
            }
        } else{
            callback(null, project);
        }
    }

};