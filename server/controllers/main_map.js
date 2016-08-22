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
    _               = require("underscore"),
    request         = require('request');
exports.getMainMap = function(req, res) {
    var config = require('../includes/newworld.json');
    var countries_len, countries_counter, final_country_set,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        countryCount,
        getCountrySet,
        getProjectCounts,
        getTransferCount,
        getRelevantCountries
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
        Country.find({}).count().exec(function (err, country_count) {
            if (err) {
                callback(err);
            } else if (!country_count) {
                callback(null, 0);
            } else {
                callback(null, country_count);
            }
        });
    }

    function getCountrySet(country_count, callback) {
        Country.find({})
            .sort({
                name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(function (err, countries) {
                if (err) {
                    callback(err);
                } else if (!countries) {
                    callback(null, country_count, []);
                } else {
                    callback(null, country_count, countries);
                }
            });
    }

    function getProjectCounts(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        _.each(countries, function (country) {
            Project.find({'proj_country.country': country._id})
                .count()
                .exec(function (err, count) {
                    ++countries_counter;
                    country.project_count = count;
                    if (countries_counter == countries_len) {
                        callback(null, country_count, countries);
                    }
                });
        });
    }
    function getTransferCount(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        _.each(countries, function (country) {
            Transfer.find({'country': country._id})
                .count()
                .exec(function (err, count) {
                    ++countries_counter;
                    country.transfer_count = count;
                    if (countries_counter == countries_len) {
                        callback(null, country_count, countries);
                    }
                });
        });
    }

    function getRelevantCountries(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        final_country_set = [];
        _.each(countries, function (country) {
            if (country.project_count !== 0 || country.transfer_count !== 0) {
                final_country_set.push(country);
            } else {
                --country_count;
            }
        });
        callback(null, {data: final_country_set, count: country_count, world: config})
    }
};