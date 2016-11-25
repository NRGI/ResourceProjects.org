'use strict';

var Country 		= require('mongoose').model('Country'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Link            = require('mongoose').model('Link'),
    Project 		= require('mongoose').model('Project'),
    Company 		= require('mongoose').model('Company'),
    Site 			= require('mongoose').model('Site'),
    Concession 		= require('mongoose').model('Concession'),
    Production 		= require('mongoose').model('Production'),
    async           = require('async'),
    errors 		    = require('./errorList'),
    _               = require("underscore"),
    request         = require('request');

//Get main map
exports.getMainMap = function(req, res) {

    var config = require('../includes/newworld.json');
    var finalCountrySet,errorList=[];

    async.waterfall([
        countryCount,
        getCountrySet,
        getProjectCounts,
        getTransferCount
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

    function countryCount(callback) {
        Country.find({}).count().exec(function (err, countriesCount) {
            if (err) {
                err = new Error('Error: '+ err);
                return res.send({reason: err.toString()});
            } else if (countriesCount==0) {
                return res.send({reason: 'not found'});
            } else {
                callback(null, countriesCount);
            }
        });
    }

    function getCountrySet(countriesCount, callback) {
        Country.aggregate([
            {$sort: {name: -1}},
            {$project:{_id:1,iso2:1,name:1,project_count:{$literal:0},transfer_count:{$literal:0}}}
        ]).exec(function (err, countries) {
            if (err) {
                err = new Error('Error: '+ err);
                return res.send({reason: err.toString()});
            } else if (countries.length>0) {
                callback(null, countriesCount,countries);
            } else {
                return res.send({reason: 'not found'});
            }
        });
    }

    function getProjectCounts(countriesCount, countries, callback) {
        var ids = _.pluck(countries, '_id');
        Project.aggregate([
            {$unwind:'$proj_country'},
            {$match:{$or:[{'proj_country.country':{$in:ids}}]}},
            {$group:{ _id:'$proj_country.country',project:{$addToSet:'$proj_id'}}},
            {$project:{_id:1,project_count:{$size:'$project'}}}
        ]).exec(function(err,projects){
            if (err) {
                errorList = errors.errorFunction(err,'Country projects');
                callback(null, countriesCount, countries,errorList);
            }
            else {
                if (projects.length>0) {
                    _.map(countries, function (country) {
                        var list = _.find(projects, function (project) {
                            return project._id.toString() == country._id.toString();
                        });
                        if (list) {
                            country.project_count = list.project_count;
                        }
                        return country;
                    });
                    callback(null, countriesCount, countries, errorList);
                } else {
                    errorList.push({type: 'Country projects', message: 'country projects not found'})
                    callback(null, countriesCount, countries, errorList);
                }
            }
        })
    }
    function getTransferCount(countriesCount, countries, errorList, callback) {
        var ids = _.pluck(countries, '_id');
        Transfer.aggregate([
            {$match:{$or:[{'country':{$in:ids},'project':{ $exists: true }}]}},
            {$group:{ _id:'$country',transfers:{$addToSet:'$_id'}}},
            {$project:{_id:1,transfer_count:{$size:'$transfers'}}}
        ]).exec(function(err,transfers){
            if (err) {
                finalCountrySet = _.filter(countries, function(num){ return num.project_count !== 0;});
                errorList = errors.errorFunction(err,'Country transfers');
                callback(null,{data: finalCountrySet, count: countriesCount, world: config,errorList:errorList });
            }
            else {
                if (transfers.length>0) {
                    _.map(countries, function (country) {
                        var list = _.find(transfers, function (transfer) {
                            return transfer._id.toString() == country._id.toString();
                        });
                        if (list) {
                            country.transfer_count = list.transfer_count;
                        }
                        return country;
                    });
                    finalCountrySet = _.filter(countries, function(num){ return num.project_count !== 0 || num.transfer_count !== 0; });
                    callback(null,{data: finalCountrySet, count: countriesCount, world: config,errorList:errorList });
                } else {
                    finalCountrySet = _.filter(countries, function(num){ return num.project_count !== 0;});
                    errorList.push({type: 'Country transfers', message: 'country transfers not found'})
                    callback(null,{data: finalCountrySet, count: countriesCount, world: config,errorList:errorList });
                }
            }
        })
    }
};