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
    async           = require('async'),
    mongoose 		= require('mongoose'),
    _               = require("underscore"),
    errors 		    = require('./errorList'),
    request         = require('request');

//Get map
exports.getCoordinateCountryByID = function(req, res) {

    var countryId = mongoose.Types.ObjectId(req.params.id);
    var country={};
    var type = req.params.type;

    async.waterfall([
        getSites,
        getCompanyLinks,
        getCompanyGroupLinks
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

    //Get site coordinates
    function getSites(callback) {
        country.proj_coordinates = [];
        if (type == 'country') {
            Site.aggregate([
                {$unwind: '$site_country'},
                {$match:{'site_country.country':countryId,"site_coordinates":{ $exists: true,$nin: [ null ]}}},
                {$unwind:'$site_coordinates'},
                {$project:{
                    'lat':  { "$arrayElemAt": [ "$site_coordinates.loc", -2 ] },
                    'lng': { "$arrayElemAt": [ "$site_coordinates.loc", -1 ] },
                    'message': "$site_name",
                    'timestamp': "$site_coordinates.timestamp",
                    'type': {$cond: { if: { $gte: [ "$field", true ] }, then: 'field', else: 'site' }}
                }}
            ]).exec(function (err, sites) {
                if (err) {
                    err = new Error('Error: '+ err);
                    return res.send({reason: err.toString()});
                } else if (sites) {
                    country.proj_coordinates = sites;
                    callback(null, country);
                } else {
                    return res.send({reason: 'not found'});
                }
            });
        }else {
            callback(null, country);
        }
    }

    //Get company map coordinates
    function getCompanyLinks(map, callback) {
        if (type == 'company') {
            map.proj_coordinates = [];
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
                    err = new Error('Error: '+ err);
                    return res.send({reason: err.toString()});
                } else if (links) {
                    map.proj_coordinates = links;
                    callback(null, map);
                } else {
                    return res.send({reason: 'not found'});
                }
                });
        }else {
            callback(null, map);
        }
    }

    //Get group map coordinates
    function getCompanyGroupLinks(map,callback) {
        if(type=='group') {
            map.proj_coordinates = [];
            Link.aggregate([
                {$match:{entities:'company'}},
                {$group:{
                    _id:'$company',
                    company_group:{$addToSet:{$cond: { if: { $eq:["$company_group", mongoose.Types.ObjectId(req.params.id) ]}, then: '$company_group',
                        else: []}}},
                    site:{$addToSet:'$site'}
                }},
                {$unwind: "$site"},
                {$unwind:"$company_group"},
                {$unwind:"$company_group"},
                {$lookup: {from: "sites",localField: "site",foreignField: "_id",as: "site"}},
                {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
                {$unwind:'$site.site_coordinates'},
                {$project:{
                    _id:'$site._id',
                    'lat':  { "$arrayElemAt": [ "$site.site_coordinates.loc", -2 ] },
                    'lng': { "$arrayElemAt": [ "$site.site_coordinates.loc", -1 ] },
                    'message': "$site.site_name",
                    'timestamp': "$site.site_coordinates.timestamp",
                    'type': {$cond: { if: { $gte: [ "$field", true ] }, then: 'field', else: 'site' }}
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
                    err = new Error('Error: '+ err);
                    return res.send({reason: err.toString()});
                } else if (links) {
                    map.proj_coordinates = links;
                    callback(null, map);
                } else {
                    return res.send({reason: 'not found'});
                }
            });
        } else{
            callback(null, map)
        }
    }
};
