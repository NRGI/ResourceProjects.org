var Link 	        = require('mongoose').model('Link'),
    Company 	    = require('mongoose').model('Company'),
    async           = require('async'),
    mongoose 		= require('mongoose'),
    errors 	        = require('./errorList'),
    _               = require("underscore"),
    request         = require('request');

//Get company table
exports.getCompanyTable = function(req, res) {
    var limit = Number(req.params.limit),
        skip = Number(req.params.skip);
    var type = req.params.type;
    var id = mongoose.Types.ObjectId(req.params.id);
    var query = '';
    if (type == 'project') {
        query = {project: id, entities: "company"}
    }
    if (type == 'site' || type == 'field') {
        query = {site: id, entities: "company"}
    }
    if (type == 'concession') {
        query = {concession: id, entities: "company"}
    }
    if (type == 'contract') {
        query = {contract: id, entities: "company"}
    }
    if (type == 'country_of_incorporation') {
        query = {'country_of_incorporation.country': id}
    }
    if (type == 'countries_of_operation') {
        query = {'countries_of_operation.country': id}
    }
    var companies = {};
    companies.companies = [];
    companies.companies_of_operation  = [];
    companies.query = [];
    companies.errorList = [];

    async.waterfall([
        getProjectLinks,
        getCommodityLinks,
        getOperationCompanies,
        getIncorporatedCompanies,
        getCompanyGroup
    ], function (err, result) {
        if (err) {
            companies.errorList = errors.errorFunction(err, 'Companies links');
            res.send(companies);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function getProjectLinks(callback) {
        if (type != 'commodity' && type != 'country_of_incorporation' && type != 'countries_of_operation') {
            Link.aggregate([
                {$match: query},
                {$lookup: {from: "companies", localField: "company", foreignField: "_id", as: "company"}},
                {$unwind: "$company"},
                {
                    $project: {
                        _id: 1, company: {
                            company_name: '$company.company_name', _id: '$company._id',
                            company_groups: {$literal: []}
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        company: {$addToSet: '$company'}
                    }
                },
                {$skip: skip},
                {$limit: limit}
            ]).exec(function (err, links) {
                if (err) {
                    companies.errorList = errors.errorFunction(err, 'Companies links');
                    callback(null, companies);
                } else {
                    if (links.length > 0) {
                        companies.companies = links[0].company;
                        callback(null, companies);
                    } else {
                        companies.errorList.push({type: 'Companies links', message: 'companies links not found'})
                        callback(null, companies);
                    }
                }
            });
        } else {
            callback(null, companies);
        }
    }
    function getCommodityLinks(companies, callback) {
        if (type == 'commodity') {
            Link.aggregate([
                {$match:{project:{$exists: true, $nin: [null]}, entities: 'company'}},
                {$lookup: {from: "projects", localField: "project", foreignField: "_id", as: "project"}},
                {$lookup: {from: "companies", localField: "company", foreignField: "_id", as: "company"}},
                {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
                {$unwind: '$company'},
                {$unwind: {"path": "$project.proj_commodity", "preserveNullAndEmptyArrays": true}},
                {$project: {project:{$cond:{if:
                {$eq:["$project.proj_commodity.commodity", id]},
                    then: '$project', else:[]
                }}, company:1}},
                {$unwind:"$project"},
                {$group: {
                    _id: '$company._id',
                    company_name:{$first:'$company.company_name'}
                }},
                {$project:{
                    _id:1,
                    company_name:1,
                    company_groups:{$literal:[]}}},
                {$skip: skip},
                {$limit: limit}
            ]).exec(function (err, links) {
                if (err) {
                    companies.errorList = errors.errorFunction(err, 'Commodity companies');
                    callback(null, companies);
                } else {
                    if (links.length > 0) {
                        companies.companies = links;
                        callback(null, companies);
                    } else {
                        companies.errorList.push({type: 'Commodity companies', message: 'commodity companies not found'})
                        callback(null, companies);
                    }
                }
            });
        } else {
            callback(null, companies);
        }
    }
    function getOperationCompanies(companies, callback) {
        if (type == 'countries_of_operation') {
            companies.companies_of_operation = [];
            Company.aggregate([
                {$unwind: '$countries_of_operation'},
                {$match: {'countries_of_operation.country': id}},
                {
                    $group: {
                        _id: '$_id', company_name: {$first: '$company_name'},
                        countries_of_operation: {$first: '$countries_of_operation'}
                    }
                },
                {
                    $project: {
                        _id: 1, company_name: 1,
                        countries_of_operation: "$countries_of_operation",
                        company_groups: []
                    }
                },
                {$skip: skip},
                {$limit: limit}
            ]).exec(function (err, company) {
                if (err) {
                    companies.errorList = errors.errorFunction(err, 'Companies of operation');
                    callback(null, companies);
                } else {
                    if (company.length > 0) {
                        companies.companies_of_operation = company;
                        callback(null, companies);
                    } else {
                        companies.errorList.push({type: 'Companies of operation', message: 'companies of operation not found'})
                        callback(null, companies);
                    }
                }
            })
        } else {
            callback(null, companies);
        }
    }
    function getIncorporatedCompanies(companies, callback) {
        if (type == 'country_of_incorporation') {
            companies.companies = [];
            Company.aggregate([
                {$unwind:"$country_of_incorporation"},
                {$match:{'country_of_incorporation.country':id}},
                {$group:{
                    _id:'$_id',company_name:{$first:'$company_name'},
                    country_of_incorporation:{$first:'$country_of_incorporation'}
                }},
                {$project:{
                    _id:1,company_name:1,
                    country_of_incorporation:"$country_of_incorporation",
                    company_groups:[]}},
                { $skip : skip },
                { $limit : limit}
            ]).exec(function (err, company) {
                if (err) {
                    companies.errorList = errors.errorFunction(err,'Company of incorporation');
                    callback(null, companies);
                }else {
                    if (company.length > 0) {
                        companies.companies = company;
                        callback(null, companies);
                    } else {
                        companies.errorList.push({type: 'Company of incorporation', message: 'company of incorporation not found'})
                        callback(null, companies);
                    }
                }
            })
        } else {
            callback(null, companies);
        }
    }
    function getCompanyGroup(companies, callback) {
        var companiesId = _.pluck(companies.companies, '_id');
        Link.aggregate([
            {$match: {$or: [{company: {$in: companiesId}}], entities: 'company_group'}},
            {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
            {$lookup: {from: "companygroups",localField: "company_group",foreignField: "_id",as: "company_group"}},
            {$unwind: '$company'},
            {$unwind: '$company_group'},
            {$group:{
                _id:'$company._id',company_name:{$first:'$company.company_name'},
                company_groups:{$addToSet:'$company_group'}
            }},
            {$project:{
                _id:1,company_name:1,
                company_groups:1}}
        ]).exec(function (err, links) {
            if (err) {
                companies.errorList = errors.errorFunction(err,'Company groups links');
                callback(null, companies);
            }else {
                if (links.length > 0) {
                    _.map(companies.companies, function(company){
                        var list = _.find(links, function(link){
                            return company._id.toString() == link._id.toString(); });
                        if(list && list.company_groups) {
                            company.company_groups = list.company_groups;
                        }
                        return company;
                    });
                    callback(null, companies);
                } else {
                    companies.errorList.push({type: 'Company groups links', message: 'company groups links not found'})
                    callback(null, companies);
                }
            }
        });
    }
}