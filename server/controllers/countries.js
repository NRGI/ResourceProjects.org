var Country 		= require('mongoose').model('Country'),
	Transfer 	    = require('mongoose').model('Transfer'),
	Link            = require('mongoose').model('Link'),
	Project 		= require('mongoose').model('Project'),
	async           = require('async'),
	_               = require("underscore"),
	request         = require('request'),
	encrypt 		= require('../utilities/encryption');
exports.getCountries = function(req, res) {
	var country_len,country_counter,
		limit = Number(req.params.limit),
		skip = Number(req.params.skip);

	async.waterfall([
		countryCount,
		getCountrySet,
		getCountryProjectCount
	], function (err, result) {
		if (err) {
			res.send(err);
		}
	});

    function countryCount(callback) {
        Country.find({}).count().exec(function(err, country_count) {
            if(country_count) {
                callback(null, country_count);
            } else {
                callback(err);
            }
        });
    }
    function getCountrySet(country_count, callback) {
        Country.find(req.query)
            .sort({
                name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .populate('country_aliases', ' _id alias model')
            //.populate('projects')
            .lean()
            .exec(function(err, countries) {
                if(countries) {
                    //res.send({data:countries, count:country_count});
                    callback(null, country_count, countries);
                } else {
                    callback(err);
                }
            });
    }
    function getCountryProjectCount(country_count, countries, callback) {
        country_len = countries.length;
        country_counter = 0;
        countries.forEach(function (c) {
            Project.find({'proj_country.country': c._id}).count().exec(function(err, project_count) {
                ++country_counter;
                c.projects = project_count;
                if(country_counter == country_len) {
                    res.send({data:countries, count:country_count});
                }
            });

		});
	}
};

exports.getCountryByID = function(req, res) {

	async.waterfall([
		getCountry
	], function (err, result) {
		if (err) {
			res.send(err);
		}
	});

	function getCountry(callback) {
		Country.findOne({_id:req.params.id})
			.lean()
			.exec(function(err, country) {
				if(country) {
					res.send(country);
				} else {
					callback(err);
				}
			});
	}
};