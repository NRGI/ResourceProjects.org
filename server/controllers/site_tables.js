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


exports.getSiteFieldTable = function(req, res){
    console.log(req.params)

    var id = mongoose.Types.ObjectId(req.params.id);
    var link_counter, link_len, companies_len,companies_counter;
    var data ={};
    var company =[];
    data.sites=[];
    data.errorList=[];
    var limit = parseInt(req.params.limit);
    var skip = parseInt(req.params.skip);
    var type = req.params.type;
    var query='';
    if(type=='company') { query = {company:id, entities:"site"}}
    if(type=='concession') { query = {concession:id, entities:"site"}}
    if(type=='contract') { query = {contract:id, entities:"site"}}

    if(type=='commodity') { query = {'site_commodity.commodity':id}}
    if(type=='country') { query = {'site_country.country':id}}
    if(type=='group') { query={company_group: id, entities: "company"}}
    async.waterfall([
        getLinks,
        getSites,
        getCountrySites,
        getCompanyCount,
        getGroupLinkedCompanies,
        getGroupLinkedProjects
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err, 'Sites');
            res.send(data);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function getLinks(callback) {
        if (type != 'commodity' && type != 'group' && type != 'country') {
            Link.aggregate([
                {$match: query},
                {$lookup: {from: "sites", localField: "site", foreignField: "_id", as: "site"}},
                {$unwind: '$site'},
                {$unwind: {"path": "$site.site_country", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site.site_commodity", "preserveNullAndEmptyArrays": true}},
                {
                    $lookup: {
                        from: "countries",
                        localField: "site.site_country.country",
                        foreignField: "_id",
                        as: "site.site_country"
                    }
                },
                {
                    $lookup: {
                        from: "commodities",
                        localField: "site.site_commodity.commodity",
                        foreignField: "_id",
                        as: "site.site_commodity"
                    }
                },
                {$unwind: {"path": "$site.site_country", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site.site_status", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site.site_commodity", "preserveNullAndEmptyArrays": true}},
                {
                    $group: {
                        _id: '$site._id',
                        field: {$first: '$site.field'},
                        site_name: {$first: '$site.site_name'},
                        site_status: {$first: '$site.site_status'},
                        site_commodity: {$addToSet: '$site.site_commodity'},
                        site_country: {$first: '$site.site_country'}
                    }
                },
                { $skip : skip},
                { $limit : limit }
            ]).exec(function (err, links) {
                if (err) {
                    data.errorList = errors.errorFunction(err,type+ ' site links not found');
                    return res.send(data);
                } else {
                    if (links.length > 0) {
                        data.sites = links
                        callback(null, data);
                    } else {
                        data.errorList.push({type: type, message: type + ' site links not found'})
                        return res.send(data);
                    }
                }
            })
        }else {
            callback(null, data);
        }
    }

    function getSites(data, callback) {
        if(type=='commodity') {
            Site.aggregate([
                { $sort : { site_name : -1 } },
                {$unwind: '$site_commodity'},
                {$match: query},
                {$unwind: {"path": "$site_country", "preserveNullAndEmptyArrays": true}},
                {$lookup: {from: "commodities",localField: "site_commodity.commodity",foreignField: "_id",as: "site_commodity"}},
                {$lookup: {from: "countries",localField: "site_country.country",foreignField: "_id",as: "site_country"}},

                {$unwind: {"path": "$site_country", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site_status", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site_commodity", "preserveNullAndEmptyArrays": true}},
                {$group:{
                    _id: '$_id',
                    field: {$first: '$field'},
                    site_name: {$first: '$site_name'},
                    site_status: {$first: '$site_status'},
                    site_commodity: {$addToSet: '$site_commodity'},
                    site_country: {$first: '$site_country'}
                }},
                { $skip : skip},
                { $limit : limit }
            ]).exec(function (err, sites) {
                if (err) {
                    data.errorList = errors.errorFunction(err,type+ ' site not found');
                    callback(null, data);
                } else {
                    if (sites.length > 0) {
                        data.sites = sites
                        callback(null, data);
                    } else {
                        data.errorList.push({type: type, message: type + ' site not found'})
                        callback(null, data);
                    }
                }
            });
        }else {
            callback(null, data);
        }
    }

    function getCountrySites(data, callback) {
        if(type=='country') {
            data.sites = [];
            Site.aggregate([
                { $sort : { site_name : -1 } },
                {$unwind: '$site_country'},
                {$match: query},
                {$unwind: {"path": "$site_status", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site_commodity", "preserveNullAndEmptyArrays": true}},
                {$lookup: {from: "commodities",localField: "site_commodity.commodity",foreignField: "_id",as: "commodity"}},
                {$group:{
                    "_id": "$_id",
                    field: {$first: '$field'},
                    "site_name":{$first:"$site_name"},
                    "site_country":{$first:"$site_country"},
                    "site_commodity":{$first:"$commodity"},
                    "site_status":{$last:"$site_status"}
                }},
                {$project:{_id:1,site_name:1,site_country:1,site_commodity:1,site_status:1,companies_count:{$literal:0},companies:[]}},
                { $skip : skip},
                { $limit : limit }
            ]).exec(function (err, proj) {
                if (err) {
                    data.errorList = errors.errorFunction(err, type + ' site not found');
                    callback(null, data);
                } else {
                    if (proj.length > 0) {
                        data.sites = proj
                        callback(null, data);
                    } else {
                        data.errorList.push({type: type, message: type + ' site not found'})
                        callback(null, data);
                    }
                }
            });
        } else{
            callback(null, data);
        }
    }
    function getCompanyCount(data, callback) {
        if (type == 'commodity'||type=='country') {
            var ids = _.pluck(data.sites, '_id');
            Link.aggregate([
                {$match: {$or: [{site: {$in: ids}}], entities: 'company'}},
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
                {$match:{'site_country.country':id}},
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
                {$project:{_id:1,companies:1,companies_count:{$size:'$companies'},site_name:1,site_country:1,site_commodity:1,site_status:1}},
                { $skip : skip},
                { $limit : limit }
            ]).exec(function (err, links) {
                if (err) {
                    data.errorList = errors.errorFunction(err, type + ' site not found');
                    callback(null, data);
                } else {
                    if (links && links.length > 0) {
                        _.map(data.sites, function(site) {
                            var list = _.find(links, function (link) {
                                return link._id.toString() == site._id.toString();
                            });
                            if (list && list.companies) {
                                site.companies = list.companies;
                                site.companies_count = list.companies_count;
                            }
                            return site;
                        });
                        callback(null, data);
                    } else {
                        data.errorList.push({type: type, message: type + ' site not found'})
                        callback(null, data);
                    }
                }
            })
        } else {
            callback(null, data);
        }
    }
    function getGroupLinkedCompanies(data,callback) {
        if(type=='group') {
            Link.find(query)
                .exec(function (err, links) {
                    if (err) {
                        data.errorList = errors.errorFunction(err, type + ' site not found');
                        callback(null, data);
                    } else {
                        if (links && links.length>0) {
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
                                    callback(null, data);
                                }
                            })
                        } else {
                            data.errorList.push({type: type, message: type + ' site not found'})
                            callback(null, data);
                        }
                    }
                });
        } else{
            callback(null, data);
        }
    }
    function getGroupLinkedProjects(data,callback) {
        if(type=='group') {
            if(company.length>0) {
                companies_len = company.length;
                companies_counter = 0;
                _.each(company, function (c) {
                    if(c._id!=undefined){
                    query = {company: c._id, entities: "site"};
                    Link.find(query)
                        .populate('site commodity country')
                        .deepPopulate('site.site_country.country site.site_commodity.commodity')
                        .exec(function (err, links) {
                            ++companies_counter
                            if (err) {
                                data.errorList = errors.errorFunction(err, type + ' site not found');
                                if (companies_counter == companies_len) {
                                    data.sites = _.map(_.groupBy(data.sites, function (doc) {
                                        return doc._id;
                                    }), function (grouped) {
                                        return grouped[0];
                                    });
                                    callback(null, data);
                                }
                            } else {
                                if (links.length > 0) {
                                    link_len = links.length;
                                    link_counter = 0;
                                    _.each(links, function (link) {
                                        ++link_counter;
                                        data.sites.push({
                                            _id: link.site._id,
                                            field: link.site.field,
                                            site_name: link.site.site_name,
                                            site_status: link.site.site_status,
                                            site_country: link.site.site_country,
                                            site_commodity: link.site.site_commodity
                                        });
                                        if (link_len == link_counter && companies_counter == companies_len) {
                                            data.sites = _.map(_.groupBy(data.sites, function (doc) {
                                                return doc._id;
                                            }), function (grouped) {
                                                return grouped[0];
                                            });
                                            callback(null, data);
                                        }

                                    })
                                } else {
                                    if (companies_counter == companies_len) {
                                        data.sites = _.map(_.groupBy(data.sites, function (doc) {
                                            return doc._id;
                                        }), function (grouped) {
                                            return grouped[0];
                                        });
                                        callback(null, data);
                                    }
                                }
                            }
                        });
                    }
                })
            } else{
                callback(null, data);
            }
        } else{
            callback(null, data);
        }
    }
};