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
    errors 	        = require('./errorList'),
    _               = require("underscore"),
    request         = require('request');


exports.getProductionTable = function(req, res){
    var _id = mongoose.Types.ObjectId(req.params.id);
    var link_counter, link_len, queries,production_counter,production_len,companies_len,companies_counter;
    var type = req.params.type;
    var projects = {};
    var limit = parseInt(req.params.limit);
    var skip = parseInt(req.params.skip);
    projects.production_query =[];
    if(type=='concession') { queries={concession:_id}; projects.production_query = [_id];}
    if(type=='company') { queries={company:_id};projects.production_query = [_id];}
    if(type=='contract') { queries={contract:_id};projects.production_query = [_id];}
    if(type=='project') {  queries={project:_id};projects.production_query = [_id];}
    if(type=='site') {  queries={site:_id};projects.production_query = [_id];}
    if(type=='commodity') {  queries={commodity:_id};projects.production_query = [_id];}
    if(type=='source_type') {  queries={source_type_id:_id};}
    if(type=='group') { queries={company_group: _id, entities: "company"};projects.production_query = [_id];}
    var models = [],models_len,models_counter=0,counter=0;
    async.waterfall([
        getLinks,
        getGroupCompany,
        getGroupLinks,
        getCountryID,
        //getCountryLinks,
        getSource,
        getProduction
    ], function (err, result) {
        if (err) {
            res.send({production:[],error:err});
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
            projects.production = [];
            Production.aggregate([
                {$lookup: {from: "projects",localField: "project",foreignField: "_id",as: "project"}},
                {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
                {$lookup: {from: "sites",localField: "site",foreignField: "_id",as: "site"}},
                {$lookup: {from: "concessions",localField: "concession",foreignField: "_id",as: "concession"}},
                {$lookup: {from: "countries",localField: "country",foreignField: "_id",as: "country"}},
                {$lookup: {from: "commodities",localField: "production_commodity",foreignField: "_id",as: "production_commodity"}},
                {$unwind: {"path": "$production_commodity", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$country", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$project.proj_country", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$company.countries_of_operation", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$company.country_of_incorporation", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site.site_country", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession.concession_country", "preserveNullAndEmptyArrays": true}},
                {$match:{$or:[{'company.country_of_incorporation.country':_id},
                    {'company.countries_of_operation.country':_id},
                    {'project.proj_country.country':_id},
                    {'site.site_country.country':_id},
                    {'concession.concession_country.country':_id},
                    {'country._id':_id}
                ]}},
                {$group:{
                    "_id": "$_id",
                    "production_year":{$first:"$production_year"},
                    "company":{$last:"$company"},
                    "country":{$first:"$country"},
                    "project":{$first:"$project"},
                    "site":{$first:"$site"},
                    "production_volume":{$first:"$production_volume"},
                    "production_unit":{$first:"$production_unit"},
                    "production_price":{$first:"$production_price"},
                    "production_price_unit":{$first:"$production_price_unit"},
                    "production_level":{$first:"$proj_site"},
                    "production_commodity":{$first:"$production_commodity"}
                }},
                {$project:{_id:1,transfer_year:1,
                    country: { name:"$country.name",iso2:"$country.iso2"},
                    company:{$cond:[{$eq:["$company", null]}, null, {_id:"$company._id",company_name:"$company.company_name"}]},
                    proj_site: {
                        $cond: {
                            if: {$not: "$site"},
                            then: {
                                $cond: {
                                    if: {$not: "$project"},
                                    then: [],else:{
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
                    production_commodity:{$cond:[{$eq:["$production_commodity", null]}, null, {_id:"$production_commodity._id",name:"$production_commodity.commodity_name",
                        commodity_id:'$production_commodity.commodity_id'}]},
                    production_year:1,production_volume:1,production_unit:1,production_price:1,production_price_unit:1,production_level:1
                }},
                {$skip: skip},
                {$limit: limit}
            ]).exec(function (err, production) {
                if (err) {
                    callback(null, projects);
                }else {
                    if (production.length > 0) {
                        projects.production = production;
                        callback(null, projects);
                    } else {
                        callback(null, projects);
                    }
                }
            })
        }else {
            callback(null, projects);
        }
    }
    //function getCountryLinks(projects,callback) {
    //    if(type=='country') {
    //        models_counter=0;
    //        models_len = models.length;
    //        _.each(models, function(model) {
    //            var name = require('mongoose').model(model.name);
    //            var $field = model.field;
    //            name.find($field)
    //                .exec(function (err, responce) {
    //                models_counter++;
    //                _.each(responce, function(re) {
    //                    counter++;
    //                    projects.production_query.push(re._id);
    //                });
    //                if(models_counter==models_len){
    //                    callback(null, projects);
    //                }
    //            });
    //        });
    //    }else {
    //        callback(null, projects);
    //    }
    //}
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
        if(type!='country') {
            var productions = [];
            var query = '';
            var proj_site = {};
            projects.production = [];
            if (type == 'concession') {
                query = {$or: [{project: {$in: projects.production_query}}, {site: {$in: projects.production_query}}]}
            }
            if (type == 'company') {
                query = {$or: [{project: {$in: projects.production_query}}, {site: {$in: projects.production_query}}, {concession: {$in: projects.production_query}}]}
            }
            if (type == 'contract') {
                query = {$or: [{project: {$in: projects.production_query}}, {site: {$in: projects.production_query}}, {concession: {$in: projects.production_query}}]}
            }
            if (type == 'commodity') {
                query = {$or: [{project: {$in: projects.production_query}}, {site: {$in: projects.production_query}}, {concession: {$in: projects.production_query}}]}
            }
            if (type == 'project' || type == 'site') {
                query = {$or: [{project: {$in: projects.production_query}}, {site: {$in: projects.production_query}}]}
            }
            if (type == 'group') {
                query = {$or: [{project: {$in: projects.production_query}}, {site: {$in: projects.production_query}}, {company: {$in: projects.production_query}}, {concession: {$in: projects.production_query}}]}
            }
            if (type == 'country') {
                query = {$or: [{project: {$in: projects.production_query}}, {site: {$in: projects.production_query}}, {country: {$in: projects.production_query}}, {concession: {$in: projects.production_query}}]}
            }
            if (type == 'source_type') {
                query = {$or: [{source: {$in: projects.production_query}}]}
            }
            Production.find(query)
                .populate('production_commodity project site country')
                .exec(function (err, production) {
                    production_counter = 0;
                    production_len = production.length;
                    if (production_len > 0) {
                        production.forEach(function (prod) {
                            proj_site = {};
                            if (prod.project != undefined) {
                                proj_site = {name: prod.project.proj_name, _id: prod.project.proj_id, type: 'project'}
                            }
                            if (prod.site != undefined) {
                                if (prod.site.field) {
                                    proj_site = {name: prod.site.site_name, _id: prod.site._id, type: 'field'}
                                }
                                if (!prod.site.field) {
                                    proj_site = {name: prod.site.site_name, _id: prod.site._id, type: 'site'}
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
                                productions = _.map(_.groupBy(productions, function (doc) {
                                    return doc._id;
                                }), function (grouped) {
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
        }else {
            callback(null, projects)
        }
    }
};