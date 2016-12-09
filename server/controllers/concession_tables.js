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


exports.getConcessionTable = function(req, res){
    var _id = mongoose.Types.ObjectId(req.params.id);
    var link_counter, errorList=[], link_len,concession_len,concession_counter,companies_len,companies_counter;
    var type = req.params.type;
    var limit = parseInt(req.params.limit);
    var skip = parseInt(req.params.skip);
    var query = '';
    var company = {};
    company.concessions = [];
    if (type == 'company') {query = {company: _id, entities: "concession"}}
    if (type == 'commodity') {query = {'concession_commodity.commodity': _id}}
    if (type == 'country') {query = {'concession_country.country':_id}}
    if(type=='group') { query={company_group: _id, entities: "company"}}
    async.waterfall([
        getLinks,
        getConcessions,
        getCountryConcessions,
        getProjectCount,
        getGroupLinkedCompanies,
        getGroupLinkedConcessions
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
        if (type != 'commodity'&&type != 'group'&&type!='country') {
            Link.aggregate([
                {$match: query},
                {$lookup: {from: "concessions", localField: "concession", foreignField: "_id", as: "concession"}},
                {$unwind: '$concession'},
                {$unwind: {"path": "$concession.concession_country", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession.concession_commodity", "preserveNullAndEmptyArrays": true}},
                {
                    $lookup: {
                        from: "countries",
                        localField: "concession.concession_country.country",
                        foreignField: "_id",
                        as: "concession.concession_country"
                    }
                },
                {
                    $lookup: {
                        from: "commodities",
                        localField: "concession.concession_commodity.commodity",
                        foreignField: "_id",
                        as: "concession.concession_commodity"
                    }
                },
                {$unwind: {"path": "$concession.concession_country", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession.concession_status", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession.concession_commodity", "preserveNullAndEmptyArrays": true}},
                {
                    $group: {
                        _id: '$concession._id',
                        concession_name: {$first: '$concession.concession_name'},
                        concession_status: {$first: '$concession.concession_status'},
                        concession_commodities: {$addToSet: '$concession.concession_commodity'},
                        concession_country: {$first: '$concession.concession_country'}
                    }
                },
                { $skip : skip },
                { $limit : limit }
            ]).exec(function (err, links) {
                if (err) {
                    errorList = errors.errorFunction(err,'company concession links not found');
                    return res.send({data: [], errorList: errorList});
                } else {
                    if (links.length > 0) {
                        company.concessions = links;
                        callback(null, company);
                    } else {
                        errorList.push({type: type, message: 'company concession  links not found'})
                        callback(null, company);
                    }
                }
            })
        } else{
            callback(null, company);
        }

    }
    function getConcessions(company,callback) {
        if (type == 'commodity') {
            Concession.find(query)
                .populate('commodity country')
                .deepPopulate('concession_commodity.commodity concession_country.country')
                .exec(function (err, concessions) {
                    concession_len = concessions.length;
                    concession_counter = 0;
                    if(concession_len>0) {
                        _.each(concessions, function (concession) {
                            ++concession_counter;
                            company.concessions.push({
                                _id: concession._id,
                                concession_name: concession.concession_name,
                                concession_country: _.first(concession.concession_country).country,
                                concession_commodities: concession.concession_commodity,
                                concession_status: concession.concession_status,
                                projects: 0
                            });
                            if (concession_len == concession_counter) {
                                company.concessions = _.map(_.groupBy(company.concessions,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                callback(null, company);
                            }
                        });
                    } else{
                        callback(null, company);
                    }
                });
        } else{
            callback(null, company);
        }
    }
    function getCountryConcessions(company, callback) {
        if(type=='country') {
            concession_counter = 0;
            company.concessions = [];
            Concession.aggregate([
                { $sort : { concession_name : -1 } },
                {$unwind: '$concession_country'},
                {$match: query},
                {$unwind: {"path": "$concession_status", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession_commodity", "preserveNullAndEmptyArrays": true}},
                {$lookup: {from: "commodities",localField: "concession_commodity.commodity",foreignField: "_id",as: "commodity"}},
                {$group:{
                    "_id": "$_id",
                    "concession_name":{$first:"$concession_name"},
                    "concession_country":{$first:"$concession_country"},
                    "concession_commodity":{$first:"$commodity"},
                    "concession_status":{$last:"$concession_status"}
                }},
                {$project:{_id:1,concession_name:1,concession_country:1,concession_commodity:1,concession_status:1,projects_count:{$literal:0}}},
                { $skip : skip},
                { $limit : limit }
            ]).exec(function (err, concessions) {
                if (err) {
                    errorList = errors.errorFunction(err,'Country concessions');
                    return res.send({concessions:[],error: errorList});
                }
                else {
                    if (concessions.length>0) {
                        company.concessions = concessions;
                        callback(null, company, errorList);
                    } else {
                        errorList.push({type: 'Country concessions', message: 'country concessions not found'})
                        return res.send({concessions:[],error: errorList});
                    }
                }
            })
        } else{
            callback(null, company, errorList);
        }
    }
    function getProjectCount(company,errorList,callback) {
        if (type == 'commodity'||type=='country') {
            var concessions_id = _.pluck(company.concessions, '_id');
            Link.aggregate([
                {$match: {$or: [{concession: {$in: concessions_id}}], entities: 'project'}},
                {$lookup: {from: "projects",localField: "project",foreignField: "_id",as: "project"}},
                {$lookup: {from: "concessions",localField: "concession",foreignField: "_id",as: "concession"}},
                {$unwind: '$project'},
                {$unwind: '$concession'},
                {$project:{
                    "_id":"$concession._id",
                    "project":"$project",
                    "concession_country":"$concession.concession_country",
                    "concession_status":"$concession.concession_status",
                    "concession_commodity":"$concession.concession_commodity",
                    "concession_name":"$concession.concession_name"
                }},
                { $sort : { "concession_name" : -1 } },
                {$match: query},
                {$unwind: {"path": "$concession_status", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$concession_commodity", "preserveNullAndEmptyArrays": true}},
                {$lookup: {from: "commodities",localField: "concession_commodity.commodity",foreignField: "_id",as: "commodity"}},
                {$group:{
                    "_id": "$_id",
                    "concession_name":{$first:"$concession_name"},
                    "concession_country":{$first:"$concession_country"},
                    "concession_commodity":{$first:"$commodity"},
                    "concession_status":{$last:"$concession_status"},
                    "project":{$addToSet:"$project"}
                }},
                {$project:{_id:1,projects_count:{$size:'$project'},concession_name:1,concession_country:1,concession_commodity:1,concession_status:1}}
            ]).exec(function (err, links) {
                    if (err) {
                        errorList = errors.errorFunction(err,'Country concessions links');
                        callback(null, company, errorList);
                    }
                    else {
                        if (links.length>0) {
                            _.map(company.concessions, function(concession){
                                var list = _.find(links, function(link){
                                    return link._id.toString() == concession._id.toString(); });
                                if(list && list.projects_count) {
                                    concession.projects_count = list.projects_count;
                                }
                                return concession;
                            });
                            callback(null, company, errorList);
                        } else {
                            errorList.push({type: 'Country concessions links', message: 'country concessions links not found'})
                            callback(null, company, errorList);
                        }
                    }
                })
        }else{
            callback(null, company, errorList);
        }
    }

    function getGroupLinkedCompanies(company,errorList,callback) {
        var companies =[];
        if(type=='group') {
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
            callback(null, company);
        }
    }
    function getGroupLinkedConcessions(companies,callback) {
        if(type=='group') {
            if(companies.length>0) {
                company.concessions=[];
                companies_len = companies.length;
                companies_counter = 0;
                _.each(companies, function (c) {
                    if(c._id!=undefined){
                        query = {company: c._id, entities: "concession"};
                        Link.find(query)
                            .populate('concession commodity country')
                            .deepPopulate('concession.concession_commodity.commodity concession.concession_country.country ')
                            .exec(function (err, links) {
                                ++companies_counter;
                                if (links.length>0) {
                                    link_len = links.length;
                                    link_counter = 0;
                                    link_len = links.length;
                                    link_counter = 0;
                                    _.each(links, function (link) {
                                        ++link_counter;
                                        company.concessions.push({
                                            _id: link.concession._id,
                                            concession_name: link.concession.concession_name,
                                            concession_country: _.first(link.concession.concession_country).country,
                                            concession_commodities: link.concession.concession_commodity,
                                            concession_status: link.concession.concession_status
                                        });
                                        if (link_len == link_counter) {
                                            company.concessions = _.map(_.groupBy(company.concessions,function(doc){
                                                return doc._id;
                                            }),function(grouped){
                                                return grouped[0];
                                            });
                                            callback(null, company);
                                        }
                                    })
                                } else {
                                    callback(null, company);
                                }
                            });
                    }
                })
            } else{
                callback(null, company);
            }
        } else{
            callback(null, company);
        }
    }
};