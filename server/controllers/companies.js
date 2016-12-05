var Company 		= require('mongoose').model('Company'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production      = require('mongoose').model('Production'),
    Commodity 	    = require('mongoose').model('Commodity'),
    async           = require('async'),
    errors 	        = require('./errorList'),
    _               = require("underscore"),
    request         = require('request');

exports.getCompanies = function(req, res) {
    var data={}, link_len, company_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip),
        errorList=[];

    async.waterfall([
        companyCount,
        getCompanySet,
        getCompanyLinks,
        getTransfersCount
    ], function (err, result) {
        if (err) {
            res.send(err);
        }else{
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });

    function companyCount(callback) {
        Company.find({}).count().exec(function(err, company_count) {
            if (err) {
                err = new Error('Error: '+ err);
                return res.send({companies:[],reason: err.toString()});
            } else if (company_count == 0) {
                return res.send({companies:[],reason: 'not found'});
            } else {
                callback(null, company_count);
            }
        });
    }
    function getCompanySet(company_count, callback) {
        Company.aggregate([
            {$sort: {company_name: -1}},
            {$project:{_id:1,company_name:1,company_groups:[],
                project_count:{ "$literal" : 0 },
                site_count:{ "$literal" : 0 },
                field_count:{ "$literal" : 0 },
                transfer_count:{ "$literal" : 0 }}
            },
            {$skip: skip},
            {$limit: limit}
        ]).exec(function (err, companies) {
            if (err) {
                errorList = errors.errorFunction(err,'Companies');
                callback(null, company_count, companies,errorList);
            }
            else {
                if (companies.length>0) {
                    callback(null, company_count, companies, errorList);
                } else {
                    errorList.push({type: 'Companies', message: 'companies not found'})
                    return res.send({companies:[],reason: 'companies not found'});
                }
            }
        });
    }
    function getCompanyLinks(company_count, companies, errorList, callback) {
        var company_id = _.pluck(companies, '_id');
        Link.aggregate([
            {$match: {$or: [{company: {$in: company_id}}]}},
            {$lookup: {from: "sites", localField: "site", foreignField: "_id", as: "site"}},
            {$project:{_id:1,company:1,company_group:1, project:1,
                field: {
                    $filter: {
                        input: "$site",
                        as: "site",
                        cond: { $and: [ "$$site.field", true ] }
                    }
                },
                site:{
                    $filter: {
                        input: "$site",
                        as: "item",
                        cond: { $and: [ "$$item.field", false ] }
                    }
                }}
            },
            {$unwind: {"path": "$field", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
            {$group:{
                "_id": "$company",
                "company_groups":{$addToSet:"$company_group"},
                "project_count":{$addToSet:"$project"},
                "site_count":{$addToSet:"$site"},
                "field_count":{$addToSet:"$field"}
            }},
            {$project:{_id:1,company:1,company_groups:1,
                project_count:{$size:'$project_count'},
                site_count:{$size:'$site_count'},
                field_count:{$size:'$field_count'}
            }},
            {$unwind: {"path": "$company_groups", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "companygroups", localField: "company_groups", foreignField: "_id", as: "company_groups"}},
            {$unwind: {"path": "$company_groups", "preserveNullAndEmptyArrays": true}},
            {$project:{_id:1,company:1,company_groups:{$cond: { if:  {$not: "$company_groups" }, then: [],
                else: {company_group_name:"$company_groups.company_group_name",_id:"$company_groups._id"}}},
                project_count:1,
                site_count:1,field_count:1
            }},
            {$group:{
                "_id": "$_id",
                "company_groups":{$addToSet:"$company_groups"},
                "project_count":{$first:"$project_count"},
                "site_count":{$first:"$site_count"},
                "field_count":{$first:"$field_count"}
            }}
        ]).exec(function(err, links) {
            if (err) {
                errorList = errors.errorFunction(err,'Company links');
                callback(null, company_count, companies,errorList);
            }
            else {
                if (links.length>0) {
                    _.map(companies, function (company) {
                        var list = _.find(links, function (link) {
                            return link._id.toString() == company._id.toString();
                        });
                        if (list) {
                            company.company_groups = list.company_groups;
                            company.project_count = list.project_count;
                            company.site_count = list.site_count;
                            company.field_count = list.field_count;
                        }
                        return company;
                    });
                    callback(null, company_count, companies, errorList);
                } else {
                    errorList.push({type: 'Company links', message: 'company links not found'})
                    callback(null, company_count, companies, errorList);
                }
            }
        })
    }
    function getTransfersCount(company_count, companies, errorList, callback) {
        var company_id = _.pluck(companies, '_id');
        Transfer.aggregate([
            {$match:{company: {$in: company_id}}},
            {$group:{
                "_id": "$company",
                "transfer_count":{$addToSet:"$_id"}
            }},
            {$project:{_id:1,transfer_count:{$size:'$transfer_count'}}}
        ]).exec(function (err, transfers) {
            data.company_count = company_count;
            if (err) {
                errorList = errors.errorFunction(err,'Transfers');
                data.companies = companies;
                data.errorList = errorList;
                callback(null, data);
            }
            else {
                if (transfers.length>0) {
                    _.map(companies, function (company) {
                        var list = _.find(transfers, function (link) {
                            return link._id.toString() == company._id.toString();
                        });
                        if (list) {
                            company.transfer_count = list.transfer_count;
                        }
                        return company;
                    });
                    data.companies = companies;
                    data.errorList = errorList;
                    callback(null, data);
                } else {
                    errorList.push({type: 'Transfers', message: 'transfers not found'});
                    data.companies = companies;
                    data.errorList = errorList;
                    callback(null, data);
                }
            }
        })
    }
};

exports.getCompanyID = function(req, res) {

    async.waterfall([
        getCompany
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
    function getCompany(callback) {
        Company.findOne({_id:req.params.id})
            .populate('company_aliases', ' _id alias')
            .populate('company_group','_id company_group_name')
            .populate('country.country')
            .lean()
            .exec(function(err, company) {
                if(company) {
                    callback(null, company);
                } else {
                    callback(err);
                }
            });
    }
};

exports.getCompanyByID = function(req, res) {
    var company={},link_counter, link_len;

    async.waterfall([
        getCompanyLinks
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
    function getCompanyLinks(callback) {
        company.company_groups = [];
        company.company_commodity = [];
        Link.find({company: req.params.id})
            .populate('company_group', '_id company_group_name')
            .populate('commodity concession')
            .deepPopulate('project.proj_country.country project.proj_commodity.commodity site.site_commodity.commodity site.site_country.country concession.concession_country.country concession.concession_commodity.commodity')
            .exec(function (err, links) {
                link_len = links.length;
                link_counter = 0;
                if (link_len > 0) {
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'company')[0];
                        switch (entity) {
                            case 'site':
                                if (link.site.site_commodity.length > 0) {
                                    if (_.where(company.company_commodity, {_id: _.last(link.site.site_commodity)._id}).length < 1) {
                                        company.company_commodity.push({
                                            _id: _.last(link.site.site_commodity)._id,
                                            commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                        });
                                    }
                                }
                                break;
                            case 'project':
                                if (link.project && link.project.proj_commodity.length > 0) {
                                    if (_.where(company.company_commodity, {_id: _.last(link.project.proj_commodity).commodity._id}).length < 1) {
                                        company.company_commodity.push({
                                            _id: _.last(link.project.proj_commodity).commodity._id,
                                            commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                        });
                                    }
                                }
                                break;
                            case 'company_group':
                                if (!company.company_groups.hasOwnProperty(link.company_group.company_group_name)) {
                                    company.company_groups.push({
                                        _id: link.company_group._id,
                                        company_group_name: link.company_group.company_group_name
                                    });
                                }
                                break;
                            case 'concession':
                                if (link.concession.concession_commodity.length > 0) {
                                    if (_.where(company.company_commodity, {_id: _.last(link.concession.concession_commodity).commodity._id}).length < 1) {
                                        company.company_commodity.push({
                                            _id: _.last(link.concession.concession_commodity).commodity._id,
                                            commodity_name: _.last(link.concession.concession_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.concession.concession_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.concession.concession_commodity).commodity.commodity_id
                                        });
                                    }

                                }
                                break;
                            default:
                                console.log(entity, 'link skipped...');
                        }
                        if (link_counter == link_len) {
                            callback(null, company);
                        }
                    });
                } else {
                    callback(null, company);
                }
            });
    }
}

exports.createCompany = function(req, res, next) {
    var companyData = req.body;
    Company.create(companyData, function(err, company) {
        if(err){
            res.status(400);
            err = new Error('Error');
            return res.send({reason:err.toString()})
        } else {
            res.send();
        }
    });
};

exports.updateCompany = function(req, res) {
    var companyUpdates = req.body;
    Company.findOne({_id:req.body._id}).exec(function(err, company) {
        if(err) {
            res.status(400);
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
        company.company_name= companyUpdates.company_name;
        company.company_aliases= companyUpdates.company_aliases;
        company.company_established_source= companyUpdates.company_established_source;
        company.country_of_incorporation= companyUpdates.country_of_incorporation;
        company.countries_of_operation= companyUpdates.countries_of_operation;
        company.description= companyUpdates.description;
        company.save(function(err) {
            if(err) {
                err = new Error('Error');
                return res.send({reason: err.toString()});
            } else {
                res.send();
            }
        })
    });
};

exports.deleteCompany = function(req, res) {
    Company.remove({_id: req.params.id}, function(err) {
        if(!err) {
            res.send();
        } else{
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
    });
};