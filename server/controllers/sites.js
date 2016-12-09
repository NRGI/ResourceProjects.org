var Site 		    = require('mongoose').model('Site'),
    Country 		= require('mongoose').model('Country'),
    Source	 		= require('mongoose').model('Source'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    async           = require('async'),
    mongoose 		= require('mongoose'),
    _               = require("underscore"),
    request         = require('request'),
    errors 	        = require('./errorList');

//Get all sites
exports.getSites = function(req, res) {
    var siteLen, siteCounter, siteData ={},
        limit = Number(req.params.limit),
        field = {field: JSON.parse(req.params.field)},
        skip = Number(req.params.skip);

    async.waterfall([
        siteCount,
        getSiteSet,
        getSiteLinks,
        getTransfersCount,
        getProductionCount
    ], function (err, result) {
        if (err) {
            err = new Error('Error: '+ err);
            return res.send({data: [], count: 0, errorList: err.toString()});
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });

    function siteCount(callback) {
        Site.find(field).count().exec(function(err, sitesCount) {
            if (err) {
                err = new Error('Error: '+ err);
                return res.send({data: [], count: 0, errorList: err.toString()});
            } else if (sitesCount == 0) {
                return res.send({data: [], count: 0, errorList: 'not found'});
            } else {
                callback(null, sitesCount);
            }
        });
    }

    function getSiteSet(sitesCount, callback) {
        siteData.errorList = [];
        siteData.count = sitesCount;
        siteData.data = [];

        Site.aggregate([
            {$sort: {site_name: -1}},
            {$match: field},
            {$unwind: {"path": "$site_country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site_commodity", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "countries",localField: "site_country.country",foreignField: "_id",as: "site_country"}},
            {$lookup: {from: "commodities",localField: "site_commodity.commodity",foreignField: "_id",as: "site_commodity"}},
            {$unwind: {"path": "$site_country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site_commodity", "preserveNullAndEmptyArrays": true}},
            {$project: {_id:1,site_name:1,site_country:{_id:'$site_country._id', iso2:'$site_country.iso2',
                name:'$site_country.name'},
                site_commodity:{_id:'$site_commodity._id', commodity_type:'$site_commodity.commodity_type',
                    commodity_id:'$site_commodity.commodity_id', commodity_name:'$site_commodity.commodity_name'},
                site_status:'$site_status',field:1
            }
            },
            {$group:{
                _id:'$_id',
                field:{$first:'$field'},
                site_name:{$first:'$site_name'},
                site_status:{$first:'$site_status'},
                site_country:{$addToSet:'$site_country'},
                site_commodity:{$addToSet:'$site_commodity'}
            }},
            {$project:{_id:1, field:1, site_name:1,site_status:1,site_country:1,site_commodity:1,
                project_count:{$literal:0}, concession_count:{$literal:0}, company_count:{$literal:0}, transfer_count:{$literal:0}, production_count:{$literal:0}
            }},
            {$skip: skip},
            {$limit: limit}
        ]).exec(function(err, sites) {
                if (err) {
                    siteData.errorList = errors.errorFunction(err,'Sites');
                    return res.send(siteData);
                }
                else {
                    if (sites.length>0) {
                        siteData.data = sites;
                        callback(null,  siteData);
                    } else {
                        siteData.errorList.push({type: 'Sites', message: 'sites not found'})
                        return res.send({data: [], count: siteData.count, error: 'sites not found'})
                    }
                }
            })
    }
    function getSiteLinks(siteData, callback) {
        var sitesId = _.pluck(siteData.data, '_id');
        Link.aggregate([
            {$match: {$or: [{site: {$in: sitesId}}]}},
            {$lookup: {from: "projects",localField: "project",foreignField: "_id",as: "project"}},
            {$lookup: {from: "concessions",localField: "concession",foreignField: "_id",as: "concession"}},
            {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
            {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project.proj_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession.concession_commodity", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "commodities",localField: "project.proj_commodity.commodity",foreignField: "_id",as: "proj_commodity"}},
            {$lookup: {from: "commodities",localField: "concession.concession_commodity.commodity",foreignField: "_id",as: "concession_commodity"}},
            {$unwind: {"path": "$proj_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession_commodity", "preserveNullAndEmptyArrays": true}},
            {$project:{_id:'$site',
                site:{_id:'$site'},
                commodity:{$cond: { if:  {$not: "$proj_commodity" },
                    then: {$cond: { if:  {$not: "$concession_commodity" },then:[] , else:{__id:"$concession_commodity._id",commodity_type:"$concession_commodity.commodity_type",
                        commodity_id:'$concession_commodity.commodity_id', commodity_name:'$concession_commodity.commodity_name'}
                    }} ,
                    else:  {_id:"$proj_commodity._id",commodity_type:"$proj_commodity.commodity_type",
                        commodity_id:'$proj_commodity.commodity_id', commodity_name:'$proj_commodity.commodity_name'}}},
                project:1,company:1, concession:1
            }
            },
            {$project:{_id:1,site:1,commodity:1,project:1,company:1, concession:1,
                project_id: { $concatArrays: [ ["$site"], ["$project"] ] }
            }
            },
            {$unwind: {"path": "$project_id", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$commodity", "preserveNullAndEmptyArrays": true}},
            {$group:{
                _id:'$_id',
                commodity:{$addToSet:'$commodity'},
                project:{$addToSet:'$project'},
                company:{$addToSet:'$company'},
                concession:{$addToSet:'$concession'},
                project_id:{$addToSet:'$project_id._id'}
            }},
            {$project:{
                _id:1,project_count:{$size:'$project'},project_id:1,
                concession_count:{$size:'$concession'},
                company_count:{$size:'$company'},commodity:1
            }}
        ]).exec(function (err, links) {
            if (err) {
                siteData.errorList = errors.errorFunction(err, 'Site links');
                return res.send(siteData);
            } else {
                if (links.length > 0) {
                    _.map(siteData.data, function (site) {
                        var list = _.find(links, function (link) {
                            return link._id.toString() == site._id.toString();
                        });
                        if (list) {
                            site.site_commodity.push(list.commodity[0]);
                            site.project_id = list.project_id;
                            site.project_count = list.project_count;
                            site.concession_count = list.concession_count;
                            site.company_count = list.company_count;
                        }
                        return site;
                    });
                    callback(null, siteData);
                } else {
                    siteData.errorList.push({type: 'Site links', message: 'site links not found'})
                    callback(null, siteData);
                }
            }
        })
    }
    function getTransfersCount(siteData, callback) {
        siteLen = siteData.data.length;
        siteCounter = 0;
        _.each(siteData.data, function(site) {
            if(site.project_id) {
                Transfer.find({
                    $or: [
                        {project: {$in: site.project_id}},
                        {site: {$in: site.project_id}}]
                })
                    .count()
                    .exec(function (err, transfer_count) {
                        if (err) {
                            siteData.errorList = errors.errorFunction(err,'Site transfers');
                            return res.send(siteData);
                        }
                        else {
                            ++siteCounter;
                            if (transfer_count) {
                                site.transfer_count = transfer_count;
                            }
                            if (siteCounter === siteLen) {
                                callback(null, siteData);
                            }
                        }
                    });
            }else{
                ++siteCounter;
                if (siteCounter === siteLen) {
                    callback(null, siteData);
                }
            }

        });
    }
    function getProductionCount(siteData, callback) {
        siteLen = siteData.data.length;
        siteCounter = 0;
        _.each(siteData.data, function(site) {
            if(site.project_id){
            Production.find({$or: [
                    {project:{$in: site.project_id}},
                    {site:{$in: site.project_id}}]})
                .count()
                .exec(function (err, production_count) {
                    if (err) {
                        siteData.errorList = errors.errorFunction(err,'Site production');
                        return res.send(siteData);
                    }
                    else {
                            ++siteCounter;
                        if (production_count) {
                            site.production_count = production_count;
                        }
                        if (siteCounter === siteLen) {
                            callback(null, siteData);
                        }
                    }
                });
            }else{
                ++siteCounter;
                if (siteCounter === siteLen) {
                    callback(null, siteData);
                }
            }
        });
    }
};

//Get site by ID
exports.getSiteByID = function(req, res) {

    var projectId =[], errorList = [];

    async.waterfall([
        getSite,
        getSiteLinks,
        getProjectLinks
    ], function (err, result) {
        if (err) {
            res.send({data:[], error:err});
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
	function getSite(callback) {
        Site.aggregate([
            {$match:{_id:mongoose.Types.ObjectId(req.params.id)}},
            {$unwind: {"path": "$site_coordinates", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site_country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site_commodity", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "countries",localField: "site_country.country",foreignField: "_id",as: "site_country"}},
            {$lookup: {from: "commodities",localField: "site_commodity.commodity",foreignField: "_id",as: "site_commodity"}},
            {$unwind: {"path": "$site_country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site_status", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site_commodity", "preserveNullAndEmptyArrays": true}},
            {$group: {
                _id: '$_id',
                field: {$first: '$field'},
                site_established_source: {$first: '$site_established_source'},
                site_name: {$first: '$site_name'},
                site_company_share: {$first: '$site_company_share'},
                site_status: {$first: '$site_status'},
                site_coordinates: {$first: '$site_coordinates'},
                site_country: {$addToSet: '$site_country'},
                site_commodity: {$addToSet: '$site_commodity'}
            }},
            {
                $project: {
                    _id: 1, site_name: 1, site_country: 1, site_commodity: 1,
                    site_status: 1, field: 1, site_established_source: 1, site_company_share: 1,
                    site_coordinates: {
                        $cond: {
                            if: {$not: "$site_coordinates"},
                            then: [],
                            else: {
                                _id: '$_id',
                                'lat': {"$arrayElemAt": ["$site_coordinates.loc", -2]},
                                'lng': {"$arrayElemAt": ["$site_coordinates.loc", -1]},
                                'message': "$site_name",
                                'timestamp': "$site_coordinates.timestamp",
                                'type': {$cond: {if: {$gte: ["$field", true]}, then: 'field', else: 'site'}}

                            }
                        }
                    }
                }
            }
        ]).exec(function(err, site) {
            if (err) {
                errorList = errors.errorFunction(err,'Site');
                return res.send({data:[], error:errorList});
            }else {
                if (site.length > 0) {
                    callback(null, site[0],errorList);
                } else {
                    errorList.push({type: 'Site', message: 'Site not found'})
                    return res.send({data:[], error:errorList});
                }
            }
        });
    }

    function getSiteLinks(site, errorList, callback) {
        site.concessions = [];
        site.contracts = [];
        site.projects = [];
        site.site_commodity = [];
        Link.aggregate([
            {$match: {site: mongoose.Types.ObjectId(req.params.id)}},
            {$lookup: {from: "companies", localField: "company", foreignField: "_id", as: "company"}},
            {$lookup: {from: "contracts", localField: "contract", foreignField: "_id", as: "contract"}},
            {$lookup: {from: "concessions", localField: "concession", foreignField: "_id", as: "concession"}},
            {$lookup: {from: "sites", localField: "site", foreignField: "_id", as: "site"}},
            {$lookup: {from: "projects", localField: "project", foreignField: "_id", as: "project"}},
            {$lookup: {from: "companygroups", localField: "company_group", foreignField: "_id", as: "company_group"}},
            {$unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$contract", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$company_group", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession.concession_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site.site_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project.proj_commodity", "preserveNullAndEmptyArrays": true}},
            {
                $lookup: {
                    from: "commodities",
                    localField: "concession.concession_commodity.commodity",
                    foreignField: "_id",
                    as: "concession_commodity"
                }
            },
            {
                $lookup: {
                    from: "commodities",
                    localField: "site.site_commodity.commodity",
                    foreignField: "_id",
                    as: "site_commodity"
                }
            },
            {
                $lookup: {
                    from: "commodities",
                    localField: "project.proj_commodity.commodity",
                    foreignField: "_id",
                    as: "proj_commodity"
                }
            },
            {
                $project: {
                    commodity: {$setUnion: ["$concession_commodity", "$site_commodity", "$proj_commodity"]},
                    project: 1,
                    site: 1,
                    concession: 1,
                    contract: 1
                }
            },
            {$unwind: {"path": "$commodity", "preserveNullAndEmptyArrays": true}},
            {
                $group: {
                    _id: '$site._id',
                    commodity: {$addToSet: '$commodity'},
                    concession: {$addToSet: '$concession'},
                    contract: {$addToSet: '$contract'},
                    projects: {$addToSet: '$project'},
                    project_id: {$addToSet: '$project._id'}
                }
            }
        ]).exec(function (err, links) {
            if (err) {
                errorList = errors.errorFunction(err, 'Site links');
                return res.send({data: site, error: errorList});
            } else {
                if (links.length > 0) {
                    site.concessions = links[0].concession;
                    site.contracts = links[0].contract;
                    site.projects = links[0].projects;
                    projectId = links[0].project_id;
                    site.site_commodity = links[0].commodity;
                    callback(null, site, errorList);
                } else {
                    errorList.push({type: 'Site links', message: 'site links not found'})
                    return res.send({data: site, error: errorList});
                }
            }
        });
    }
    function getProjectLinks(site, errorList, callback) {
        Link.aggregate([
            {$match: {$or: [{project: {$in: projectId}}]}},
            {$lookup: {from: "companies", localField: "company", foreignField: "_id", as: "company"}},
            {$lookup: {from: "contracts", localField: "contract", foreignField: "_id", as: "contract"}},
            {$lookup: {from: "concessions", localField: "concession", foreignField: "_id", as: "concession"}},
            {$lookup: {from: "sites", localField: "site", foreignField: "_id", as: "site"}},
            {$lookup: {from: "projects", localField: "project", foreignField: "_id", as: "project"}},
            {$lookup: {from: "companygroups", localField: "company_group", foreignField: "_id", as: "company_group"}},
            {$unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$contract", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$company_group", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession.concession_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site.site_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project.proj_commodity", "preserveNullAndEmptyArrays": true}},
            {
                $lookup: {
                    from: "commodities",
                    localField: "concession.concession_commodity.commodity",
                    foreignField: "_id",
                    as: "concession_commodity"
                }
            },
            {
                $lookup: {
                    from: "commodities",
                    localField: "site.site_commodity.commodity",
                    foreignField: "_id",
                    as: "site_commodity"
                }
            },
            {
                $lookup: {
                    from: "commodities",
                    localField: "project.proj_commodity.commodity",
                    foreignField: "_id",
                    as: "proj_commodity"
                }
            },
            {
                $project: {
                    commodity: {$setUnion: ["$concession_commodity", "$site_commodity", "$proj_commodity"]},
                    project: 1,
                    site: 1,
                    concession: 1,
                    contract: 1
                }
            },
            {$unwind: {"path": "$commodity", "preserveNullAndEmptyArrays": true}},
            {
                $group: {
                    _id: null,
                    commodity: {$addToSet: '$commodity'},
                    contract: {$addToSet: '$contract'},
                    concession: {$addToSet: '$concession'},
                    project: {$addToSet: '$project'}
                }
            }
        ]).exec(function (err, links) {
            if (err) {
                errorList = errors.errorFunction(err, 'Site links');
                return res.send({data: site, error: errorList});
            } else {
                if (links.length > 0) {
                    site.concessions = _.union(site.concessions, links[0].concession);
                    site.contracts = _.union(site.contracts, links[0].contract);
                    site.projects = _.union(site.projects, links[0].projects);
                    site.site_commodity = _.union(site.site_commodity, links[0].commodity);
                    callback(null, {data: site,error: errorList});
                } else {
                    errorList.push({type: 'Site links', message: 'site links not found'})
                    return res.send({data: site, error: errorList});
                }
            }
        });
    }
};

//Get site tables
exports.getSiteData = function(req, res) {

    var companiesId = [], companies={},  queryId=[];
    var id = mongoose.Types.ObjectId(req.params.id);

    async.waterfall([
        getCompany,
        getCompanyGroup,
        getLinks,
        getTransfers,
        getProductions
    ], function (err, result) {
        if (err) {
            res.send({data: [], error: err});
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function getCompany(callback) {
        companies.companies = [];
        companies.transfers = [];
        companies.production = [];
        companies.errorList = [];
        Link.aggregate([
            {$match: {site: id, entities: "company"}},
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
            {$skip: 0},
            {$limit: 50}
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
    }

    function getCompanyGroup(companies, callback) {
        companiesId = _.pluck(companies.companies, '_id');
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
                companies.errorList = errors.errorFunction(err,'Company of incorporation links');
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
                    companies.errorList.push({type: 'Company of incorporation links', message: 'company of incorporation links not found'})
                    callback(null, companies);
                }
            }
        });
    }
    function getLinks(companies, callback) {
        Link.aggregate([
            {$match: {site:id}},
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
                queryId: { $setUnion: [ "$project", "$site", "$concession" , "$company" ] }
            }}
        ]).exec(function (err, links) {
            if (err) {
                companies.errorList = errors.errorFunction(err, 'Site links');
                return res.send(companies);
            } else {
                if (links.length > 0) {
                    queryId = links[0].queryId
                    console.log(queryId)
                    console.log(links[0].queryId)
                    callback(null, companies);
                } else {
                    companies.errorList.push({type: 'Site links', message: 'site links not found'})
                    callback(null, companies);
                }
            }
        });
    }
    function getTransfers(companies, callback) {
        if (queryId && queryId.length > 0) {
            Transfer.aggregate([
                {$match: {$or: [{project: {$in: queryId}}, {site: {$in: queryId}}]}},
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
                        transfer_level: 1, transfer_type: 1, transfer_unit: 1, transfer_value: 1
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        transfer_year: {$first: '$transfer_year'},
                        transfer_type: {$first: '$transfer_type'},
                        transfer_unit: {$first: '$transfer_unit'},
                        transfer_value: {$first: '$transfer_value'},
                        country: {$first: '$country'},
                        company: {$first: '$company'},
                        proj_site: {$first: '$proj_site'}
                    }
                },
                {$skip: 0},
                {$limit: 50}
            ]).exec(function (err, transfers) {
                if (err) {
                    companies.errorList = errors.errorFunction(err, 'Transfers');
                    callback(null, companies);
                } else {
                    if (transfers.length > 0) {
                        companies.transfers = transfers;
                        callback(null, companies);
                    } else {
                        companies.errorList.push({type: 'Transfers', message: 'transfers not found'})
                        callback(null, companies);
                    }
                }
            });
        } else{
            return res.send(companies);
        }
    }
    function getProductions(companies, callback) {
        if (queryId.length > 0) {
            Production.aggregate([
                {$match: {$or: [{project: {$in: queryId}}, {site: {$in: queryId}}]}},
                {$lookup: {from: "projects", localField: "project", foreignField: "_id", as: "project"}},
                {$lookup: {from: "commodities", localField: "production_commodity", foreignField: "_id", as: "production_commodity"}},
                {$lookup: {from: "sites", localField: "site", foreignField: "_id", as: "site"}},
                {$unwind: {"path": "$production_commodity", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
                {       $project: {
                    _id: 1,
                    production_commodity: {_id: "$production_commodity._id", commodity_name: "$production_commodity.commodity_name",
                        commodity_id: "$production_commodity.commodity_id"},
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
                    production_year: 1, production_volume: 1, production_unit: 1, production_price: 1,
                    production_price_unit: 1, production_level: 1
                }
                },
                {
                    $group: {
                        _id: '$_id',
                        production_year: {$first: '$production_year'},
                        production_volume: {$first: '$production_volume'},
                        production_unit: {$first: '$production_unit'},
                        production_price: {$first: '$production_price'},
                        production_price_unit: {$first: '$production_price_unit'},
                        production_level: {$first: '$production_level'},
                        country: {$first: '$country'},
                        production_commodity: {$first: '$production_commodity'},
                        proj_site: {$first: '$proj_site'}
                    }
                },
                {$skip: 0},
                {$limit: 50}
            ]).exec(function (err, production) {
                if (err) {
                    companies.errorList = errors.errorFunction(err, 'Productions');
                    callback(null, companies);
                } else {
                    if (production.length > 0) {
                        companies.production = production;
                        callback(null, companies);
                    } else {
                        companies.errorList.push({type: 'Productions', message: 'productions not found'})
                        callback(null, companies);
                    }
                }
            })
        } else{
            return res.send(companies);
        }
    }
};

// Get Sites coordinates
exports.getSitesMap = function(req, res) {
    var sitesCoordinate = {};
    var field = {field: JSON.parse(req.params.field)};
    async.waterfall([
        getSite
    ], function (err, result) {
        if (err) {
            res.send({data:[],error:err});
        } else{
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });

    function getSite(callback) {
        sitesCoordinate.errorList = [];
        sitesCoordinate.data = [];
        Site.aggregate([
            {$match: field},
            {$unwind: "$site_coordinates"},
            {$project: {
                site_coordinates: {
                    $cond: {
                        if: {$not: "$site_coordinates"},
                        then: [],
                        else: {
                            _id: '$_id',
                            'lat': {"$arrayElemAt": ["$site_coordinates.loc", -2]},
                            'lng': {"$arrayElemAt": ["$site_coordinates.loc", -1]},
                            'message': "$site_name",
                            'timestamp': "$site_coordinates.timestamp",
                            'type': {$cond: {if: {$gte: ["$field", true]}, then: 'field', else: 'site'}}

                        }
                    }
                }
            }},
            {$group: {
                _id:null,
                site_coordinates:{$addToSet:'$site_coordinates'}
            }},
            {$project:{
                _id:0, site_coordinates:1
            }}
        ]).exec(function(err, site) {
            if (err) {
                sitesCoordinate.errorList = errors.errorFunction(err,'Sites coordinates');
                return res.send(sitesCoordinate);
            }else {
                if (site.length > 0) {
                    console.log(site[0].site_coordinates)
                    console.log(site)
                    sitesCoordinate.data = site[0].site_coordinates;
                    callback(null, sitesCoordinate);
                } else {
                    sitesCoordinate.errorList.push({type: 'Sites coordinates', message: 'coordinates not found'})
                    return res.send(sitesCoordinate);
                }
            }
        });
    }
};
