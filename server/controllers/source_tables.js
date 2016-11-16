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
    mongoose 		= require('mongoose'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');


exports.getSourceTable = function(req, res){
    var _id = mongoose.Types.ObjectId(req.params.id);
    var link_counter, link_len,companies_len,companies_counter;
    var type = req.params.type;
    var queries=[];
    var project={};
    var companies =[];
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
    project.queries=[];
    var models_len,models_counter=0,counter=0;
    var country_models = [
        {name:'Site',field:{'site_country.country':req.params.id},params:'site'},
        {name:'Company',field:{'countries_of_operation.country':req.params.id},params:'company'},
        {name:'Company',field:{'country_of_incorporation.country':req.params.id},params:'company'},
        {name:'Concession',field:{'concession_country.country':req.params.id},params:'concession'},
        {name:'Concession',field:{'concession_country.country':req.params.id},params:'concession'},
        {name:'Project',field:{'proj_country.country':req.params.id},params:'project'}
    ];
    var established_source = [
        {name:'Site',field:{'_id':req.params.id},params:'site'},
        {name:'Company',field:{'_id':req.params.id},params:'company'},
        {name:'Concession',field:{'_id':req.params.id},params:'concession'},
        {name:'Project',field:{'_id':req.params.id},params:'project'},
        {name:'CompanyGroup',field:{'_id':req.params.id},params:'group'}
    ];
    async.waterfall([
        getEstablishedSource,
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
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function getEstablishedSource(callback) {
        if(type!='commodity'&&type!='country'&&type!='contract') {
            models_counter=0;
            models_len = established_source.length;
            async.eachLimit(established_source, 5, function (model) {
                models_counter++;
                if(model.params==type) {
                    var name = require('mongoose').model(model.name);
                    var $field = model.field;
                    name.find($field)
                        .populate('source')
                        .deepPopulate('source.source_type_id site_established_source.source_type_id company_group_record_established.source_type_id company_established_source.source_type_id proj_established_source.source_type_id concession_established_source.source_type_id')
                        .exec(function (err, responce) {
                            if(responce && responce[0]) {
                                if (type == 'project') {
                                    project.sources.push(responce[0].proj_established_source);
                                }
                                if (type == 'company') {
                                    project.sources.push(responce[0].company_established_source);
                                }
                                if (type == 'concession') {
                                    project.sources.push(responce[0].concession_established_source);
                                }
                                if (type == 'site') {
                                    project.sources.push(responce[0].site_established_source);
                                }
                                if (type == 'group') {
                                    project.sources.push(responce[0].company_group_record_established);
                                }
                            }
                            callback(null, project);
                        });
                }else if(models_counter==models_len){
                    callback(null, project);
                }
            });
        }else {
            callback(null, project);
        }
    }
    function getLinkSite(project, callback) {
        if(type!='commodity'&&type!='group'&&type!='country') {
            Link.find(queries)
                .populate('source project company concession')
                .deepPopulate('source.source_type_id company.company_established_source.source_type_id project.proj_established_source.source_type_id concession.concession_established_source.source_type_id')
                .exec(function (err, links) {
                    if (links.length > 0) {
                        link_len = links.length;
                        link_counter = 0;
                        links.forEach(function (link) {
                            ++link_counter;
                            if(type=='project') {
                                project.sources.push(link.project.proj_established_source);}
                            if(type=='company') { project.sources.push(link.company.company_established_source);}
                            if(type=='concession') { project.sources.push(link.concession.concession_established_source);}
                            if(link.source!=null) {
                                project.sources.push(link.source);
                            }
                            if (link_counter == link_len) {
                                var uniques = _.map(_.groupBy(project.sources,function(doc){
                                    if(doc && doc._id) {
                                        return doc._id;
                                    }
                                }),function(grouped){
                                    return grouped[0];
                                });
                                project.sources=uniques;
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
                        if(model.params=='project'){project.queries.push({query:{project:re._id},type:'project'})}
                        if(model.params=='concession'){project.queries.push({query:{concession:re._id},type:'concession'})}
                        if(model.params=='site'){project.queries.push({query:{site:re._id},type:'site'})}
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
            models_counter=0;project.queries=[];
            models_len = country_models.length;
            _.each(country_models, function(model) {
                var name = require('mongoose').model(model.name);
                var $field = model.field;
                name.find($field).exec(function (err, responce) {
                    models_counter++;
                    _.each(responce, function(re) {
                        counter++;
                        if(model.params=='project'){project.queries.push({query:{project:re._id},type:'project'})}
                        if(model.params=='company'){project.queries.push({query:{company:re._id},type:'company'})}
                        if(model.params=='concession'){project.queries.push({query:{concession:re._id},type:'concession'})}
                        if(model.params=='site'){project.queries.push({query:{site:re._id},type:'site'})}
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
            companies_len = project.queries.length;
            Link.aggregate([
                {$lookup: {from: "projects",localField: "project",foreignField: "_id",as: "project"}},
                {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
                {$lookup: {from: "sites",localField: "site",foreignField: "_id",as: "site"}},
                {$lookup: {from: "concessions",localField: "concession",foreignField: "_id",as: "concession"}},
                {$lookup: {from: "sources",localField: "source",foreignField: "_id",as: "source"}},
                {$unwind: {"path": "$source", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$project.proj_country", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$company.countries_of_operation", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$company.country_of_incorporation", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site.site_country", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession.concession_country", "preserveNullAndEmptyArrays": true}},

                {$lookup: {from: "sources",localField: "company.company_established_source",foreignField: "_id",as: "company_established_source"}},
                {$lookup: {from: "sources",localField: "project.proj_established_source",foreignField: "_id",as: "proj_established_source"}},
                {$lookup: {from: "sources",localField: "concession.concession_established_source",foreignField: "_id",as: "concession_established_source"}},
                {$lookup: {from: "sources",localField: "site.site_established_source",foreignField: "_id",as: "site_established_source"}},

                {$unwind: {"path": "$company_established_source", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$proj_established_source", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession_established_source", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site_established_source", "preserveNullAndEmptyArrays": true}},

                {$match:{$or:[{'company.country_of_incorporation.country':_id},
                    {'company.countries_of_operation.country':_id},
                    {'project.proj_country.country':_id},
                    {'site.site_country.country':_id},
                    {'concession.concession_country.country':_id}
                ]}},
                {$project:{ _id:0, source:['$source',"$company_established_source","$proj_established_source",
                    "$concession_established_source","$site_established_source"]}},
                {$unwind: "$source"},
                {$project:{ _id:'$source._id',source_name:"$source.source_name",source_type_id:"$source.source_type_id"}},
                {$lookup: {from: "sourcetypes",localField: "source_type_id",foreignField: "_id",as: "source_type_id"}},
                {$unwind: "$source_type_id"},
                {$group:{
                    "_id": "$_id",
                    "source_name":{$first:"$source_name"},
                    "source_type_id":{$first:"$source_type_id"}
                }},
                {$project:{_id:1,source_name:1,
                    source_type_id: { _id:"$source_type_id._id",
                        source_type_name:"$source_type_id.source_type_name",
                        source_type_authority:"$source_type_id.source_type_authority"}
                }}
            ]).exec(function (err, links) {
                project.sources = links;
                callback(null, project);
            })
        } else {
            callback(null, project);
        }
    }
    function getGroupLinkedCompanies(project,callback) {
        if(type=='group') {
            Link.find(queries)
                .populate('source company_group')
                .deepPopulate('source.source_type_id company_group.company_group_record_established.source_type_id')
                .exec(function (err, links) {
                    if (links.length>0) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            if(link.source!=null) {
                                project.sources.push(link.company_group.company_group_record_established);
                                project.sources.push(link.source);
                            }
                            if(link.company!=undefined) {
                                companies.push({_id: link.company});
                            }
                            if (link_len == link_counter) {
                                var uniques = _.map(_.groupBy(companies,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                companies.sources=uniques;
                                callback(null, project);
                            }
                        })
                    } else {
                        callback(null, project);
                    }
                });
        } else{
            callback(null, project);
        }
    }
    function getGroupLinkedProjects(project,callback) {
        if(type=='group') {
            if(companies.length>0) {
                companies_len = companies.length;
                companies_counter = 0;
                _.each(companies, function (company) {
                    if(company._id!=undefined){
                        Link.find({company: company._id})
                            .populate('source company')
                            .deepPopulate('source.source_type_id company.company_established_source.source_type_id')
                            .exec(function (err, links) {
                                ++companies_counter;
                                if (links.length>0) {
                                    link_len = links.length;
                                    link_counter = 0;
                                    _.each(links, function (link) {
                                        ++link_counter;
                                        if(link.source!=null) {
                                            project.sources.push(link.source);
                                            project.sources.push(link.company.company_established_source);
                                        }
                                        if (link_len == link_counter && companies_counter == companies_len) {
                                            var uniques = _.map(_.groupBy(project.sources,function(doc){
                                                if(doc && doc._id) {
                                                    return doc._id;
                                                }
                                            }),function(grouped){
                                                return grouped[0];
                                            });
                                            project.sources=uniques;
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