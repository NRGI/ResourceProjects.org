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
    _               = require("underscore"),
    request         = require('request');

exports.getCompanyTable = function(req, res){
    var link_counter, link_len, companies_len, companies_counter, company_len, company_counter;
    var type = req.params.type;
    var query='';
    if(type=='project') { query = {project:req.params.id, entities:"company"}}
    if(type=='site'||type=='field') { query = {site:req.params.id, entities:"company"}}
    if(type=='concession') { query = {concession:req.params.id, entities:"company"}}
    if(type=='contract') { query = {contract:req.params.id, entities:"company"}}
    if(type=='commodity') { query = {commodity:req.params.id}}
    if(type=='country_of_incorporation') { query = {'country_of_incorporation.country':req.params.id}}
    if(type=='countries_of_operation') { query = {'countries_of_operation.country':req.params.id}}
    var models = [
        {name:'Site',field:{'site_commodity.commodity':req.params.id},params:'site'},
        {name:'Concession',field:{'concession_commodity.commodity':req.params.id},params:'concession'},
        {name:'Project',field:{'proj_commodity.commodity':req.params.id},params:'project'}
    ];
    var companies = {};
    companies.companies = [];companies.query=[];
    var models_len,models_counter=0,counter=0;
    async.waterfall([
        getProjectLinks,
        getCommodityLinks,
        getCommodityCompany,
        getIncorporatedCompanies,
        getOperatingCompanies,
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
        if(type!='commodity'&&type!='country_of_incorporation'&&type!='countries_of_operation') {
            Link.find(query)
                .populate('company')
                .deepPopulate('company_group')
                .exec(function (err, links) {
                    if (links.length>0) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            var name = '';
                            if(link.company) {
                                if (link.company.company_name) {
                                    name = link.company.company_name;
                                }
                                companies.companies.push({
                                    company_name: name,
                                    _id: link.company._id,
                                    company_groups: []
                                });
                            }
                            companies.companies = _.map(_.groupBy(companies.companies,function(doc){
                                return doc._id;
                            }),function(grouped){
                                return grouped[0];
                            });
                            if (link_len == link_counter) {
                                callback(null, companies);
                            }

                        })
                    } else {
                        callback(null, companies);
                    }
                });
        } else{
            callback(null, companies);
        }
    }
    function getCommodityLinks(companies,callback) {
        if(type=='commodity') {
            models_counter=0;
            companies.query=[];
            models_len = models.length;
            _.each(models, function(model) {
                var name = require('mongoose').model(model.name);
                var $field = model.field;
                name.find($field).exec(function (err, responce) {
                    models_counter++;
                    _.each(responce, function(re) {
                        counter++;
                        if(model.params=='project'){companies.query.push({project:re._id,entities:'company'})}
                        if(model.params=='concession'){companies.query.push({concession:re._id,entities:'company'})}
                        if(model.params=='site'){companies.query.push({site:re._id,entities:'company'})}
                    });
                    if(models_counter==models_len){
                        callback(null, companies);
                    }
                });
            });
        }else {
            callback(null, companies);
        }
    }
    function getCommodityCompany(companies, callback) {
        if(type=='commodity') {
            companies_len = companies.query.length;
            companies_counter = 0;
            if (companies_len > 0) {
                companies.query.forEach(function (query) {
                    Link.find({$or: [query]})
                        .populate('company company_group')
                        .exec(function (err, links) {
                            ++companies_counter;
                            if(links.length>0) {
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
                                    callback(null, companies);
                                }
                            } else {
                                if(companies_counter == companies_len){
                                    callback(null, companies);
                                }
                            }
                        });
                });
            } else {
                callback(null, companies);
            }
        } else {
            callback(null, companies);
        }
    }
    function getIncorporatedCompanies(companies, callback) {
        if(type=='country_of_incorporation') {
            companies.companies = [];
            Company.find(query)
                .populate('company_aliases', ' _id alias')
                .populate('company_group')
                .exec(function (err, company) {
                    company_len = company.length;
                    company_counter = 0;
                    if (company_len > 0) {
                        _.each(company, function (c) {
                            company_counter++;
                            companies.companies.push({
                                _id: c._id,
                                company_name: c.company_name,
                                company_groups: []
                            });
                        });
                        if (company_counter == company_len) {
                            callback(null, companies);
                        }
                    } else {
                        callback(null, companies);
                    }
                });
        } else{

            callback(null, companies);
        }
    }
    function getOperatingCompanies(companies, callback) {
        if(type=='countries_of_operation') {
            companies.companies = [];
            Company.find(query)
                .populate('company_aliases', ' _id alias')
                .populate('company_group')
                .exec(function (err, company) {
                    company_len = company.length;
                    company_counter = 0;
                    if (company_len > 0) {
                        _.each(company, function (c) {
                            company_counter++;
                            companies.companies.push({
                                _id: c._id,
                                company_name: c.company_name,
                                company_groups: []
                            });
                        });
                        if (company_counter == company_len) {
                            callback(null, companies);
                        }
                    } else {
                        callback(null, companies);
                    }
                });
        } else{

            callback(null, companies);
        }
    }
    function getCompanyGroup(companies, callback) {
        companies_len = companies.companies.length;
        companies_counter = 0;
        if (companies_len > 0) {
            companies.companies.forEach(function (company) {
                Link.find({company: company._id, entities: 'company_group'})
                    .populate('company_group', '_id company_group_name')
                    .exec(function (err, links) {
                        ++companies_counter;
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links,function(link){
                            ++link_counter;
                            company.company_groups.push(link.company_group);
                        });
                        if(link_len==link_counter&&companies_counter == companies_len){
                            callback(null, companies);
                        }

                    });
            });
        } else {
            callback(null, companies);
        }
    }
};