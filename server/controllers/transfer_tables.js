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

exports.getTransferTable = function(req, res){
    var _id = mongoose.Types.ObjectId(req.params.id);

    var link_counter, link_len,errorList=[], queries,query, company={},transfers_counter,transfers_len,companies_len,companies_counter,type = req.params.type,projects = {};
    projects.transfers_query =[];
    var limit = parseInt(req.params.limit);
    var skip = parseInt(req.params.skip);
    if(type=='concession') { queries={concession:_id}; projects.transfers_query = [_id];}
    if(type=='company') { queries={company:_id};projects.transfers_query = [_id];}
    if(type=='contract') { queries={contract:_id};projects.transfers_query = [_id];}
    if(type=='project') {  queries={project:_id};projects.transfers_query = [_id];}
    if(type=='site') {  queries={site:_id};projects.transfers_query = [_id];}
    if(type=='group') { query={company_group: _id, entities: "company"};projects.transfers_query = [_id];}
    if(type=='source_type') {  query={source_type_id:_id};}
    var models =[], models_len,models_counter=0,counter=0;
    async.waterfall([
        getLinks,
        getGroupCompany,
        getGroupLinks,
        getCountryID,
        getSource,
        getTransfers
    ], function (err, result) {
        if (err) {
            res.send({transfers:[], error:err});
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function getLinks(callback) {
        if(type!='group'&&type!='country') {
            Link.aggregate([
                {$match: queries},
                {
                    $group: {
                        _id: null,
                        project: {$addToSet: '$project'},
                        site: {$addToSet: '$site'},
                        concession: {$addToSet: '$concession'},
                        company: {$addToSet: '$company'}
                    }
                },
                {$project:{
                    _id:0,
                    transfers_query: { $setUnion: [ "$project", "$site", "$concession" , "$company" ] }
                }}
            ]).exec(function (err, links) {
                if (err) {
                    errorList = errors.errorFunction(err, 'Company links');
                    return res.send({transfers: [], errorList: errorList});
                } else {
                    if (links.length > 0) {
                        projects.transfers_query = links[0].transfers_query
                        callback(null, projects, errorList);
                    } else {
                        errorList.push({type: 'Company links', message: 'company links not found'})
                        return res.send({transfers: projects, errorList: errorList});
                    }
                }
            });
        }else {
            callback(null, projects, errorList);
        }
    }
    function getGroupCompany(projects, errorList, callback) {
        if(type=='group') {
            var companies =[];
            Link.find(query)
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
                async.eachLimit(companies, 5, function (c) {
                    if(c._id!=undefined){
                    query = {company: c._id};
                    projects.transfers_query.push(c._id);
                    Link.find(query)
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
                                            if (link.project && link.project._id != undefined && link.project!=null) {
                                                if (!_.contains(projects.transfers_query, link.project._id)) {
                                                    projects.transfers_query.push(link.project._id);
                                                }
                                            }
                                            break;
                                        case 'site':
                                            if (link.site._id != undefined) {
                                                if (!_.contains(projects.transfers_query, link.site._id)) {
                                                    projects.transfers_query.push(link.site._id);
                                                }
                                            }
                                            break;

                                        case 'concession':
                                            if (link.concession._id != undefined) {
                                                if (!_.contains(projects.transfers_query, link.concession._id)) {
                                                    projects.transfers_query.push(link.concession._id);
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
            projects.transfers = [];
            Transfer.aggregate([
                {$lookup: {from: "projects",localField: "project",foreignField: "_id",as: "project"}},
                {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
                {$lookup: {from: "sites",localField: "site",foreignField: "_id",as: "site"}},
                {$lookup: {from: "concessions",localField: "concession",foreignField: "_id",as: "concession"}},
                {$lookup: {from: "countries",localField: "country",foreignField: "_id",as: "country"}},
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
                    "transfer_year":{$first:"$transfer_year"},
                    "company":{$last:"$company"},
                    "country":{$first:"$country"},
                    "project":{$first:"$project"},
                    "site":{$first:"$site"},
                    "transfer_level":{$first:"$transfer_level"},
                    "transfer_type":{$first:"$transfer_type"},
                    "transfer_unit":{$first:"$transfer_unit"},
                    "transfer_value":{$first:"$transfer_value"}
                }},
                {$project:{_id:1,transfer_year:1,
                    country: { name:"$country.name",iso2:"$country.iso2"},
                    company:{$cond:[{$eq:["$company", null]}, null, {_id:"$company._id",company_name:"$company.company_name"}]},
                    project:{$cond:[{$eq:["$project", null]}, null, {proj_id:"$project.proj_id",name:"$project.proj_name"}]},
                    site:{$cond:[{$eq:["$site", null]}, null, {_id:"$site._id",name:"$site.site_name",field:'$site.field'}]},
                    transfer_level:1,transfer_type:1,transfer_unit:1,transfer_value:1
                }},
                {$skip: skip},
                {$limit: limit}
            ]).exec(function (err, transfers) {
                if (err) {
                    errorList = errors.errorFunction(err,'Payments');
                    callback(null, transfers,errorList);
                }else {
                    if (transfers.length > 0) {
                        projects.transfers = transfers;
                        callback(null, projects, errorList);
                    } else {
                        errorList.push({type: 'Payments', message: 'payments not found'})
                        callback(null, projects, errorList);
                    }
                }
            })
        }else {
            callback(null, projects,errorList);
        }
    }
    function getSource(projects,errorList,callback) {
        if(type=='source_type') {
            Source.find(query).exec(function(err,sources){
                if(sources.length>0){
                    _.each(sources, function(source) {
                        projects.transfers_query.push(source._id);
                    });
                    projects.transfers_query = _.map(_.groupBy(projects.transfers_query,function(doc){
                        return doc;
                    }),function(grouped){
                        return grouped[0];
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
    function getTransfers(projects, callback) {
        if (type != 'country') {
            var query = '';
            projects.transfers = [];
            if (type == 'concession') {
                query = {$or: [{project: {$in: projects.transfers_query}}, {site: {$in: projects.transfers_query}}]}
            }
            if (type == 'company') {
                query = {company: {$in: projects.transfers_query}}
            }
            if (type == 'contract') {
                query = {$or: [{project: {$in: projects.transfers_query}}, {site: {$in: projects.transfers_query}}, {concession: {$in: projects.transfers_query}}]}
            }
            if (type == 'commodity') {
                query = {$or: [{project: {$in: projects.transfers_query}}, {site: {$in: projects.transfers_query}}, {concession: {$in: projects.transfers_query}}]}
            }
            if (type == 'project' || type == 'site') {
                query = {$or: [{project: {$in: projects.transfers_query}}, {site: {$in: projects.transfers_query}}]}
            }
            if (type == 'group') {
                query = {$or: [{project: {$in: projects.transfers_query}}, {site: {$in: projects.transfers_query}}, {company: {$in: projects.transfers_query}}, {concession: {$in: projects.transfers_query}}]}
            }
            if (type == 'country') {
                query = {$or: [{project: {$in: projects.transfers_query}}, {site: {$in: projects.transfers_query}}, {country: {$in: projects.transfers_query}}, {concession: {$in: projects.transfers_query}}]}
            }
            if (type == 'source_type') {
                query = {$or: [{source: {$in: projects.transfers_query}}]}
            }
            if (projects.transfers_query != null) {
                Transfer.aggregate([
                    {$match: query},
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
                    {$skip: skip},
                    {$limit: limit}
                ]).exec(function (err, transfers) {
                    if (err) {
                        errorList = errors.errorFunction(err, 'Transfers by Project');
                        callback(null, {transfers:transfers, errorList:errorList});
                    } else {
                        if (transfers.length > 0) {
                            callback(null, {transfers:transfers, errorList:errorList});
                        } else {
                            errorList.push({type: 'Transfers by Project', message: 'transfers by project not found'})
                            callback(null, {transfers:transfers, errorList:errorList});
                        }
                    }
                });
            } else {
                callback(null, projects);
            }
        } else {
            callback(null, projects);
        }
    }
};