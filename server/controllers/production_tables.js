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


exports.getProductionTable = function(req, res){
    var link_counter, link_len, queries,production_counter,production_len,companies_len,companies_counter;
    var type = req.params.type;
    var projects = {};
    projects.production_query =[];
    if(type=='concession') { queries={concession:req.params.id}; projects.production_query = [req.params.id];}
    if(type=='company') { queries={company:req.params.id};projects.production_query = [req.params.id];}
    if(type=='contract') { queries={contract:req.params.id};projects.production_query = [req.params.id];}
    if(type=='project') {  queries={project:req.params.id};projects.production_query = [req.params.id];}
    if(type=='site') {  queries={site:req.params.id};projects.production_query = [req.params.id];}
    if(type=='commodity') {  queries={commodity:req.params.id};projects.production_query = [req.params.id];}
    if(type=='source_type') {  queries={source_type_id:req.params.id};}
    if(type=='group') { queries={company_group: req.params.id, entities: "company"};projects.production_query = [req.params.id];}
    var models = [],models_len,models_counter=0,counter=0;
    async.waterfall([
        getLinks,
        getGroupCompany,
        getGroupLinks,
        getCountryID,
        getCountryLinks,
        getSource,
        getProduction
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
    });
    function getLinks(callback) {
        if(type!='group'&&type!='country' && type!='source_type') {
            Link.find(queries)
                .populate('site project concession company')
                .exec(function (err, links) {
                    if (links.length>0) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            var entity = _.without(link.entities, type)[0];
                            switch (entity) {
                                case 'project':
                                    if (link.project && link.project._id != undefined) {
                                        if (!_.contains(projects.production_query, link.project._id)) {
                                            projects.production_query.push(link.project._id);
                                        }
                                    }
                                    break;
                                case 'site':
                                    if (link.site._id != undefined) {
                                        if (!_.contains(projects.production_query, link.site._id)) {
                                            projects.production_query.push(link.site._id);
                                        }
                                    }
                                    break;

                                case 'concession':
                                    if (link.concession._id != undefined) {
                                        if (!_.contains(projects.production_query, link.concession._id)) {
                                            projects.production_query.push(link.concession._id);
                                        }
                                    }
                                    break;
                                case 'company':
                                    if (link.company&&link.company._id != undefined) {
                                        if (!_.contains(projects.production_query, link.company._id)) {
                                            projects.production_query.push(link.company._id);
                                        }
                                    }
                                    break;
                            }
                            if (link_len == link_counter) {
                                callback(null, projects);
                            }
                        })
                    } else {
                        callback(null, projects);
                    }
                });
        }else {
            callback(null, projects);
        }
    }
    function getGroupCompany(projects,callback) {
        if(type=='group') {
            var companies =[];
            Link.find(queries)
                .exec(function (err, links) {
                    if (links.length>0) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            if(link.company!=undefined) {
                                companies.push({_id: link.company});
                            }
                            if (link_len == link_counter) {
                                companies = _.map(_.groupBy(companies,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                callback(null, companies);
                            }
                        })
                    } else {
                        callback(null, companies);
                    }
                });
        } else{
            callback(null, projects);
        }
    }
    function getGroupLinks(companies,callback) {
        if(type=='group') {
            companies_len = companies.length;
            companies_counter = 0;
            if(companies_len>0){
                _.each(companies, function (c) {
                    if(c._id!=undefined){
                        queries = {company: c._id};
                        projects.production_query.push(c._id);
                        Link.find(queries)
                            .populate('site project concession company')
                            .exec(function (err, links) {
                                ++companies_counter;
                                link_len = links.length;
                                link_counter = 0;
                                if (link_len > 0) {
                                    _.each(links, function (link) {
                                        ++link_counter;
                                        var entity = _.without(link.entities, 'company')[0];
                                        switch (entity) {
                                            case 'project':
                                                if (link.project && link.project._id != undefined) {
                                                    if (!_.contains(projects.production_query, link.project._id)) {
                                                        projects.production_query.push(link.project._id);
                                                    }
                                                }
                                                break;
                                            case 'site':
                                                if (link.site._id != undefined) {
                                                    if (!_.contains(projects.production_query, link.site._id)) {
                                                        projects.production_query.push(link.site._id);
                                                    }
                                                }
                                                break;

                                            case 'concession':
                                                if (link.concession._id != undefined) {
                                                    if (!_.contains(projects.production_query, link.concession._id)) {
                                                        projects.production_query.push(link.concession._id);
                                                    }
                                                }
                                                break;
                                        }
                                        if (link_len == link_counter && companies_len == companies_counter) {
                                            callback(null, projects);
                                        }
                                    })
                                } else {
                                    callback(null, projects);
                                }
                            });
                    }
                });
            }else {
                callback(null, projects);
            }
        }else {
            callback(null, projects);
        }
    }
    function getCountryID(projects,callback) {
        if(type=='country') {
            Country.find({'iso2':req.params.id})
                .exec(function (err, country) {
                  if(country.length>0) {
                      models = [
                          {name: 'Site', field: {'site_country.country': country[0]._id}, params: 'site'},
                          {name: 'Company', field: {'countries_of_operation.country': country[0]._id}, params: 'country'},
                          {name: 'Company',field: {'country_of_incorporation.country': country[0]._id},params: 'country'},
                          {name: 'Concession',field: {'concession_country.country': country[0]._id},params: 'concession'},
                          {name: 'Project', field: {'proj_country.country': country[0]._id}, params: 'project'}
                      ];
                  }
                    callback(null, projects);
                });
        }else {
            callback(null, projects);
        }
    }
    function getCountryLinks(projects,callback) {
        if(type=='country') {
            models_counter=0;
            models_len = models.length;
            _.each(models, function(model) {
                var name = require('mongoose').model(model.name);
                var $field = model.field;
                name.find($field)
                    .exec(function (err, responce) {
                    models_counter++;
                    _.each(responce, function(re) {
                        counter++;
                        projects.production_query.push(re._id);
                    });
                    if(models_counter==models_len){
                        callback(null, projects);
                    }
                });
            });
        }else {
            callback(null, projects);
        }
    }
    function getSource(projects,callback) {
        if(type=='source_type') {
            Source.find(queries).exec(function(err,sources){
                if(sources.length>0){
                    _.each(sources, function(source) {
                        projects.production_query.push(source._id);
                    });
                    callback(null, projects);
                }else {
                    callback(null, projects);
                }
            })
        }else {
            callback(null, projects);
        }
    }
    function getProduction(projects, callback) {
        var productions = [];var query='';var proj_site={};
        projects.production = [];
        if(type=='concession'){ query={$or: [{project:{$in: projects.production_query}},{site:{$in: projects.production_query}}]}}
        if(type=='company') { query={$or: [{project: {$in: projects.production_query}},{site: {$in: projects.production_query}},{concession: {$in: projects.production_query}}]}}
        if(type=='contract') { query={$or: [{project:{$in: projects.production_query}},{site:{$in: projects.production_query}},{concession:{$in: projects.production_query}}]}}
        if(type=='commodity') { query={$or: [{project:{$in: projects.production_query}},{site:{$in: projects.production_query}},{concession:{$in: projects.production_query}}]}}
        if(type=='project'||type=='site') { query={$or: [{project:{$in: projects.production_query}},{site:{$in: projects.production_query}}]}}
        if(type=='group') { query = {$or: [{project:{$in: projects.production_query}}, {site:{$in: projects.production_query}},{company:{$in: projects.production_query}},{concession:{$in: projects.production_query}}]}}
        if(type=='country') { query = {$or: [{project:{$in: projects.production_query}}, {site:{$in: projects.production_query}},{country:{$in: projects.production_query}},{concession:{$in: projects.production_query}}]}}
        if(type=='source_type') { query = {$or: [{source:{$in: projects.production_query}}]}}
        Production.find(query)
            .populate('production_commodity project site country')
            .exec(function (err, production) {
                production_counter = 0;
                production_len = production.length;
                if (production_len > 0) {
                    production.forEach(function (prod) {
                        if(prod.project!=undefined){
                            proj_site =  {name:prod.project.proj_name,_id:prod.project.proj_id,type:'project'}
                        }
                        if(prod.site!=undefined){
                            if(prod.site.field){
                                proj_site =  {name:prod.site.site_name,_id:prod.site._id,type:'field'}
                            }
                            if(!prod.site.field){
                                proj_site =  {name:prod.site.site_name,_id:prod.site._id,type:'site'}
                            }
                        }
                        ++production_counter;
                        if (!productions.hasOwnProperty(prod._id)) {
                            productions.push({
                                _id: prod._id,
                                production_year: prod.production_year,
                                production_volume: prod.production_volume,
                                production_unit: prod.production_unit,
                                production_commodity: {
                                    _id: prod.production_commodity._id,
                                    commodity_name: prod.production_commodity.commodity_name,
                                    commodity_id: prod.production_commodity.commodity_id
                                },
                                production_price: prod.production_price,
                                production_price_unit: prod.production_price_unit,
                                production_level: prod.production_level,
                                proj_site: proj_site
                            });
                        }
                        if (production_counter === production_len) {
                            productions = _.map(_.groupBy(productions,function(doc){
                                return doc._id;
                            }),function(grouped){
                                return grouped[0];
                            });
                            projects.production = productions;
                            callback(null, projects);
                        }
                    })
                } else {
                    if (production_counter === production_len) {
                        callback(null, projects);
                    }
                }
            })
    }
};