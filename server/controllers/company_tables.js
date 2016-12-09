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
    Company 	    = require('mongoose').model('Company'),
    async           = require('async'),
    mongoose 		= require('mongoose'),
    errors 	        = require('./errorList'),
    _               = require("underscore"),
    request         = require('request');

exports.getCompanyTable = function(req, res) {
    var link_counter, link_len, companies_len, companies_counter, errorList=[], company_counter;
    var limit = Number(req.params.limit),
        skip = Number(req.params.skip);
    var type = req.params.type;
    var _id = mongoose.Types.ObjectId(req.params.id);
    var query = '';
    if (type == 'project') {
        query = {project: _id, entities: "company"}
    }
    if (type == 'site' || type == 'field') {
        query = {site: _id, entities: "company"}
    }
    if (type == 'concession') {
        query = {concession: _id, entities: "company"}
    }
    if (type == 'contract') {
        query = {contract: _id, entities: "company"}
    }
    if (type == 'commodity') {
        query = {commodity: _id}
    }
    if (type == 'country_of_incorporation') {
        query = {'country_of_incorporation.country': _id}
    }
    if (type == 'countries_of_operation') {
        query = {'countries_of_operation.country': _id}
    }
    var models = [
        {name: 'Site', field: {'site_commodity.commodity': _id}, params: 'site'},
        {name: 'Concession', field: {'concession_commodity.commodity': _id}, params: 'concession'},
        {name: 'Project', field: {'proj_commodity.commodity': _id}, params: 'project'}
    ];
    var companies = {};
    companies.companies = [];
    companies.query = [];
    var models_len, models_counter = 0, counter = 0;
    async.waterfall([
        getProjectLinks,
        getCommodityLinks,
        getCommodityCompany,
        getOperationCompanies,
        getIncorporatedCompanies,
        getCompanyGroup
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
    function getProjectLinks(callback) {
        if (type != 'commodity' && type != 'country_of_incorporation' && type != 'countries_of_operation') {
            Link.aggregate([
                {$match:query},
                {$lookup: {from: "companies", localField: "company", foreignField: "_id", as: "company"}},
                {$unwind: "$company"},
                {$project:{_id:1, company:{company_name:'$company.company_name', _id:'$company._id',
                    company_groups:{$literal:[]}}}},
                {$group:{
                    _id: null,
                    company:{$addToSet:'$company'}
                }
                },
                {$skip:skip},
                {$limit:limit}
            ]).exec(function (err, links) {
                if (err) {
                    errorList = errors.errorFunction(err, 'Companies links');
                    callback(null, companies, errorList);
                } else {
                    if (links.length > 0) {
                        companies.companies = links[0].company;
                        callback(null, companies, errorList);
                    } else {
                        errorList.push({type: 'Companies links', message: 'companies links not found'})
                        callback(null, companies, errorList);
                    }
                }
            });
        } else {
            callback(null, companies,errorList);
        }
    }

    function getCommodityLinks(companies,errorList, callback) {
        if (type == 'commodity') {
            models_counter = 0;
            companies.query = [];
            models_len = models.length;
            _.each(models, function (model) {
                var name = require('mongoose').model(model.name);
                var $field = model.field;
                name.find($field).exec(function (err, responce) {
                    models_counter++;
                    _.each(responce, function (re) {
                        counter++;
                        if (model.params == 'project') {
                            companies.query.push({project: re._id, entities: 'company'})
                        }
                        if (model.params == 'concession') {
                            companies.query.push({concession: re._id, entities: 'company'})
                        }
                        if (model.params == 'site') {
                            companies.query.push({site: re._id, entities: 'company'})
                        }
                    });
                    if (models_counter == models_len) {
                        callback(null, companies,errorList);
                    }
                });
            });
        } else {
            callback(null, companies,errorList);
        }
    }

    function getCommodityCompany(companies, errorList, callback) {
        if (type == 'commodity') {
            companies_len = companies.query.length;
            companies_counter = 0;
            if (companies_len > 0) {
                companies.query.forEach(function (query) {
                    Link.find({$or: [query]})
                        .populate('company company_group')
                        .exec(function (err, links) {
                            ++companies_counter;
                            if (links.length > 0) {
                                link_len = links.length;
                                link_counter = 0;
                                _.each(links, function (link) {
                                    ++link_counter;
                                    companies.companies.push({
                                        company_name: link.company.company_name,
                                        _id: link.company._id,
                                        company_groups: []
                                    });
                                    companies.companies = _.map(_.groupBy(companies.companies, function (doc) {
                                        return doc._id;
                                    }), function (grouped) {
                                        return grouped[0];
                                    });
                                });

                                if (link_len == link_counter && companies_counter == companies_len) {
                                    callback(null, companies,errorList);
                                }
                            } else {
                                if (companies_counter == companies_len) {
                                    callback(null, companies,errorList);
                                }
                            }
                        });
                });
            } else {
                callback(null, companies,errorList);
            }
        } else {
            callback(null, companies,errorList);
        }
    }

    function getOperationCompanies(companies,errorList, callback) {
        if (type == 'countries_of_operation') {
            companies.companies_of_operation = [];
            Company.aggregate([
                {$unwind: '$countries_of_operation'},
                {$match: {'countries_of_operation.country': _id}},
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
                    errorList = errors.errorFunction(err, 'Companies of operation');
                    callback(null, companies,errorList);
                } else {
                    if (company.length > 0) {
                        companies.companies_of_operation = company;
                        callback(null, companies,errorList);
                    } else {
                        errorList.push({type: 'Companies of operation', message: 'companies of operation not found'})
                        callback(null, companies,errorList);
                    }
                }
            })
        } else {
            callback(null, companies,errorList);
        }
    }

    function getIncorporatedCompanies(companies, errorList,callback) {
        if (type == 'country_of_incorporation') {
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
                { $skip : skip },
                { $limit : limit}
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
        } else {
            callback(null, companies,errorList);
        }
    }

    function getCompanyGroup(companies, errorList, callback) {
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
                    errorList.push({type: 'Company of incorporation links', message: 'company of incorporation links not found'})
                    callback(null, companies);
                }
            }
        });
    }
}