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
    errors 	        = require('./errorList'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');


exports.getSourceTable = function(req, res){
    var id = mongoose.Types.ObjectId(req.params.id);
    var linkCounter, linkLen, companiesLen, companiesCounter;
    var type = req.params.type;
    var queries=[];
    var data={};
    var projId=[];
    var companies =[];
    data.sources = [];
    data.errorList =[];
    if(type=='concession') { queries={concession:id}}
    if(type=='company') { queries={company:id}}
    if(type=='contract') { queries={contract:id}}
    if(type=='commodity') { queries={commodity:id}}
    if(type=='project') { queries={project:id}}
    if(type=='group') { queries={company_group:id}}
    if(type=='site') { queries={site:id}}

    data.queries=[];
    var modelsLen,modelsCounter=0,counter=0;
    var countryModels = [
        {name:'Site',field:{'site_country.country':id},params:'site'},
        {name:'Company',field:{'countries_of_operation.country':id},params:'company'},
        {name:'Company',field:{'country_of_incorporation.country':id},params:'company'},
        {name:'Concession',field:{'concession_country.country':id},params:'concession'},
        {name:'Concession',field:{'concession_country.country':id},params:'concession'},
        {name:'Project',field:{'proj_country.country':id},params:'project'}
    ];
    var establishedSource = [
        {name:'Site',field:{'_id':id},params:'site'},
        {name:'Company',field:{'_id':id},params:'company'},
        {name:'Concession',field:{'_id':id},params:'concession'},
        {name:'Project',field:{'_id':id},params:'project'},
        {name:'CompanyGroup',field:{'_id':id},params:'group'}
    ];
    async.waterfall([
        getEstablishedSource,
        getLinkSite,
        getCommodityProject,
        getCommodityLinks,
        getCountryLinks,
        getSource,
        getGroupLinkedCompanies,
        getGroupLinkedProjects
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err, 'Source');
            return res.send(data);
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
            modelsCounter=0;
            modelsLen = establishedSource.length;
            async.eachLimit(establishedSource, 5, function (model) {
                modelsCounter++;
                if(model.params==type) {
                    var name = require('mongoose').model(model.name);
                    var $field = model.field;
                    name.find($field)
                        .populate('source')
                        .deepPopulate('source.source_type_id site_established_source.source_type_id company_group_record_established.source_type_id company_established_source.source_type_id proj_established_source.source_type_id concession_established_source.source_type_id')
                        .exec(function (err, responce) {
                            if (err) {
                                data.errorList = errors.errorFunction(err,'Source');
                                callback(null,  data);
                            } else {
                                if(responce && responce[0]) {
                                    if (type == 'project') {
                                        data.sources.push(responce[0].proj_established_source);
                                    }
                                    if (type == 'company') {
                                        data.sources.push(responce[0].company_established_source);
                                    }
                                    if (type == 'concession') {
                                        data.sources.push(responce[0].concession_established_source);
                                    }
                                    if (type == 'site') {
                                        data.sources.push(responce[0].site_established_source);
                                    }
                                    if (type == 'group') {
                                        data.sources.push(responce[0].company_group_record_established);
                                    }
                                }else {
                                    data.errorList.push({type: 'Source', message: 'source not found'})
                                    callback(null,  data);
                                }
                            }
                            callback(null, data);
                        });
                } else if (modelsCounter==modelsLen) {
                    callback(null, data);
                }
            });
        }else {
            callback(null, data);
        }
    }
    function getLinkSite(data,callback) {
        if(type!='commodity'&&type!='group'&&type!='country') {
            Link.aggregate([
                {$match:  queries},
                {$lookup: {from: "projects",localField: "project",foreignField: "_id",as: "project"}},
                {$lookup: {from: "concessions",localField: "concession",foreignField: "_id",as: "concession"}},
                {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
                {$lookup: {from: "sites",localField: "site",foreignField: "_id",as: "site"}},
                {$lookup: {from: "companygroups",localField: "company_group",foreignField: "_id",as: "company_group"}},
                {$lookup: {from: "sources",localField: "source",foreignField: "_id",as: "source"}},
                {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$company_group", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$source", "preserveNullAndEmptyArrays": true}},
                {$project: {
                    source:1,
                    sources: { $setUnion: [ ["$project.proj_established_source"], ["$site.site_established_source"],
                        ["$company.company_established_source"],
                        ["$concession.concession_established_source"],
                        ["$company_group.company_group_record_established"]
                    ] }
                }},

                {$unwind: {"path": "$sources", "preserveNullAndEmptyArrays": true}},

                {$lookup: {from: "sources",localField: "sources",foreignField: "_id",as: "sources"}},
                {$project: {
                    _id:0,
                    source: { $setUnion: ["$sources", ["$source"]
                    ] }
                }},
                {$unwind:"$source"},
                {$unwind:"$source"},

                {$lookup: {from: "sourcetypes",localField: "source.source_type_id",foreignField: "_id",as: "source.source_type_id"}},
                {$unwind: {"path": "$source.source_type_id", "preserveNullAndEmptyArrays": true}},
                {$project: {
                    _id:'$source._id',
                    source_name:'$source.source_name',
                    source_type_id:'$source.source_type_id'
                }},
                {
                    $group: {
                        _id: '$_id',
                        source_name: {$first: '$source_name'},
                        source_type_id: {$first: '$source_type_id'}
                    }
                }
            ]).exec(function (err, links) {
                if (err) {
                    data.errorList = errors.errorFunction(err,'Source');
                    callback(null,  data);
                }
                else {
                    if (links && links.length>0) {
                        data.sources = _.union(data.sources, links);
                        callback(null,  data);
                    } else {
                        data.errorList.push({type: 'Source', message: 'source not found'})
                        callback(null,  data);
                    }
                }
            })
        } else{
            callback(null, data);
        }
    }
    function getCommodityProject(data,callback) {
        if(type=='commodity') {
            Project.find({'proj_commodity.commodity':id}).exec(function (err, responce) {
                if (err) {
                    data.errorList = errors.errorFunction(err,'Source');
                    callback(null,  data);
                }
                else {
                    if (responce && responce.length>0) {
                        projId = _.pluck(responce, '_id');
                        callback(null, data);
                    } else {
                        data.errorList.push({type: 'Source', message: 'source not found'})
                        callback(null,  data);
                    }
                }
            });
        }else {
            callback(null, data);
        }
    }
    function getCommodityLinks(data,callback) {
        if(type=='commodity') {
            if(projId && projId.length>0) {
                Link.aggregate([
                    {$match: {$or: [{project: {$in: projId}}]}},
                    {$lookup: {from: "projects", localField: "project", foreignField: "_id", as: "project"}},
                    {$lookup: {from: "companies", localField: "company", foreignField: "_id", as: "company"}},
                    {$lookup: {from: "sites", localField: "site", foreignField: "_id", as: "site"}},
                    {$lookup: {from: "concessions", localField: "concession", foreignField: "_id", as: "concession"}},
                    {$lookup: {from: "sources", localField: "source", foreignField: "_id", as: "source"}},
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

                    {
                        $lookup: {
                            from: "sources",
                            localField: "company.company_established_source",
                            foreignField: "_id",
                            as: "company_established_source"
                        }
                    },
                    {
                        $lookup: {
                            from: "sources",
                            localField: "project.proj_established_source",
                            foreignField: "_id",
                            as: "proj_established_source"
                        }
                    },
                    {
                        $lookup: {
                            from: "sources",
                            localField: "concession.concession_established_source",
                            foreignField: "_id",
                            as: "concession_established_source"
                        }
                    },
                    {
                        $lookup: {
                            from: "sources",
                            localField: "site.site_established_source",
                            foreignField: "_id",
                            as: "site_established_source"
                        }
                    },

                    {$unwind: {"path": "$company_established_source", "preserveNullAndEmptyArrays": true}},
                    {$unwind: {"path": "$proj_established_source", "preserveNullAndEmptyArrays": true}},
                    {$unwind: {"path": "$concession_established_source", "preserveNullAndEmptyArrays": true}},
                    {$unwind: {"path": "$site_established_source", "preserveNullAndEmptyArrays": true}},
                    {
                        $project: {
                            _id: 0, source: ['$source', "$company_established_source", "$proj_established_source",
                                "$concession_established_source", "$site_established_source"]
                        }
                    },
                    {$unwind: "$source"},
                    {
                        $project: {
                            _id: '$source._id',
                            source_name: "$source.source_name",
                            source_type_id: "$source.source_type_id"
                        }
                    },
                    {
                        $lookup: {
                            from: "sourcetypes",
                            localField: "source_type_id",
                            foreignField: "_id",
                            as: "source_type_id"
                        }
                    },
                    {$unwind: "$source_type_id"},
                    {
                        $group: {
                            "_id": "$_id",
                            "source_name": {$first: "$source_name"},
                            "source_type_id": {$first: "$source_type_id"}
                        }
                    },
                    {
                        $project: {
                            _id: 1, source_name: 1,
                            source_type_id: {
                                _id: "$source_type_id._id",
                                source_type_name: "$source_type_id.source_type_name",
                                source_type_authority: "$source_type_id.source_type_authority"
                            }
                        }
                    }
                ]).exec(function (err, links) {
                    if (err) {
                        data.errorList = errors.errorFunction(err,'Source');
                        callback(null,  data);
                    }
                    else {
                        if (links && links.length>0) {
                            data.sources = links;
                            callback(null, data);
                        } else {
                            data.errorList.push({type: 'Source', message: 'source not found'})
                            callback(null,  data);
                        }
                    }
                })
            }else {
                callback(null, data);
            }
        }else {
            callback(null, data);
        }
    }
    function getCountryLinks(data,callback) {
        if(type=='country') {
            modelsCounter=0;
            data.queries=[];
            modelsLen = countryModels.length;
            _.each(countryModels, function(model) {
                var name = require('mongoose').model(model.name);
                var $field = model.field;
                name.find($field).exec(function (err, responce) {
                    if (err) {
                        modelsCounter++;
                        data.errorList = errors.errorFunction(err,'Source');
                        if(modelsCounter==modelsLen){
                            callback(null, data);
                        }
                    }
                    else {
                        if (responce && responce.length>0) {
                            modelsCounter++;
                            _.each(responce, function(re) {
                                counter++;
                                if(model.params=='project'){data.queries.push({query:{project:re._id},type:'project'})}
                                if(model.params=='company'){data.queries.push({query:{company:re._id},type:'company'})}
                                if(model.params=='concession'){data.queries.push({query:{concession:re._id},type:'concession'})}
                                if(model.params=='site'){data.queries.push({query:{site:re._id},type:'site'})}
                            });
                            if(modelsCounter==modelsLen){
                                callback(null, data);
                            }
                        } else {
                            modelsCounter++;
                            data.errorList.push({type: 'Source', message: 'source not found'})
                            if(modelsCounter==modelsLen){
                                callback(null, data);
                            }
                        }
                    }

                });
            });
        }else {
            callback(null, data);
        }
    }
    function getSource(data, callback) {
        if(type=='country') {
            companiesLen = data.queries.length;
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
                {$match:{$or:[{'company.country_of_incorporation.country':id},
                    {'company.countries_of_operation.country':id},
                    {'project.proj_country.country':id},
                    {'site.site_country.country':id},
                    {'concession.concession_country.country':id}
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
                if (err) {
                    data.errorList = errors.errorFunction(err,'Source');
                    callback(null,  data);
                }
                else {
                    if (links && links.length>0) {
                        data.sources = links;
                        callback(null, data);
                    } else {
                        data.errorList.push({type: 'Source', message: 'source not found'})
                        callback(null,  data);
                    }
                }
            })
        } else {
            callback(null, data);
        }
    }
    function getGroupLinkedCompanies(data,callback) {
        if(type=='group') {
            var source = [];
            data.companies=[];
            Link.find(queries)
                .populate('source company_group')
                .deepPopulate('source.source_type_id company_group.company_group_record_established.source_type_id')
                .exec(function (err, links) {
                    if (err) {
                        data.errorList = errors.errorFunction(err,'Source');
                        callback(null,  data);
                    } else {
                        if (links && links.length>0) {
                            linkLen = links.length;
                            linkCounter = 0;
                            _.each(links, function (link) {
                                ++linkCounter;
                                if (link.source != null) {
                                    source.push(link.company_group.company_group_record_established);
                                    source.push(link.source);
                                }
                                if (link.company != undefined) {
                                    data.companies.push({_id: link.company});
                                }
                                if (linkLen == linkCounter) {
                                    var uniques = _.map(_.groupBy(source, function (doc) {
                                        return doc._id;
                                    }), function (grouped) {
                                        return grouped[0];
                                    });
                                    companies.sources = uniques;
                                    var unique_company = _.map(_.groupBy(data.companies, function (doc) {
                                        return doc._id;
                                    }), function (grouped) {
                                        return grouped[0];
                                    });
                                    data.sources = uniques;
                                    data.companies = unique_company;
                                    callback(null, data);
                                }
                            })
                        } else {
                            data.errorList.push({type: 'Source', message: 'source not found'})
                            callback(null,  data);
                        }
                    }
                });
        } else{
            callback(null, data);
        }
    }
    function getGroupLinkedProjects(data,callback) {
        if(type=='group') {
            if(data.companies.length>0) {
                companiesLen = data.companies.length;
                companiesCounter = 0;

                _.each(data.companies, function (company) {
                    if(company._id!=undefined){
                        Link.find({company: company._id})
                            .populate('source company')
                            .deepPopulate('source.source_type_id company.company_established_source.source_type_id')
                            .exec(function (err, links) {
                                ++companiesCounter;
                                if (err) {
                                    data.errorList = errors.errorFunction(err, 'Source');
                                    if (companiesCounter == companiesLen) {
                                        var uniques = _.map(_.groupBy(data.sources, function (doc) {
                                            if (doc && doc._id) {
                                                return doc._id;
                                            }
                                        }), function (grouped) {
                                            return grouped[0];
                                        });
                                        data.sources = uniques;
                                        callback(null, data);
                                    }
                                } else {
                                    if (links && links.length > 0) {
                                        linkLen = links.length;
                                        linkCounter = 0;
                                        _.each(links, function (link) {
                                            ++linkCounter;
                                            if (link.source != null) {
                                                data.sources.push(link.source);
                                                data.sources.push(link.company.company_established_source);
                                            }
                                            if (linkLen == linkCounter && companiesCounter == companiesLen) {
                                                var uniques = _.map(_.groupBy(data.sources, function (doc) {
                                                    if (doc && doc._id) {
                                                        return doc._id;
                                                    }
                                                }), function (grouped) {
                                                    return grouped[0];
                                                });
                                                data.sources = uniques;
                                                callback(null, data);
                                            }
                                        })
                                    } else {
                                        data.errorList.push({type: 'Source', message: 'source not found'})
                                        if (companiesCounter == companiesLen) {
                                            var uniques = _.map(_.groupBy(data.sources, function (doc) {
                                                if (doc && doc._id) {
                                                    return doc._id;
                                                }
                                            }), function (grouped) {
                                                return grouped[0];
                                            });
                                            data.sources = uniques;
                                            callback(null, data);
                                        }
                                    }
                                }
                            });
                    }
                })
            } else{
                callback(null, data);
            }
        } else{
            callback(null, data);
        }
    }

};