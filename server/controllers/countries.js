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
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

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
            err = new Error('Error: '+ err);;
            res.send({reason: err.toString()});
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
                return res.send({reason: err.toString()});
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
                    return res.send({reason: err.toString()});
                } else if (!countries) {
                    return res.send({reason: 'not found'});
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
                errorList = errorFunction(err,'Projects');
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
                errorList = errorFunction(err,'Sites');
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
                errorList = errorFunction(err,'Concessions');
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
                errorList = errorFunction(err,'Concessions');
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
                errorList = errorFunction(err,'Concessions');
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
    function errorFunction(err,type){
        err = new Error('Error: '+err);
        errorList.push({type:type, message:err.toString()})
        return errorList;
    }
};

//exports.getCountryByID = function(req, res) {
//
//    async.waterfall([
//        getCountry
//    ], function (err, result) {
//        if (err) {
//            res.send(err);
//        } else {
//            if (req.query && req.query.callback) {
//                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
//            } else {
//                return res.send(result);
//            }
//        }
//    });
//
//    function getCountry(callback) {
//        Country.aggregate([
//            {$match:{iso2:req.params.id}},
//            {$lookup: {from: "commodities",localField: "country_commodity.commodity",foreignField: "_id",as: "country_commodity"}}
//        ]).exec(function(err, country) {
//            if(country.length>0) {
//                callback(null, country[0]);
//            } else {
//                callback(err);
//            }
//        });
//    }
//};

exports.getCountryByID = function(req, res) {
    var errorList=[];
    var country_id;
    async.waterfall([
        getCountry,
        getProjects,
        getSites,
        getConcessions
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
    function getCountry(callback) {
        Country.aggregate([
            {$match:{iso2:req.params.id}},
            {$lookup: {from: "commodities",localField: "country_commodity.commodity",foreignField: "_id",as: "country_commodity"}}
        ]).exec(function(err, country) {
            console.log(country)
            if(country.length>0) {
                country_id = mongoose.Types.ObjectId(country[0]._id);
                callback(null, country[0]);
            } else {
                callback(err);
            }
        });
    }
    function getProjects(country, callback) {
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
                errorList = errorFunction(err,'Project commodities');
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
                errorList = errorFunction(err,'Site commodities');
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
                errorList = errorFunction(err,'Site commodities');
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
    function errorFunction(err,type){
        err = new Error('Error: '+err);
        errorList.push({type:type, message:err.toString()})
        return errorList;
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