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
    var config = require('./newworld.json');
    var countries_len, countries_counter, final_country_set,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip),
        models = [
            {name: 'Site', field: 'site_country.country', params: 'false', count: 'site_count'},
            {name: 'Site', field: 'site_country.country', params: 'true', count: 'field_count'},
            {name: 'Concession', field: 'concession_country.country', count: 'concession_count'},
            {name: 'Transfer', field: 'country', count: 'transfer_count'},
            {name: 'Production', field: 'country', count: 'production_count'}
        ];

    async.waterfall([
        countryCount,
        getCountrySet,
        getProjectCounts,
        //getSiteCounts,
        //getFieldCounts,
        //getConcessionCount,
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

   /* function getSiteCounts(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        _.each(countries, function (country) {
            Site.find({'site_country.country': country._id, field: false})
                .count()
                .exec(function (err, count) {
                    ++countries_counter;
                    country.site_count = count;
                    if (countries_counter == countries_len) {
                        callback(null, country_count, countries);
                    }
                });
        });
    }

    function getFieldCounts(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        _.each(countries, function (country) {
            Site.find({'site_country.country': country._id, field: true})
                .count()
                .exec(function (err, count) {
                    ++countries_counter;
                    country.field_count = count;
                    if (countries_counter == countries_len) {
                        callback(null, country_count, countries);
                    }
                });
        });
    }

    function getConcessionCount(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        _.each(countries, function (country) {
            Concession.find({'concession_country.country': country._id})
                .count()
                .exec(function (err, count) {
                    ++countries_counter;
                    country.concession_count = count;
                    if (countries_counter == countries_len) {
                        callback(null, country_count, countries);
                    }
                });
        });
    }
*/
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
                        // callback(null, {data:countries, count:country_count})
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
            //if (country.project_count !== 0 || country.site_count !== 0 || country.field_count !== 0 || country.concession_count !== 0 || country.transfer_count !== 0) {
            if (country.project_count !== 0 || country.transfer_count !== 0) {
                final_country_set.push(country);
            } else {
                --country_count;
            }
        });
        callback(null, {data: final_country_set, count: country_count, world: config})
    }
};