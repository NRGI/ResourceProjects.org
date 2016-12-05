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
    var site_len, site_counter, errorList=[],
        limit = Number(req.params.limit),
        field = {field: Boolean(req.params.field)},
        skip = Number(req.params.skip);

    async.waterfall([
        siteCount,
        getSiteSet,
        getSiteLinks,
        getTransfersCount,
        getProductionCount
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

    function siteCount(callback) {
        Site.find(field).count().exec(function(err, sitesCount) {
            if (err) {
                err = new Error('Error: '+ err);
                return res.send({reason: err.toString()});
            } else if (sitesCount == 0) {
                return res.send({reason: 'not found'});
            } else {
                callback(null, sitesCount);
            }
        });
    }

    function getSiteSet(sitesCount, callback) {
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
                    errorList = errors.errorFunction(err,'Sites');
                    callback(null, sitesCount, sites,errorList);
                }
                else {
                    if (sites.length>0) {
                        callback(null, sitesCount, sites, errorList);
                    } else {
                        errorList.push({type: 'Sites', message: 'sites not found'})
                        return res.send({reason: 'sites not found'});
                    }
                }
            });
    }
    function getSiteLinks(sitesCount, sites,errorList, callback) {
        var sitesId = _.pluck(sites, '_id');
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
                errorList = errors.errorFunction(err, 'Site links');
                callback(null, sitesCount, sites, errorList);
            }
            else {
                if (links.length > 0) {
                    _.map(sites, function (site) {
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
                    callback(null, sitesCount, sites, errorList);
                } else {
                    errorList.push({type: 'Site links', message: 'site links not found'})
                    callback(null, sitesCount, sites, errorList);
                }
            }
        })
    }
    function getTransfersCount(sitesCount, sites,errorList, callback) {
        site_len = sites.length;
        site_counter = 0;
        _.each(sites, function(site) {
            Transfer.find({$or: [
                    {project:{$in: site.project_id}},
                    {site:{$in: site.project_id}}]})
                .count()
                .exec(function (err, transfer_count) {
                    ++site_counter;
                    site.transfer_count = transfer_count;
                    if (site_counter === site_len) {
                        callback(null, sitesCount, sites,errorList);
                    }
                });

        });
    }
    function getProductionCount(sitesCount, sites,errorList, callback) {
        site_len = sites.length;
        site_counter = 0;

        _.each(sites, function(site) {
            Production.find({$or: [
                    {project:{$in: site.project_id}},
                    {site:{$in: site.project_id}}]})
                .count()
                .exec(function (err, production_count) {
                    ++site_counter;
                    site.production_count = production_count;
                    if (site_counter === site_len) {
                        callback(null, {data: sites, count: sitesCount, errorList:errorList});
                    }
                });

        });
    }
};

//Get site by ID
exports.getSiteByID = function(req, res) {

    async.waterfall([
        getSite,
        getSiteLinks,
        getProjectLinks
    ], function (err, result) {
        if (err) {
            res.send({data:[],count:0,error:err});
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
	function getSite(callback) {
        Site.findOne({_id:mongoose.Types.ObjectId(req.params.id)})
            .populate('site_country.country', '_id iso2 name')
            .populate('site_commodity.commodity', ' _id commodity_name commodity_id commodity_type')
            .populate('site_aliases', '_id alias')
            .lean()
            .exec(function(err, site) {
                if(site) {
                    callback(null, site);
                } else {
                    callback(null, site);
                }
            });
    }
    function getSiteLinks(site, callback) {
        if(site) {
            site.concessions = [];
            site.contracts = [];
            site.sites = [];
            site.projects = [];
            site.proj_coordinates = [];
            site.coordinates = [];
            site.source_type = {p: false, c: false};
            if (site.field && site.site_coordinates && site.site_coordinates.length > 0) {
                site.site_coordinates.forEach(function (loc) {
                    if (loc && loc.loc) {
                        site.coordinates.push({
                            'lat': loc.loc[0],
                            'lng': loc.loc[1],
                            'message': site.site_name,
                            'timestamp': loc.timestamp,
                            'type': 'field',
                            'id': site._id
                        });
                    }
                });
            } else if (!site.field && site.site_coordinates && site.site_coordinates.length > 0) {
                site.site_coordinates.forEach(function (loc) {
                    if (loc && loc.loc) {
                        site.coordinates.push({
                            'lat': loc.loc[0],
                            'lng': loc.loc[1],
                            'message': site.site_name,
                            'timestamp': loc.timestamp,
                            'type': 'site',
                            'id': site._id
                        });
                    }
                });
            }
            var commodity = site.site_commodity;
            site.site_commodity = [];
            if (commodity && commodity.length > 0) {
                if (_.where(commodity, {_id: _.last(commodity).commodity._id}).length < 1) {
                    site.site_commodity.push({
                        _id: _.last(commodity).commodity._id,
                        commodity_name: _.last(commodity).commodity.commodity_name,
                        commodity_type: _.last(commodity).commodity.commodity_type,
                        commodity_id: _.last(commodity).commodity.commodity_id
                    });
                }
            }
            Link.find({site: site._id})
                .populate('company contract concession site project company_group')
                .deepPopulate('project.proj_country.country project.proj_commodity.commodity site.site_commodity.commodity site.site_country.country concession.concession_country.country concession.concession_commodity.commodity source.source_type_id')
                .exec(function (err, links) {
                    if (links.length > 0) {
                        link_len = links.length;
                        link_counter = 0;
                        links.forEach(function (link) {
                            ++link_counter;
                            var entity = _.without(link.entities, 'site')[0];
                            if (!site.source_type.p || !site.source_type.c) {
                                if (link.source != null) {
                                    if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                        site.source_type.c = true;
                                    } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                        site.source_type.c = true;
                                    } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                        site.source_type.p = true;
                                    }
                                }
                            }
                            switch (entity) {
                                case 'project':
                                    site.projects.push({
                                        _id: link.project._id,
                                        proj_id: link.project.proj_id,
                                        proj_name: link.project.proj_name
                                    });
                                    if (link.project.proj_commodity.length > 0) {
                                        if (_.where(site.site_commodity, {_id: _.last(link.project.proj_commodity).commodity._id}).length < 1) {
                                            site.site_commodity.push({
                                                _id: _.last(link.project.proj_commodity).commodity._id,
                                                commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                                commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                                commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                            });
                                        }
                                    }
                                    break;
                                case 'site':
                                    site.sites.push({
                                        _id: link.site._id,
                                        field: link.site.field,
                                        site_name: link.site.site_name
                                    });
                                    if (link.site.field && link.site.site_coordinates.length > 0) {
                                        link.site.site_coordinates.forEach(function (loc) {
                                            if (loc && loc.loc) {
                                                site.proj_coordinates.fields.push({
                                                    'lat': loc.loc[0],
                                                    'lng': loc.loc[1],
                                                    'message': link.site.site_name,
                                                    'timestamp': loc.timestamp,
                                                    'type': 'field',
                                                    'id': link.site._id
                                                });
                                            }
                                        });
                                    } else if (!link.site.field && link.site.site_coordinates.length > 0) {
                                        link.site.site_coordinates.forEach(function (loc) {
                                            if (loc && loc.loc) {
                                                site.proj_coordinates.sites.push({
                                                    'lat': loc.loc[0],
                                                    'lng': loc.loc[1],
                                                    'message': link.site.site_name,
                                                    'timestamp': loc.timestamp,
                                                    'type': 'site',
                                                    'id': link.site._id
                                                });
                                            }
                                        });
                                    }
                                    if (link.site.site_commodity.length > 0) {
                                        if (_.where(site.site_commodity, {_id: _.last(link.site.site_commodity).commodity._id}).length < 1) {
                                            site.site_commodity.push({
                                                _id: _.last(link.site.site_commodity).commodity._id,
                                                commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                                commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                                commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                            });
                                        }
                                    }
                                    break;
                                case 'concession':
                                    site.concessions.push({
                                        _id: link.concession._id,
                                        concession_name: link.concession.concession_name
                                    });
                                    if (link.concession.concession_commodity.length > 0) {
                                        if (_.where(site.site_commodity, {_id: _.last(link.concession.concession_commodity).commodity._id}).length < 1) {
                                            site.site_commodity.push({
                                                _id: _.last(link.concession.concession_commodity).commodity._id,
                                                commodity_name: _.last(link.concession.concession_commodity).commodity.commodity_name,
                                                commodity_type: _.last(link.concession.concession_commodity).commodity.commodity_type,
                                                commodity_id: _.last(link.concession.concession_commodity).commodity.commodity_id
                                            });
                                        }
                                    }
                                    break;
                                case 'contract':
                                    site.contracts.push(link.contract);
                                    break;
                                default:
                                    console.log('switch (entity) error');
                            }
                            if (link_counter == link_len) {
                                callback(null, site);
                            }
                        });
                    } else {
                        callback(null, site);
                    }
                });
        } else {
            callback(null, site);
        }
    }
    function getProjectLinks(site, callback) {
        if (site) {
            proj_len = site.projects.length;
            proj_counter = 0;
            if (proj_len > 0) {
                site.projects.forEach(function (project) {
                    Link.find({project: project._id})
                        .populate('company contract concession site project')
                        .deepPopulate('company_group source.source_type_id site.site_commodity.commodity site.site_country.country')
                        .exec(function (err, links) {
                            ++proj_counter;
                            link_len = links.length;
                            link_counter = 0;
                            if (link_len > 0) {
                                links.forEach(function (link) {
                                    ++link_counter;
                                    var entity = _.without(link.entities, 'project')[0];
                                    if (!site.source_type.p || !site.source_type.c) {
                                        if (link.source != null) {
                                            if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                                site.source_type.c = true;
                                            } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                                site.source_type.c = true;
                                            } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                                site.source_type.p = true;
                                            }
                                        }
                                    }
                                    switch (entity) {
                                        case 'site':
                                            if (link.site.site_commodity.length > 0) {
                                                if (_.where(site.site_commodity, {_id: _.last(link.site.site_commodity).commodity._id}).length < 1) {
                                                    site.site_commodity.push({
                                                        _id: _.last(link.site.site_commodity).commodity._id,
                                                        commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                                        commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                                        commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                                    });
                                                }
                                            }
                                            break;
                                        case 'project':
                                            if (link.project.proj_commodity.length > 0) {
                                                if (_.where(site.site_commodity, {_id: _.last(link.project.proj_commodity).commodity._id}).length < 1) {
                                                    site.site_commodity.push({
                                                        _id: _.last(link.project.proj_commodity).commodity._id,
                                                        commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                                        commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                                        commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                                    });
                                                }
                                            }
                                            break;
                                        case 'concession':
                                            site.concessions.push({
                                                _id: link.concession._id,
                                                concession_name: link.concession.concession_name
                                            });
                                            break;
                                        case 'contract':
                                            site.contracts.push(link.contract);
                                            break;
                                        default:
                                            console.log('switch (entity) error');
                                    }
                                    if (proj_counter == proj_len && link_counter == link_len) {
                                        callback(null, site);
                                    }
                                });
                            } else {
                                if (proj_counter == proj_len && link_counter == link_len) {
                                    callback(null, site);
                                }
                            }
                        });
                });
            } else {
                callback(null, site);
            }

        } else {
            callback(null, {error:'Error'});
        }
    }
};

exports.getSitesMap = function(req, res) {
    var site_len, site_counter,site_type;
    var field = req.params.field;
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
        Site.find({field:field})
            .lean()
            .exec(function(err, sites) {
                site_len = sites.length;
                site_counter = 0;
                var data = [];
                if(sites) {
                    sites.forEach(function (site) {
                        ++site_counter;
                        if(site.site_coordinates && site.site_coordinates.length>0) {
                            site.site_coordinates.forEach(function (loc) {
                                if (field == true) {
                                    site_type = 'field';
                                } else {
                                    site_type = 'site';
                                }
                                if (loc && loc.loc) {
                                    data.push({
                                        'lat': loc.loc[0],
                                        'lng': loc.loc[1],
                                        'message': site.site_name,
                                        'timestamp': loc.timestamp,
                                        'type': site_type,
                                        'id': site._id
                                    })
                                }
                            })
                        }
                    });
                    if(site_counter == site_len) {
                        res.send({data:data});}
                } else {
                    callback(err);
                }
            });
    }
};
