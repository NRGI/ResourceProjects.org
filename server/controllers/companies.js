var Company 		= require('mongoose').model('Company'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production      = require('mongoose').model('Production'),
    async           = require('async'),
    mongoose 		= require('mongoose'),
    errors 	        = require('./errorList'),
    _               = require("underscore"),
    request         = require('request');

//Get all companies
exports.getCompanies = function(req, res) {
    var data={},
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);
    data.errorList = [];
    data.companies = [];
    data.company_count = 0;

    async.waterfall([
        companyCount,
        getCompanySet,
        getCompanyLinks,
        getTransfersCount
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Companies');
            res.send(data);
        }else{
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });

    function companyCount(callback) {
        Company.find({}).count().exec(function(err, companiesCount) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Companies');
                res.send(data);
            } else if (companiesCount == 0) {
                data.errorList.push({type: 'Companies', message: 'companies not found'})
                res.send(data);
            } else {
                data.company_count = companiesCount;
                callback(null, data);
            }
        });
    }
    function getCompanySet(data, callback) {
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
            data.companies = companies;
            if (err) {
                data.errorList = errors.errorFunction(err,'Companies');
                res.send(data);
            }
            else {
                if (companies.length>0) {
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Companies', message: 'companies not found'})
                    res.send(data);
            }
                }
        });
    }
    function getCompanyLinks(data, callback) {
        var companyId = _.pluck(data.companies, '_id');
        Link.aggregate([
            {$match: {$or: [{company: {$in: companyId}}]}},
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
                data.errorList = errors.errorFunction(err,'Company links');
                callback(null, data);
            }
            else {
                if (links.length>0) {
                    _.map(data.companies, function (company) {
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
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Company links', message: 'company links not found'})
                    callback(null, data);
                }
            }
        })
    }
    function getTransfersCount(data, callback) {
        var companyId = _.pluck(data.companies, '_id');
        Transfer.aggregate([
            {$match:{company: {$in: companyId}}},
            {$group:{
                "_id": "$company",
                "transfer_count":{$addToSet:"$_id"}
            }},
            {$project:{_id:1,transfer_count:{$size:'$transfer_count'}}}
        ]).exec(function (err, transfers) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Transfers');
                callback(null, data);
            }
            else {
                if (transfers.length>0) {
                    _.map(data.companies, function (company) {
                        var list = _.find(transfers, function (link) {
                            return link._id.toString() == company._id.toString();
                        });
                        if (list) {
                            company.transfer_count = list.transfer_count;
                        }
                        return company;
                    });
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Transfers', message: 'transfers not found'});
                    callback(null, data);
                }
            }
        })
    }
};

//Get company by id
exports.getCompanyID = function(req, res) {
    var data = {};
    var id = mongoose.Types.ObjectId(req.params.id);
    data.errorList = [];
    data.company = [];

    async.waterfall([
        getCompany
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Company '+ id);
            res.send(data);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });

    function getCompany(callback) {
        Company.aggregate([
            {$match:{_id:id}}
        ]).exec(function(err, company) {
            if (err) {
                data.errorList = errors.errorFunction(err, 'Company ' + id);
                res.send(data);
            } else {
                if (company.length > 0) {
                    data.company = company[0]
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Company', message: 'company not found'})
                    callback(null, data);
                }
            }
        });
    }
};

//Get company tables(projects, sites and fields, concessions, production stats, payments) and coordinates. Limit = 50
exports.getCompanyByID = function(req, res) {
    var data={}, transfersQuery=[];
    var id = mongoose.Types.ObjectId(req.params.id)
    data.errorList=[];
    data.company_commodity = [];
    data.projects = [];
    data.sites=[];
    data.concessions=[];
    data.proj_coordinates = [];
    data.transfers = [];
    data.production = [];

    async.waterfall([
        getCompanyLinks,
        getCompanyProjectTable,
        getCompanySiteTable,
        getCompanyConcessionTable,
        getCoordinates,
        getCompanyTransfers,
        getTransfers,
        getProduction
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Company '+ id);
            res.send(data);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });

    function getCompanyLinks(callback) {
        Link.aggregate([
            {$match:  {company:id}},
            {$lookup: {from: "companygroups", localField: "company_group",foreignField: "_id",as: "company_group"}},
            {$lookup: {from: "sites", localField: "site",foreignField: "_id",as: "site"}},
            {$lookup: {from: "projects", localField: "project",foreignField: "_id",as: "project"}},
            {$lookup: {from: "concessions",localField: "concession",foreignField: "_id",as: "concession"}},
            {$unwind: {"path": "$company_group", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project.proj_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site.site_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession.concession_commodity", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "commodities",localField: "project.proj_commodity.commodity",foreignField: "_id",as: "project.proj_commodity"}},
            {$lookup: {from: "commodities",localField: "site.site_commodity.commodity",foreignField: "_id",as: "site.site_commodity"}},
            {$lookup: {from: "commodities",localField: "concession.concession_commodity.commodity",foreignField: "_id",as: "concession.concession_commodity"}},
            {$unwind: {"path": "$project.proj_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site.site_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$concession.concession_commodity", "preserveNullAndEmptyArrays": true}},
            {$group:{
                _id: '$company',
                company_groups: {$addToSet:'$company_group'},
                proj_commodity: {$addToSet:'$project.proj_commodity'},
                site_commodity: {$addToSet:'$site.site_commodity'},
                concession_commodity: {$addToSet:'$concession.concession_commodity'}
            }},
            {$project:{
                _id:1,company_groups:1,
                company_commodity: { $setUnion: [ "$proj_commodity", "$site_commodity", "$concession_commodity" ] }
            }}
        ]).exec(function (err, links) {
            if (err) {
                data.errorList = errors.errorFunction(err, 'Company links');
                res.send(data);
            } else {
                if (links.length > 0) {
                    data.company_commodity = links[0].company_commodity
                    data.company_groups = links[0].company_groups;
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Company links', message: 'company links not found'})
                    res.send(data);
                }
            }
        });
    }
    function getCompanyProjectTable(data, callback) {
        Link.aggregate([
            {$match:  {company:id, entities: 'project'}},
            {$lookup: {from: "projects", localField: "project",foreignField: "_id",as: "project"}},
            {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project.proj_commodity", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project.proj_country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project.proj_status", "preserveNullAndEmptyArrays": true}},
            {$lookup: {from: "commodities",localField: "project.proj_commodity.commodity",foreignField: "_id",as: "project.proj_commodity"}},
            {$lookup: {from: "countries",localField: "project.proj_country.country",foreignField: "_id",as: "project.proj_country"}},
            {$unwind: {"path": "$project.proj_country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project.proj_commodity", "preserveNullAndEmptyArrays": true}},
            {$project:{
                _id:'$project.proj_id', proj_id:'$project.proj_id', proj_name:'$project.proj_name',
                proj_commodity:'$project.proj_commodity',proj_country:'$project.proj_country',proj_status:'$project.proj_status'
            }},
            {$group:{
                _id: '$_id',
                proj_id: {$first:'$proj_id'},
                proj_name: {$first:'$proj_name'},
                proj_commodity: {$addToSet:'$proj_commodity'},
                proj_country: {$addToSet:'$proj_country'},
                proj_status: {$addToSet:'$proj_status'}
            }},
            {$project:{
                _id:1, proj_site:{_id:'$proj_id'}, proj_name:1, proj_id:1, proj_commodity:1,proj_country:1,proj_status:1
            }},
            { $skip : 0},
            { $limit : 50 }
        ]).exec(function (err, links) {
            if (err) {
                data.errorList = errors.errorFunction(err, 'Company project links');
                res.send(data);
            } else {
                if (links.length > 0) {
                    data.projects =links;
                    callback(null,data);
                } else {
                    data.errorList.push({type: 'Company project links', message: 'company project links not found'})
                    callback(null, data);
                }
            }
        });
    }
    function getCompanySiteTable(data, callback) {
            Link.aggregate([
                {$match: {company:id, entities:"site"}},
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
                { $skip : 0},
                { $limit : 50 }
            ]).exec(function (err, links) {
                if (err) {
                    data.errorList = errors.errorFunction(err, 'company site links not found');
                    res.send(data);
                } else {
                    if (links.length > 0) {
                        data.sites = links
                        callback(null, data);
                    } else {
                        data.errorList.push({type: "Company", message: 'company site links not found'})
                        callback(null, data);
                    }
                }
            })
    }
    function getCompanyConcessionTable(data, callback) {
            Link.aggregate([
                {$match: {company:id, entities:"concession"}},
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
                { $skip : 0 },
                { $limit : 50 }
            ]).exec(function (err, links) {
                if (err) {
                    data.errorList = errors.errorFunction(err,'company concession links not found');
                    res.send(data);
                } else {
                    if (links.length > 0) {
                        data.concessions = links;
                        callback(null, data);
                    } else {
                        data.errorList.push({type: "Company", message: 'company concession  links not found'})
                        callback(null, data);
                    }
                }
            })
    }
    function getCoordinates(data, callback) {
        Link.aggregate([
                {$match:{company: mongoose.Types.ObjectId(req.params.id),entities:'site'}},
                {$lookup: {from: "sites",localField: "site",foreignField: "_id",as: "site"}},
                {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
                {$unwind:'$site.site_coordinates'},
                {$project:{
                    _id:'$site._id',
                    'lat':  { "$arrayElemAt": [ "$site.site_coordinates.loc", -2 ] },
                    'lng': { "$arrayElemAt": [ "$site.site_coordinates.loc", -1 ] },
                    'message': "$site.site_name",
                    'timestamp': "$site.site_coordinates.timestamp",
                    'type': {$cond: { if: { $gte: [ "$site.field", true ] }, then: 'field', else: 'site' }}
                }},
                {$group:{
                    _id:'$_id',
                    lat:{$first:'$lat'},
                    lng:{$first:'$lng'},
                    message:{$first:'$message'},
                    timestamp:{$first:'$timestamp'},
                    type:{$first:'$type'}
                }}
            ]).exec(function (err, links) {
            if (err) {
                data.errorList = errors.errorFunction(err,'company coordinates not found');
                res.send(data);
            } else if (links) {
                data.proj_coordinates = links;
                callback(null, data);
            } else {
                data.errorList.push({type: "Company", message: 'company coordinates not found'})
                callback(null, data);
            }
        });
    }
    function getCompanyTransfers(data, callback) {
        Link.aggregate([
                {$match: {company:id}},
                {
                    $group: {
                        _id: '$company',
                        project: {$addToSet: '$project'},
                        site: {$addToSet: '$site'},
                        concession: {$addToSet: '$concession'},
                        company: {$addToSet: '$company'}
                    }
                },
                {$project:{
                    _id:0,
                    transfers_query: { $setUnion: [ "$project", "$site", "$concession" , "$company" ] }
                }}
        ]).exec(function (err, links) {
            if (err) {
                data.errorList = errors.errorFunction(err, 'Company links');
                res.send(data);
            } else {
                if (links.length > 0) {
                    transfersQuery = links[0].transfers_query
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Company links', message: 'company links not found'})
                    callback(null, data);
                }
            }
        });
    }
    function getTransfers(data,callback) {
        if (transfersQuery.length > 0) {
            Transfer.aggregate([
                {$match: {company: {$in: transfersQuery}}},
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
                    data.errorList = errors.errorFunction(err, 'Transfers by Project');
                    callback(null, data);
                } else {
                    if (transfers.length > 0) {
                        data.transfers = transfers;
                        callback(null, data);
                    } else {
                        data.errorList.push({type: 'Transfers by Project', message: 'transfers by project not found'})
                        callback(null, data);
                    }
                }
            });
        } else {
            callback(null, data);

        }
    }
    function getProduction(data, callback) {
            Production.aggregate([
                {$match: {$or: [{project: {$in: transfersQuery}},
                    {site: {$in: transfersQuery}},
                    {concession: {$in: transfersQuery}}]}},
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
                    data.errorList = errors.errorFunction(err, 'Company productions');
                    res.send(data);
                } else {
                    if (production.length > 0) {
                        data.production = production;
                        callback(null, data);
                    } else {
                        data.errorList.push({type: 'Company productions', message: 'company productions not found'})
                        callback(null, data);
                    }
                }
            })
    }
}
