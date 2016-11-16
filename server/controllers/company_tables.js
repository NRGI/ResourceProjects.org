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
    _               = require("underscore"),
    request         = require('request');

exports.getCompanyTable = function(req, res){
    var link_counter, link_len, companies_len, companies_counter, company_len, company_counter;
    var type = req.params.type;
    var _id = mongoose.Types.ObjectId(req.params.id);
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
        //getOperatingCompanies,
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
            Company.aggregate([
                {$unwind:{"path": '$countries_of_operation', "preserveNullAndEmptyArrays": true}},
                {$unwind:{"path": "$country_of_incorporation", "preserveNullAndEmptyArrays": true}},
                {$match:{
                    $or:[
                        {'countries_of_operation.country':_id},
                        {'country_of_incorporation.country':_id}
                    ]}},
                {$group:{
                    _id:'$_id',company_name:{$first:'$company_name'},
                    countries_of_operation:{$first:'$countries_of_operation'},
                    country_of_incorporation:{$first:'$country_of_incorporation'}
                }},
                {$project:{
                    _id:1,company_name:1,

                    countries_of_operation:{$cond:[{$eq:["$countries_of_operation", null]}, false, true]},
                    country_of_incorporation:{$cond:[{$eq:["$country_of_incorporation", null]}, false, true]},
                    company_groups:[]}}
            ]).exec(function (err, company) {
                companies.companies = company;
                callback(null, companies);
            })
        } else{
            callback(null, companies);
        }
    }
    function getCompanyGroup(companies, callback) {

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
            _.map(companies.companies, function(company){
                var list = _.find(links, function(link){
                    return company._id.toString() == link._id.toString(); });
                if(list && list.company_groups) {
                    company.company_groups = list.company_groups;
                }
                return company;
            });
           callback(null, companies);
        });
    }
};