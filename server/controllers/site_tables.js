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
    _               = require("underscore"),
    request         = require('request');



exports.getSiteFieldTable = function(req, res){

    var _id = mongoose.Types.ObjectId(req.params.id);
    var link_counter, link_len,site_counter,site_len,companies_len,companies_counter;
    var site ={};
    site.sites=[];
    var type = req.params.type;
    var query='';
    if(type=='company') { query = {company:req.params.id, entities:"site"}}
    if(type=='concession') { query = {concession:req.params.id, entities:"site"}}
    if(type=='contract') { query = {contract:req.params.id, entities:"site"}}
    if(type=='commodity') { query = {'site_commodity.commodity':req.params.id}}
    if(type=='country') { query = {'site_country.country':req.params.id}}
    if(type=='group') { query={company_group: req.params.id, entities: "company"}}
    async.waterfall([
        getLinks,
        getSites,
        getCountrySites,
        getCompanyCount,
        getGroupLinkedCompanies,
        getGroupLinkedProjects
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
        if(type!='commodity'&&type!='group'&&type!='country') {
            Link.find(query)
                .populate('site commodity country')
                .deepPopulate('site.site_country.country site.site_commodity.commodity')
                .exec(function (err, links) {
                    if (links.length>0) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            site.sites.push({
                                _id: link.site._id,
                                field: link.site.field,
                                site_name: link.site.site_name,
                                site_status: link.site.site_status,
                                site_country: link.site.site_country,
                                site_commodity: link.site.site_commodity
                            });

                            if (link_len == link_counter) {
                                site.sites = _.map(_.groupBy(site.sites,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                callback(null, site);
                            }

                        })
                    } else {
                        callback(null, site);
                    }
                });
        } else {
            callback(null, site);
        }
    }

    function getSites(site, callback) {
        if(type=='commodity') {
            Site.find(query)
                .populate('contract commodity country site_country.country site_commodity.commodity')
                .exec(function (err, sites) {
                    site_counter = 0;
                    site_len = sites.length;
                    if(site_len>0) {
                        sites.forEach(function (s) {
                            ++site_counter;
                            site.sites.push({
                                _id: s._id,
                                field: s.field,
                                site_name: s.site_name,
                                site_status: s.site_status,
                                site_country: s.site_country,
                                site_commodity: s.site_commodity,
                                companies:0
                            });
                            if (site_counter === site_len) {
                                site.sites = _.map(_.groupBy(site.sites,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                callback(null, site);
                            }
                        });
                    }else {
                        callback(null, site);
                    }
                });
        }else {
            callback(null, site);
        }
    }

    function getCountrySites(site, callback) {
        if(type=='country') {
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
                site.sites = proj
                callback(null, site);
            });
            //Site.find(query)
            //    .populate('contract commodity country site_country.country site_commodity.commodity')
            //    .exec(function (err, sites) {
            //        link_len = sites.length;
            //        link_counter = 0;
            //        if(link_len>0) {
            //            _.each(sites, function (s) {
            //                ++link_counter;
            //                site.sites.push({
            //                    _id: s._id,
            //                    field: s.field,
            //                    site_name: s.site_name,
            //                    site_status: s.site_status,
            //                    site_country: s.site_country,
            //                    site_commodity: s.site_commodity,
            //                    companies:0
            //                });
            //                if (link_len == link_counter) {
            //                    site.sites = _.map(_.groupBy(site.sites,function(doc){
            //                        return doc._id;
            //                    }),function(grouped){
            //                        return grouped[0];
            //                    });
            //                    callback(null, site);
            //                }
            //            })
            //        }else{
            //            callback(null, site);
            //        }
            //    });
        } else{
            callback(null, site);
        }
    }
    function getCompanyCount(sites, callback) {
        if (type == 'commodity'||type=='country') {

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
                _.map(sites.sites, function(site){
                    var list = _.find(links, function(link){
                        return link._id.toString() == site._id.toString(); });
                    if(list && list.companies) {
                        site.companies = list.companies;
                        site.companies_count = list.companies_count;
                    }
                    return site;
                });
                callback(null, sites);
            })
            //site_len = sites.sites.length;
            //site_counter = 0;
            //if (site_len > 0) {
            //    sites.sites.forEach(function (site) {
            //        Link.find({site: site._id, entities: 'company'})
            //            .populate('company', '_id company_name')
            //            .exec(function (err, links) {
            //                ++site_counter;
            //                link_len = links.length;
            //                link_counter = 0;
            //                _.each(links, function (link) {
            //                    ++link_counter;
            //                    site.companies = +1;
            //                });
            //                if (link_len == link_counter && site_counter == site_len) {
            //                    callback(null, sites);
            //                }
            //
            //            });
            //    });
            //} else {
            //    callback(null, sites);
            //}
        } else {
            callback(null, sites);
        }
    }
    function getGroupLinkedCompanies(site,callback) {
        var company =[];
        if(type=='group') {
            Link.find(query)
                .exec(function (err, links) {
                    if (links.length>0) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            if(link.company!=undefined) {
                                company.push({_id: link.company});
                            }
                            if (link_len == link_counter) {
                                company = _.map(_.groupBy(company,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                callback(null, company);
                            }
                        })
                    } else {
                        callback(null, site);
                    }
                });
        } else{
            callback(null, site);
        }
    }
    function getGroupLinkedProjects(companies,callback) {
        if(type=='group') {
            if(companies.length>0) {
                companies_len = companies.length;
                companies_counter = 0;
                _.each(companies, function (company) {
                    if(company._id!=undefined){
                    query = {company: company._id, entities: "site"};
                    Link.find(query)
                        .populate('site commodity country')
                        .deepPopulate('site.site_country.country site.site_commodity.commodity')
                        .exec(function (err, links) {
                            ++companies_counter;
                            if (links.length>0) {
                                link_len = links.length;
                                link_counter = 0;
                                _.each(links, function (link) {
                                    ++link_counter;
                                    site.sites.push({
                                        _id: link.site._id,
                                        field: link.site.field,
                                        site_name: link.site.site_name,
                                        site_status: link.site.site_status,
                                        site_country: link.site.site_country,
                                        site_commodity: link.site.site_commodity
                                    });

                                    if (link_len == link_counter && companies_counter == companies_len) {
                                        site.sites = _.map(_.groupBy(site.sites,function(doc){
                                            return doc._id;
                                        }),function(grouped){
                                            return grouped[0];
                                        });
                                        callback(null, site);
                                    }

                                })
                            } else {
                                callback(null, site);
                            }
                        });
                    }
                })
            } else{
                callback(null, site);
            }
        } else{
            callback(null, site);
        }
    }
};