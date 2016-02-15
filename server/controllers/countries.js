var Country 		= require('mongoose').model('Country'),
	async           = require('async'),
	_               = require("underscore"),
	request         = require('request'),
	encrypt 	= require('../utilities/encryption');
exports.getCountries = function(req, res) {
	var limit = Number(req.params.limit),
		skip = Number(req.params.skip);

	async.waterfall([
		countryCount,
		getCountrySet
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
			.populate('projects')
			.lean()
			.exec(function(err, countries) {
				if(countries) {
					res.send({data:countries, count:country_count});
					//callback(null, country_count, countries);
				} else {
					callback(err);
				}
			});
	}
};
exports.getCountryByID = function(req, res) {
	Country.findOne({_id:req.params.id}).exec(function(err, country) {
		res.send(country);
	});
};