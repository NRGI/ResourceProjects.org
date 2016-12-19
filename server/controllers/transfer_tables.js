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
    var id = mongoose.Types.ObjectId(req.params.id);

    var linkCounter, linkLen,errorList=[], queries,query, company={},companies_len,companies_counter,type = req.params.type,data = {};
    var transfersQuery =[];
    data.companies =[];
    data.transfers =[];
    data.errorList =[];
    var limit = parseInt(req.params.limit);
    var skip = parseInt(req.params.skip);
    if(type=='concession') { queries={concession:id}; transfersQuery = [id];}
    if(type=='company') { queries={company:id};transfersQuery = [id];}
    if(type=='contract') { queries={contract:id};transfersQuery = [id];}
    if(type=='project') {  queries={project:id};transfersQuery = [id];}
    if(type=='site') {  queries={site:id};transfersQuery = [id];}
    if(type=='group') { query={company_group: id, entities: "company"};transfersQuery = [id];}
    if(type=='source_type') {  query={source_type_id:id};}
    
    async.waterfall([
        getLinks,
        getGroupCompany,
        getGroupLinks,
        getCountryID,
        getSource,
        getTransfers
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Transfer tables');
            return res.send(data);
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
                    transfersQuery: { $setUnion: [ "$project", "$site", "$concession" , "$company" ] }
                }}
            ]).exec(function (err, links) {
                if (err) {
                    data.errorList = errors.errorFunction(err, 'Company links');
                    res.send(data);
                } else {
                    if (links.length > 0) {
                        transfersQuery = links[0].transfersQuery
                        callback(null, data);
                    } else {
                        errorList.push({type: 'Company links', message: 'company links not found'})
                        res.send(data);
                    }
                }
            });
        }else {
            callback(null, data);
        }
    }
    function getGroupCompany(data, callback) {
        if(type=='group') {
            Link.find(query)
                .exec(function (err, links) {
                    if (links.length>0) {
                        linkLen = links.length;
                        linkCounter = 0;
                        _.each(links, function (link) {
                            ++linkCounter;
                            if(link.company!=undefined) {
                                data.companies.push({_id: link.company});
                            }
                            if (linkLen == linkCounter) {
                                data.companies = _.map(_.groupBy(data.companies,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                callback(null, data);
                            }
                        })
                    } else {
                        callback(null, data);
                    }
                });
        } else{
            callback(null, data);
        }
    }
    function getGroupLinks(data,callback) {
        if(type=='group') {
            companies_len = data.companies.length;
            companies_counter = 0;
            if(companies_len>0){
                async.eachLimit(data.companies, 5, function (c) {
                    if(c._id!=undefined){
                        query = {company: c._id};
                        transfersQuery.push(c._id);
                    Link.find(query)
                        .populate('site project concession company')
                        .exec(function (err, links) {
                            ++companies_counter;
                            linkLen = links.length;
                            linkCounter = 0;
                            if (linkLen > 0) {
                                _.each(links, function (link) {
                                    ++linkCounter;
                                    var entity = _.without(link.entities, 'company')[0];
                                    switch (entity) {
                                        case 'project':
                                            if (link.project && link.project._id != undefined && link.project!=null) {
                                                if (!_.contains(transfersQuery, link.project._id)) {
                                                    transfersQuery.push(link.project._id);
                                                }
                                            }
                                            break;
                                        case 'site':
                                            if (link.site._id != undefined) {
                                                if (!_.contains(transfersQuery, link.site._id)) {
                                                    transfersQuery.push(link.site._id);
                                                }
                                            }
                                            break;

                                        case 'concession':
                                            if (link.concession._id != undefined) {
                                                if (!_.contains(transfersQuery, link.concession._id)) {
                                                    transfersQuery.push(link.concession._id);
                                                }
                                            }
                                            break;
                                    }
                                    if (linkLen == linkCounter && companies_len == companies_counter) {
                                        callback(null, data);
                                    }
                                })
                            } else {
                                callback(null, data);
                            }
                        });
                    }
                });
            }else {
                callback(null, data);
            }
        }else {
            callback(null, data);
        }
    }
    function getCountryID(data, callback) {
        if(type=='country') {
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
                {$match:{$or:[{'company.country_of_incorporation.country':id},
                    {'company.countries_of_operation.country':id},
                    {'project.proj_country.country':id},
                    {'site.site_country.country':id},
                    {'concession.concession_country.country':id},
                    {'country._id':id}
                ]}},
                {$group:{
                    "_id": "$_id",
                    "transfer_year":{$first:"$transfer_year"},
                    "company":{$last:"$company"},
                    "country":{$first:"$country"},
                    "project":{$first:"$project"},
                    "site":{$first:"$site"},
                    "transfer_label":{$first:"$transfer_label"},
                    "transfer_level":{$first:"$transfer_level"},
                    "transfer_type":{$first:"$transfer_type"},
                    "transfer_unit":{$first:"$transfer_unit"},
                    "transfer_value":{$first:"$transfer_value"}
                }},
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
                        transfer_level: 1, transfer_type: 1, transfer_unit: 1, transfer_value: 1, transfer_label: 1
                    }
                },
                {$unwind: {"path": "$proj_site", "preserveNullAndEmptyArrays": true}},
                {$project:{_id:1,transfer_year:1,transfer_type:1,transfer_unit:1,transfer_level:1,transfer_value:1,country:1,
                    company:1,
                    proj_site:{$cond: { if: {$not: "$transfer_label"},
                        then: { $cond: {if: {$not: "$proj_site"},
                            then: [],
                            else:
                            {_id:"$proj_site._id",name:"$proj_site.name",
                                type:'$proj_site.type'}}},
                        else: {name:"$transfer_label",
                            type:'$transfer_label'}
                    }}, transfer_label:1
                }},
                {$skip: skip},
                {$limit: limit}
            ]).exec(function (err, transfers) {
                if (err) {
                    data.errorList = errors.errorFunction(err,'Payments');
                    callback(null, transfers,errorList);
                }else {
                    if (transfers.length > 0) {
                        data.transfers = transfers;
                        callback(null, data);
                    } else {
                        data.errorList.push({type: 'Payments', message: 'payments not found'})
                        callback(null, data);
                    }
                }
            })
        }else {
            callback(null, data);
        }
    }
    function getSource(data, callback) {
        if(type=='source_type') {
            Source.find(query).exec(function(err,sources){
                if(sources.length>0){
                    _.each(sources, function(source) {
                        transfersQuery.push(source._id);
                    });
                    transfersQuery = _.map(_.groupBy(transfersQuery,function(doc){
                        return doc;
                    }),function(grouped){
                        return grouped[0];
                    });
                    callback(null, data);
                }else {
                    callback(null, data);
                }
            })
        }else {
            callback(null, data);
        }
    }
    function getTransfers(data, callback) {
        if (type != 'country') {
            var query = '';
            if (type == 'concession') {
                query = {$or: [{project: {$in: transfersQuery}}, {site: {$in: transfersQuery}}]}
            }
            if (type == 'company') {
                query = {company: {$in: transfersQuery}}
            }
            if (type == 'contract') {
                query = {$or: [{project: {$in: transfersQuery}}, {site: {$in: transfersQuery}}, {concession: {$in: transfersQuery}}]}
            }
            if (type == 'commodity') {
                query = {$or: [{project: {$in: transfersQuery}}, {site: {$in: transfersQuery}}, {concession: {$in: transfersQuery}}]}
            }
            if (type == 'project' || type == 'site') {
                query = {$or: [{project: {$in: transfersQuery}}, {site: {$in: transfersQuery}}]}
            }
            if (type == 'group') {
                query = {$or: [{project: {$in: transfersQuery}}, {site: {$in: transfersQuery}}, {company: {$in: transfersQuery}}, {concession: {$in: transfersQuery}}]}
            }
            if (type == 'country') {
                query = {$or: [{project: {$in: transfersQuery}}, {site: {$in: transfersQuery}}, {country: {$in: transfersQuery}}, {concession: {$in: transfersQuery}}]}
            }
            if (type == 'source_type') {
                query = {$or: [{source: {$in: transfersQuery}}]}
            }
            if (transfersQuery != null) {
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
                            transfer_level: 1,transfer_label: 1, transfer_type: 1, transfer_unit: 1, transfer_value: 1
                        }
                    },
                    {
                        $group: {
                            _id: '$_id',
                            transfer_year: {$first: '$transfer_year'},
                            transfer_label: {$first: '$transfer_label'},
                            transfer_level: {$first: '$transfer_level'},
                            transfer_type: {$first: '$transfer_type'},
                            transfer_unit: {$first: '$transfer_unit'},
                            transfer_value: {$first: '$transfer_value'},
                            country: {$first: '$country'},
                            company: {$first: '$company'},
                            proj_site: {$first: '$proj_site'}
                        }
                    },
                    {$unwind: {"path": "$proj_site", "preserveNullAndEmptyArrays": true}},
                    {$project:{_id:1,transfer_year:1,transfer_type:1,transfer_unit:1,transfer_level:1,transfer_value:1,country:1,
                        company:1,
                        proj_site:{$cond: { if: {$not: "$transfer_label"},
                            then: { $cond: {if: {$not: "$proj_site"},
                                then: [],
                                else:
                                {_id:"$proj_site._id",name:"$proj_site.name",
                                    type:'$proj_site.type'}}},
                            else: {name:"$transfer_label",
                                type:'$transfer_label'}
                        }}, transfer_label:1
                    }},
                    {$skip: skip},
                    {$limit: limit}
                ]).exec(function (err, transfers) {
                    if (err) {
                        data.errorList = errors.errorFunction(err, 'Transfers by Project');
                        callback(null, data);
                    } else {
                        if (transfers.length > 0) {
                            data.transfers = transfers
                            callback(null, data);
                        } else {
                            errorList.push({type: 'Transfers by Project', message: 'transfers by project not found'})
                            callback(null, data);
                        }
                    }
                });
            } else {
                callback(null, data);
            }
        } else {
            callback(null, data);
        }
    }
};