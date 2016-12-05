'use strict';

var Country 		= require('mongoose').model('Country'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Link            = require('mongoose').model('Link'),
    Project 		= require('mongoose').model('Project'),
    Company 		= require('mongoose').model('Company'),
    Site 			= require('mongoose').model('Site'),
    Concession 		= require('mongoose').model('Concession'),
    Production 		= require('mongoose').model('Production'),
    Commodity 		= require('mongoose').model('Commodity'),
    mongoose 		= require('mongoose'),
    errors 	        = require('./errorList'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

var errorList=[];
exports.getCountries = function(req, res) {
    var countries_len, countries_counter, final_country_set,errorList=[],
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        countryCount,
        getCountrySet,
        getProjectCounts,
        getSiteCounts,
        getFieldCounts,
        getConcessionCount,
        getTransferCount,
        getRelevantCountries
    ], function (err, result) {
        if (err) {
            err = new Error('Error: '+ err);
            res.send({data:[],count:0,reason: err.toString()});
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });

    function countryCount(callback) {
        Country.find({}).count().exec(function(err, country_count) {
            if (err) {
                err = new Error('Error: '+ err);;
                return res.send({data:[],count:0,reason: err.toString()});
            } else if (!country_count) {
                callback(null, 0);
            } else {
                callback(null, country_count);
            }
        });
    }
    function getCountrySet(country_count, callback) {
        Country.aggregate([
                {$limit:limit},{$skip:skip},{$sort:{'name':1}},
                {$project:{_id:1,name:1,iso2:1,field_count:{ $literal: 0 },project_count:{ $literal: 0 },site_count:{ $literal: 0 },concession_count:{ $literal: 0 },transfer_count:{ $literal: 0 }}}
            ])
            .exec(function(err, countries) {
                if (err) {
                    err = new Error('Error: '+ err);
                    return res.send({data:[],count:0,reason: err.toString()});
                } else if (!countries) {
                    return res.send({data:[],count:0,reason: 'not found'});
                } else {
                    callback(null, country_count, countries);
                }
            });
    }
    function getProjectCounts(country_count, countries, callback) {
        Project.aggregate([
            {$unwind: '$proj_country'},
            {$lookup: {from: "countries",localField: "proj_country.country",foreignField: "_id",as: "country"}},
            {$project:{_id:1,country:1,proj_id:1}},
            {$unwind: '$country'},
            {$group:{
                "_id": "$country.iso2",
                "country":{
                    $first:"$country"
                },
                project:{$addToSet:'$proj_id'}
            }},
            {$project:{_id:'$country._id',iso2:'$country.iso2',name:'$country.name',project_count:{ $size: "$project" }}}
        ]).exec(function (err, projects) {
            if (err) {
                errorList = errors.errorFunction(err,'Projects');
                callback(null, country_count, countries,errorList);
            }
            else {
                if (projects.length>0) {
                    var res = union(countries, projects, 'project_count')
                    callback(null, country_count, res, errorList);
                } else {
                    errorList.push({type: 'Projects', message: 'projects not found'})
                    callback(null, country_count, countries, errorList);
                }
            }
        })
    }
    function getSiteCounts(country_count, countries, errorList, callback) {
        Site.aggregate([
            {$match:{ field:false}},
            {$unwind: '$site_country'},
            {$lookup: {from: "countries",localField: "site_country.country",foreignField: "_id",as: "country"}},
            {$project:{_id:1,country:1}},
            {$unwind: '$country'},
            {$group:{
                "_id": "$country.iso2",
                "country":{
                    $first:"$country"
                },
                project:{$addToSet:'$_id'}
            }},
            {$project:{_id:'$country._id',iso2:'$country.iso2',name:'$country.name',site_count:{ $size: "$project"}}}
        ]).exec(function (err, sites) {
            if (err) {
                errorList = errors.errorFunction(err,'Sites');
                callback(null, country_count, countries,errorList);
            }
            else {
                if(sites.length>0) {
                    var res = union(countries, sites, 'site_count')
                    callback(null, country_count, res,errorList);
                } else{
                    errorList.push({type: 'Sites', message: 'sites not found'})
                    callback(null, country_count, countries,errorList);
                }
            }
        })
    }
    function getFieldCounts(country_count, countries,errorList, callback) {
        Site.aggregate([
            {$match:{ field:true}},
            {$unwind: '$site_country'},
            {$lookup: {from: "countries",localField: "site_country.country",foreignField: "_id",as: "country"}},
            {$project:{_id:1,country:1}},
            {$unwind: '$country'},
            {$group:{
                "_id": "$country.iso2",
                "country":{
                    $first:"$country"
                },
                project:{$addToSet:'$_id'}
            }},
            {$project:{_id:'$country._id',iso2:'$country.iso2',name:'$country.name',field_count:{ $size: "$project"}}}
        ]).exec(function (err, fields) {
            if (err) {
                errorList = errors.errorFunction(err,'Concessions');
                callback(null, country_count, countries,errorList);
            }
            else {
                if (fields.length>0) {
                    var res = union(countries, fields, 'field_count')
                    callback(null, country_count, res,errorList);
                } else {
                    errorList.push({type: 'Fields', message: 'fields not found'})
                    callback(null, country_count, countries,errorList);
                }
            }
        })
    }
    function getConcessionCount(country_count, countries,errorList, callback) {
        Concession.aggregate([
            {$unwind: '$concession_country'},
            {$lookup: {from: "countries",localField: "concession_country.country",foreignField: "_id",as: "country"}},
            {$project:{_id:1,country:1}},
            {$unwind: '$country'},
            {$group:{
                "_id": "$country.iso2",
                "country":{
                    $first:"$country"
                },
                project:{$addToSet:'$_id'}
            }},
            {$project:{_id:'$country._id',iso2:'$country.iso2',name:'$country.name',concession_count:{ $size: "$project"}}}
        ]).exec(function (err, concessions) {
            if (err) {
                errorList = errors.errorFunction(err,'Concessions');
                callback(null, country_count, countries,errorList);
            } else {
                if (concessions.length>0) {
                    var res = union(countries, concessions, 'concession_count')
                    callback(null, country_count, res,errorList);
                } else {
                    errorList.push({type: 'Concessions', message: 'concessions not found'})
                    callback(null, country_count, countries,errorList);
                }
            }
        })
    }
    function getTransferCount(country_count, countries,errorList, callback) {
        Transfer.aggregate([
            {$unwind: '$country'},
            {$lookup: {from: "countries",localField: "country",foreignField: "_id",as: "country"}},
            {$project:{_id:1,country:1}},
            {$unwind: '$country'},
            {$group:{
                "_id": "$country.iso2",
                "country":{
                    $first:"$country"
                },
                project:{$addToSet:'$_id'}
            }},
            {$project:{_id:'$country._id',iso2:'$country.iso2',name:'$country.name',transfer_count:{ $size: "$project"}}}
        ]).exec(function (err, transfers) {
            if (err) {
                errorList = errors.errorFunction(err,'Concessions');
                callback(null, country_count, countries,errorList);
            } else {
                if (transfers.length>0) {
                    var res = union(countries, transfers, 'transfer_count')
                    callback(null, country_count, res,errorList);
                } else {
                    errorList.push({type: 'Transfers', message: 'transfers not found'})
                    callback(null, country_count, countries,errorList);
                }
            }
        })
    }
    function getRelevantCountries(country_count, countries,errorList, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        final_country_set = [];
        _.each(countries, function(country) {
            if (country.project_count!==0 || country.site_count!==0 || country.field_count!==0 || country.concession_count!==0 || country.transfer_count!==0) {
                final_country_set.push(country);
            } else {
                --country_count;
            }
        });
        callback(null, {data:final_country_set, count:country_count, errors:errorList})
    }
    function union(countries, param, field){
        var result = _.map(countries, function(orig){
            var list = _.find(param, function(voteItem){ return voteItem._id.toString() == orig._id.toString(); });
            if(list) {
                if(field=='field_count') {orig.field_count = list.field_count}
                if(field=='project_count') {orig.project_count = list.project_count}
                if(field=='site_count') {orig.site_count = list.site_count}
                if(field=='concession_count') {orig.concession_count = list.concession_count}
                if(field=='transfer_count') {orig.transfer_count = list.transfer_count}
            }
            return orig;
        });
        return result;
    }
};

exports.getAllDAtaCountryByID = function(req, res) {
    var _id = mongoose.Types.ObjectId(req.params.id);
    var limit = Number(req.params.limit),
        skip = Number(req.params.skip);
    errorList=[];
    var projects = {};
    projects.projects = [];
    async.waterfall([
        getMapCoordinates,
        getProjects,
        getProjectCompanyCount,
        getSites,
        getSiteCompanyCount,
        getCompanies,
        getCompanyGroup,
        getCompaniesInc,
        getCompanyIncGroup,
        getConcessions,
        getProjectCount,
        getPayments,
        getProductions
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
    function getMapCoordinates(callback) {
        projects.proj_coordinates = [];
        Site.aggregate([
                {$unwind: '$site_country'},
                {$match:{'site_country.country':_id,"site_coordinates":{ $exists: true,$nin: [ null ]}}},
                {$unwind:'$site_coordinates'},
                {$project:{
                    'lat':  { "$arrayElemAt": [ "$site_coordinates.loc", -2 ] },
                    'lng': { "$arrayElemAt": [ "$site_coordinates.loc", -1 ] },
                    'message': "$site_name",
                    'timestamp': "$site_coordinates.timestamp",
                    'type': {$cond: { if: { $gte: [ "$field", true ] }, then: 'field', else: 'site' }}
                }}
            ]).exec(function (err, sites) {
            if (err) {
                errorList = errors.errorFunction(err, 'Coordinates');
                callback(null, projects, errorList);
            } else {
                if (sites.length > 0) {
                    projects.proj_coordinates = sites;
                    callback(null, projects, errorList);
                } else {
                    errorList.push({type: 'Coordinates', message: 'coordinates not found'})
                    callback(null, projects, errorList);
                }
            }
        });
    }
    function getProjects(projects, errorList, callback) {
        projects.projects = [];
        Project.aggregate([
            { $sort : { proj_name : -1 } },
            {$unwind: '$proj_country'},
            {$match:{'proj_country.country':_id}},
            {$unwind: {"path": "$proj_status", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$proj_commodity", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "commodities",localField: "proj_commodity.commodity",foreignField: "_id",as: "commodity"}},
            {$group:{
                "_id": "$_id",
                "proj_id":{$first:"$proj_id"},
                "proj_name":{$first:"$proj_name"},
                "proj_country":{$first:"$proj_country"},
                "proj_commodity":{$first:"$commodity"},
                "proj_status":{$last:"$proj_status"},
                "project_id":{$first:"$_id"}
            }},
            {$project:{_id:1,proj_id:1,proj_name:1,project_id:1,proj_country:1,proj_commodity:1,proj_status:1,companies_count:{$literal:0},companies:[]}},
            { $skip : 0 },
            { $limit : 50}
        ]).exec(function (err, proj) {
            if (err) {
                errorList = errors.errorFunction(err,'Projects');
                callback(null, projects,errorList);
            }else {
                if (proj.length > 0) {
                    projects.projects = proj;
                    callback(null, projects, errorList);
                } else {
                    errorList.push({type: 'Projects', message: 'projects not found'})
                    callback(null, projects, errorList);
                }
            }
        });
    }
    function getProjectCompanyCount(projects, errorList, callback) {
        var project_id = _.pluck(projects.projects, 'project_id');
        Link.aggregate([
            {$match: {$or: [{project: {$in: project_id}}], entities: 'company'}},
            {$lookup: {from: "companies", localField: "company", foreignField: "_id", as: "company"}},
            {$lookup: {from: "projects", localField: "project", foreignField: "_id", as: "project"}},
            {$unwind: '$project'},
            {$unwind: '$company'},
            {
                $project: {
                    "_id": "$project._id",
                    "company": "$company",
                    "proj_country": "$project.proj_country",
                    "proj_status": "$project.proj_status",
                    "proj_commodity": "$project.proj_commodity",
                    "proj_id": "$project.proj_id",
                    "proj_name": "$project.proj_name"
                }
            },
            {$sort: {"proj_name": -1}},
            {$match: {'proj_country.country': _id}},
            {$unwind: {"path": "$proj_status", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$proj_commodity", "preserveNullAndEmptyArrays": true}},
            {
                $lookup: {
                    from: "commodities",
                    localField: "proj_commodity.commodity",
                    foreignField: "_id",
                    as: "commodity"
                }
            },
            {
                $group: {
                    "_id": "$_id",
                    "proj_id": {$first: "$proj_id"},
                    "proj_name": {$first: "$proj_name"},
                    "proj_country": {$first: "$proj_country"},
                    "proj_commodity": {$first: "$commodity"},
                    "proj_status": {$last: "$proj_status"},
                    "project_id": {$first: "$_id"},
                    "companies": {$addToSet: "$company"}
                }
            },
            {
                $project: {
                    _id: 1,
                    companies: 1,
                    companies_count: {$size: '$companies'},
                    proj_id: 1,
                    proj_name: 1,
                    project_id: 1,
                    proj_country: 1,
                    proj_commodity: 1,
                    proj_status: 1
                }
            }
        ]).exec(function (err, links) {
            if (err) {
                errorList = errors.errorFunction(err,'Project links');
                callback(null, projects,errorList);
            }else {
                if (links.length > 0) {
                    _.map(projects.projects, function (proj) {
                        var list = _.find(links, function (link) {
                            return link.proj_id == proj.proj_id;
                        });
                        if (list && list.companies) {
                            proj.companies = list.companies;
                            proj.companies_count = list.companies_count;
                        }
                        return proj;
                    });
                    callback(null, projects, errorList);
                } else {
                    errorList.push({type: 'Project links', message: 'links not found'})
                    callback(null, projects, errorList);
                }
            }
        })
    }
    function getSites(site, errorList, callback) {
            site.sites = [];
            Site.aggregate([
                { $sort : { site_name : -1 } },
                {$unwind: '$site_country'},
                {$match:{'site_country.country':_id}},
                {$unwind: {"path": "$site_status", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site_commodity", "preserveNullAndEmptyArrays": true}},
                {$lookup: {from: "commodities",localField: "site_commodity.commodity",foreignField: "_id",as: "commodity"}},
                {$group:{
                    "_id": "$_id",
                    "site_name":{$first:"$site_name"},
                    "site_country":{$first:"$site_country"},
                    "site_commodity":{$first:"$commodity"},
                    "site_status":{$last:"$site_status"}
                }},
                {$project:{_id:1,site_name:1,site_country:1,site_commodity:1,site_status:1,companies_count:{$literal:0},companies:[]}},
                { $limit : 50 },
                { $skip : 0}
            ]).exec(function (err, proj) {
                if (err) {
                    errorList = errors.errorFunction(err,'Sites');
                    callback(null, site,errorList);
                }else {
                    if (proj.length > 0) {
                        site.sites = proj
                        callback(null, site, errorList);
                    } else {
                        errorList.push({type: 'Sites', message: 'sites not found'})
                        callback(null, site, errorList);
                    }
                }
            });
    }
    function getSiteCompanyCount(sites, errorList, callback) {
            var _ids = _.pluck(sites.sites, '_id');
            Link.aggregate([
                {$match: {$or: [{site: {$in: _ids}}], entities: 'company'}},
                {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
                {$lookup: {from: "sites",localField: "site",foreignField: "_id",as: "site"}},
                {$unwind: '$site'},
                {$unwind: '$company'},
                {$project:{
                    "_id":"$site._id",
                    "company":"$company",
                    "site_country":"$site.site_country",
                    "site_status":"$site.site_status",
                    "site_commodity":"$site.site_commodity",
                    "site_name":"$site.site_name"
                }},
                { $sort : { "site_name" : -1 } },
                {$match:{'site_country.country':_id}},
                {$unwind: {"path": "$site_status", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site_commodity", "preserveNullAndEmptyArrays": true}},
                {$lookup: {from: "commodities",localField: "site_commodity.commodity",foreignField: "_id",as: "commodity"}},
                {$group:{
                    "_id": "$_id",
                    "site_name":{$first:"$site_name"},
                    "site_country":{$first:"$site_country"},
                    "site_commodity":{$first:"$commodity"},
                    "site_status":{$last:"$site_status"},
                    "companies":{$addToSet:"$company"}
                }},
                {$project:{_id:1,companies:1,companies_count:{$size:'$companies'},site_name:1,site_country:1,site_commodity:1,site_status:1}}
            ]).exec(function (err, links) {
                if (err) {
                    errorList = errors.errorFunction(err,'Site links');
                    callback(null, sites,errorList);
                }else {
                    if (links.length > 0) {
                        _.map(sites.sites, function(site){
                            var list = _.find(links, function(link){
                                return link._id.toString() == site._id.toString(); });
                            if(list && list.companies) {
                                site.companies = list.companies;
                                site.companies_count = list.companies_count;
                            }
                            return site;
                        });
                        callback(null, sites, errorList);
                    } else {
                        errorList.push({type: 'Site links', message: 'site links not found'})
                        callback(null, sites, errorList);
                    }
                }
            })
    }
    function getCompanies(companies, errorList, callback) {
            companies.companies_of_operation = [];
            Company.aggregate([
                {$unwind:'$countries_of_operation'},
                {$match:{'countries_of_operation.country':_id}},
                {$group:{
                    _id:'$_id',company_name:{$first:'$company_name'},
                    countries_of_operation:{$first:'$countries_of_operation'}
                }},
                {$project:{
                    _id:1,company_name:1,
                    countries_of_operation:"$countries_of_operation",
                    company_groups:[]}},
                { $skip : 0 },
                { $limit : 50}
            ]).exec(function (err, company) {
                if (err) {
                    errorList = errors.errorFunction(err,'Companies of operation');
                    callback(null, companies,errorList);
                }else {
                    if (company.length > 0) {
                        companies.companies_of_operation = company;
                        callback(null, companies, errorList);
                    } else {
                        errorList.push({type: 'Companies of operation', message: 'companies of operation not found'})
                        callback(null, companies, errorList);
                    }
                }
            })
    }
    function getCompanyGroup(companies, errorList, callback) {
        var companies_id = _.pluck(companies.companies_of_operation, '_id');
        Link.aggregate([
            {$match: {$or: [{company: {$in: companies_id}}], entities: 'company_group'}},
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
                errorList = errors.errorFunction(err,'Company of operation links');
                callback(null, companies,errorList);
            }else {
                if (links.length > 0) {
                    _.map(companies.companies_of_operation, function(company){
                        var list = _.find(links, function(link){
                            return company._id.toString() == link._id.toString(); });
                        if(list && list.company_groups) {
                            company.company_groups = list.company_groups;
                        }
                        return company;
                    });
                    callback(null, companies, errorList);
                } else {
                    errorList.push({type: 'Company of operation links', message: 'company of operation links not found'})
                    callback(null, companies, errorList);
                }
            }
        });
    }
    function getCompaniesInc(companies, errorList, callback) {
            companies.companies = [];
            Company.aggregate([
                {$unwind:"$country_of_incorporation"},
                {$match:{'country_of_incorporation.country':_id}},
                {$group:{
                    _id:'$_id',company_name:{$first:'$company_name'},
                    country_of_incorporation:{$first:'$country_of_incorporation'}
                }},
                {$project:{
                    _id:1,company_name:1,
                    country_of_incorporation:"$country_of_incorporation",
                    company_groups:[]}},
                { $skip : 0 },
                { $limit : 50}
            ]).exec(function (err, company) {
                if (err) {
                    errorList = errors.errorFunction(err,'Company of incorporation');
                    callback(null, companies,errorList);
                }else {
                    if (company.length > 0) {
                        companies.companies = company;
                        callback(null, companies, errorList);
                    } else {
                        errorList.push({type: 'Company of incorporation', message: 'company of incorporation not found'})
                        callback(null, companies, errorList);
                    }
                }
            })
    }
    function getCompanyIncGroup(companies, errorList, callback) {
        var companies_id = _.pluck(companies.companies, '_id');
        Link.aggregate([
            {$match: {$or: [{company: {$in: companies_id}}], entities: 'company_group'}},
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
                errorList = errors.errorFunction(err,'Company of incorporation links');
                callback(null, companies,errorList);
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
                    callback(null, companies, errorList);
                } else {
                    errorList.push({type: 'Company of incorporation links', message: 'company of incorporation links not found'})
                    callback(null, companies, errorList);
                }
            }
        });
    }
    function getConcessions(concessions, errorList, callback) {
        concessions.concessions = [];
        Concession.aggregate([
            { $sort : { concession_name : -1 } },
            {$unwind: '$concession_country'},
            {$match:{'concession_country.country':_id}},
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
            { $skip : 0},
            { $limit : 50 }
        ]).exec(function (err, concession) {
            if (err) {
                errorList = errors.errorFunction(err,'Concessions');
                callback(null, concessions,errorList);
            }else {
                if (concession.length > 0) {
                    concessions.concessions = concession;
                    callback(null, concessions, errorList);
                } else {
                    errorList.push({type: 'Concessions', message: 'concessions not found'})
                    callback(null, concessions, errorList);
                }
            }
        })
    }
    function getProjectCount(concessions, errorList, callback) {
        var _ids = _.pluck(concessions.concessions, '_id');
        Link.aggregate([
            {$match: {$or: [{concession: {$in: _ids}}], entities: 'project'}},
            {$lookup: {from: "concessions", localField: "concession", foreignField: "_id", as: "concession"}},
            {$lookup: {from: "projects", localField: "project", foreignField: "_id", as: "project"}},
            {$unwind: '$project'},
            {$unwind: '$concession'},
            {
                $project: {
                    "_id": "$concession._id",
                    "project": "$project",
                    "concession_name":"$concession.concession_name",
                    "concession_country":"$concession.concession_country",
                    "concession_commodity":"$concession.commodity",
                    "concession_status":"$concession.concession_status"
                }
            },
            {$sort: {"concession_name": -1}},
            {$match: {'concession_country.country': _id}},
            {$unwind: {"path": "$concession_status", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession_commodity", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "commodities",localField: "concession_commodity.commodity",foreignField: "_id",as: "commodity"}},
            {$group:{
                "_id": "$_id",
                "concession_name":{$first:"$concession_name"},
                "concession_country":{$first:"$concession_country"},
                "concession_commodity":{$first:"$commodity"},
                "concession_status":{$last:"$concession_status"},
                "project": {$addToSet: "$project"}
            }},
            {$project:{_id:1,concession_name:1,concession_country:1,concession_commodity:1,concession_status:1,projects_count:{$size: '$project'}}}
        ]).exec(function (err, links) {
            if (err) {
                errorList = errors.errorFunction(err,'Concession links');
                callback(null, concessions,errorList);
            }else {
                if (links.length > 0) {
                    _.map(concessions.concessions, function (concession) {
                        var list = _.find(links, function (link) {
                            return link._id.toString() == concession._id.toString();
                        });
                        if (list && list.projects_count) {
                            concession.projects_count = list.projects_count;
                        }
                        return concession;
                    });
                    callback(null, concessions, errorList);
                } else {
                    errorList.push({type: 'Concession links', message: 'concession links not found'})
                    callback(null, concessions, errorList);
                }
            }
        })
    }
    function getPayments(payments, errorList, callback){
        payments.transfers = []
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
            { $skip : 0},
            { $limit : 50 }
        ]).exec(function (err, transfers) {
            if (err) {
                errorList = errors.errorFunction(err,'Payments');
                callback(null, payments,errorList);
            }else {
                if (transfers.length > 0) {
                    payments.transfers = transfers;
                    callback(null, payments, errorList);
                } else {
                    errorList.push({type: 'Payments', message: 'payments not found'})
                    callback(null, payments, errorList);
                }
            }
        })
    }
    function getProductions(productions, errorList, callback){
        productions.productions = [];
        productions.errorList =[];
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
                site:{$cond:[{$eq:["$site", null]}, null, {_id:"$site._id",name:"$site.site_name",field:'$site.field'}]},
                production_commodity:{$cond:[{$eq:["$production_commodity", null]}, null, {_id:"$production_commodity._id",name:"$production_commodity.commodity_name",
                    commodity_id:'$production_commodity.commodity_id'}]},
                production_year:1,production_volume:1,production_unit:1,production_price:1,production_price_unit:1,production_level:1
            }},
            { $skip : 0},
            { $limit : 50 }
        ]).exec(function (err, production) {
            if (err) {
                errorList = errors.errorFunction(err,'Payments');
                productions.errorList = errorList;
                callback(null, productions,errorList);
            }else {
                if (production.length > 0) {
                    productions.errorList = errorList;
                    productions.productions = production;
                    callback(null, productions, errorList);
                } else {
                    errorList.push({type: 'Payments', message: 'payments not found'})
                    productions.errorList = errorList;
                    callback(null, productions, errorList);
                }
            }
        })
    }
};

exports.getCountryByID = function(req, res) {
    var country_id;
    var errorList =[];
    async.waterfall([
        getCountry,
        getProjects,
        getSites,
        getConcessions
    ], function (err, result) {
        if (err) {
            res.send({commodities:[],country:[],error:err});
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function getCountry(callback) {
        Country.aggregate([
            {$match:{iso2:req.params.id}},
            {$lookup: {from: "commodities",localField: "country_commodity.commodity",foreignField: "_id",as: "country_commodity"}}
        ]).exec(function(err, country) {
            if (err) {
                errorList = errors.errorFunction(err,'Countries');
                res.send({commodities:[],country:[],error:errorList});
            } else {
                if (country.length > 0) {
                    country_id = mongoose.Types.ObjectId(country[0]._id);
                    callback(null, country[0], errorList);
                } else {
                    errorList.push({type: 'Countries', message: 'countries not found'})
                    callback(null, country[0], errorList);
                }
            }
        });
    }
    function getProjects(country,errorList, callback) {
        Project.aggregate([
                {$unwind: '$proj_country'},
                {$match:{'proj_country.country': country_id}},
                {$unwind: '$proj_commodity'},
                {$lookup: {from: "commodities",localField: "proj_commodity.commodity",foreignField: "_id",as: "commodity"}},
                {$project:{_id:1,commodity:1}},
                {$unwind: '$commodity'},
                {$group:{
                    "_id": "$commodity._id",
                    "commodity":{
                        $first:"$commodity"
                    }
                }},
                {$project:{_id:'$commodity._id',commodity_name:'$commodity.commodity_name',commodity_type:'$commodity.commodity_type',commodity_id:'$commodity.commodity_id'}}
            ]).exec(function (err, commodities) {
            if (err) {
                errorList = errors.errorFunction(err,'Project commodities');
                callback(null, commodities,errorList,country);
            }
            else {
                if (commodities.length>0) {
                    callback(null, commodities, errorList,country);
                } else {
                    errorList.push({type: 'Project commodities', message: 'projects not found'})
                    callback(null, commodities, errorList,country);
                }
            }
        })
    }
    function getSites(commodities, errorList, country , callback) {
        Site.aggregate([
            {$unwind: '$site_country'},
            {$match:{'site_country.country':  country_id}},
            {$unwind: '$site_commodity'},
            {$lookup: {from: "commodities",localField: "site_commodity.commodity",foreignField: "_id",as: "commodity"}},
            {$project:{_id:1,commodity:1}},
            {$unwind: '$commodity'},
            {$group:{
                "_id": "$commodity._id",
                "commodity":{
                    $first:"$commodity"
                }
            }},
            {$project:{_id:'$commodity._id',commodity_name:'$commodity.commodity_name',commodity_type:'$commodity.commodity_type',commodity_id:'$commodity.commodity_id'}}
        ]).exec(function (err, site_commodities) {
            if (err) {
                errorList = errors.errorFunction(err,'Site commodities');
                callback(null, commodities,errorList,country);
            }
            else {
                if (site_commodities.length>0) {
                    commodities = _.union(commodities,site_commodities);
                    callback(null, commodities, errorList,country);
                } else {
                    errorList.push({type: 'Site commodities', message: 'site commodities not found'})
                    callback(null, commodities, errorList,country);
                }
            }
        })
    }
    function getConcessions(commodities, errorList, country, callback) {
        Concession.aggregate([
            {$unwind: '$concession_country'},
            {$match:{'concession_country.country':  country_id}},
            {$unwind: '$concession_commodity'},
            {$lookup: {from: "commodities",localField: "concession_commodity.commodity",foreignField: "_id",as: "commodity"}},
            {$project:{_id:1,commodity:1}},
            {$unwind: '$commodity'},
            {$group:{
                "_id": "$commodity._id",
                "commodity":{
                    $first:"$commodity"
                }
            }},
            {$project:{_id:'$commodity._id',commodity_name:'$commodity.commodity_name',commodity_type:'$commodity.commodity_type',commodity_id:'$commodity.commodity_id'}}
        ]).exec(function (err, concession_commodities) {
            if (err) {
                errorList = errors.errorFunction(err,'Site commodities');
                if(commodities.length>0){
                    commodities = commodities[0]
                }
                callback(null,{commodities: commodities,country:country,errorList:errorList});
            }
            else {
                if (concession_commodities.length>0) {
                    commodities = _.union(commodities,concession_commodities);
                    callback(null, {commodities: commodities,country:country,errorList:errorList});
                } else {
                    errorList.push({type: 'Concession commodities', message: 'concession commodities not found'})
                    callback(null, {commodities: commodities,country:country,errorList:errorList});
                }
            }
        })
    }

};

exports.createCountry = function(req, res, next) {
    var countryData = req.body;
    Country.create(countryData, function(err, country) {
        if(err){
            res.status(400);
            err = new Error('Error');
            return res.send({reason:err.toString()})
        } else{
            res.send();
        }
    });
};

exports.updateCountry = function(req, res) {
    var countryUpdates = req.body;
    Country.findOne({_id:req.body._id}).exec(function(err, country) {
        if(err) {
            res.status(400);
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
        country.iso2= countryUpdates.iso2;
        country.name= countryUpdates.name;
        country.save(function(err) {
            if(err) {
                err = new Error('Error');
                return res.send({reason: err.toString()});
            } else{
                res.send();
            }
        })
    });
};

exports.deleteCountry = function(req, res) {
    Country.remove({_id: req.params.id}, function(err) {
        if(!err) {
            res.send();
        }else{
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
    });
};