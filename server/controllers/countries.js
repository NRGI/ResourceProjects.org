var Country 		= require('mongoose').model('Country'),
	Transfer 	    = require('mongoose').model('Transfer'),
	Link            = require('mongoose').model('Link'),
	Project 		= require('mongoose').model('Project'),
	Concession 		= require('mongoose').model('Concession'),
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
	var concession_len,concession_counter;

	async.waterfall([
		getCountry,
		getCountryProjects,
		getCountryConcessions,
		//getContracts,
		getTransfers
	], function (err, result) {
		if (err) {
			res.send(err);
		}
	});

	function getCountry(callback) {
		Country.findOne({iso2:req.params.id})
			.populate('country_commodity.commodity')
			.lean()
			.exec(function(err, country) {
				if(country) {
					callback(null, country);
				} else {
					res.send(err);
				}
			});
	}
	function getCountryProjects(country, callback) {
		var project_counter= 0;
		country.projects = [];
		country.location = [];
		Project.find({'proj_country.country': country._id})
				.populate('proj_country.country')
				.populate('proj_aliases', ' _id alias')
				.populate('proj_commodity.commodity')
				.exec(function (err, project) {
				var project_len = project.length;
				if (project_len>0) {
					country.projects = project;
					country.projects.forEach(function (project) {
						++project_counter;
						project.proj_coordinates.forEach(function (loc) {
							country.location.push({
								'lat': loc.loc[0],
								'lng': loc.loc[1],
								'message': "<a href =\'/project/" + project._id + "\'>" + project.proj_name + "</a><br>" + project.proj_name
							});
							if (project_counter == project_len) {
								callback(null, country);
							}
						})
					});
				} else {
					callback(null, country);
				}
			});
	}
	function getCountryConcessions(country, callback) {
		concession_counter = 0;
		country.concessions = [];
		Concession.find({'concession_country.country': country._id})
			.populate('concession_country.country')
			.populate('concession_commodity.commodity')
			.exec(function (err, concessions) {
				if (concessions.length>0) {
					concession_len = concessions.length;
					concessions.forEach(function (concession) {
						++concession_counter;
						country.concessions.push({
							_id: concession._id,
							concession_name: concession.concession_name,
							concession_country: _.find(concession.concession_country.reverse()).country,
							concession_type: _.find(concession.concession_type.reverse()),
							concession_commodities: concession.concession_commodity,
							concession_status: concession.concession_status
						});
						if (concession_counter == concession_len) {
							callback(null, country);
						}

					});
				} else {
					callback(null, country);
				}
			});
	}
	//function getContracts(country, callback) {
	//	country.contracts = [];
	//	request('http://rc-api-stage.elasticbeanstalk.com/api/contracts/search?group=metadata&country_code=' + country.iso2.toLowerCase(), function (err, res, body) {
	//		var body = JSON.parse(body);
	//		body = body.results;
	//		var contract_counter = 0;
	//		var contract_len =body.length;
	//		if(contract_len>0) {
	//			country.concessions = [];
	//			_.each(body, function (contract) {
	//				++contract_counter;
	//				console.log()
	//				country.contracts.push({
	//					_id: contract.open_contracting_id,
	//					contract_name: contract.name,
	//					contract_commodity: contract.resource,
	//					companies:contract.company_name
	//				});
	//				if (contract_counter == contract_len) {
	//					callback(null, country);
	//				}
	//			});
	//		} else {
	//			callback(null, country);
	//		}
	//	});
	//}
	function getTransfers(country, callback) {
		country.transfers = [];
		Transfer.find({transfer_country: country._id})
			.populate('transfer_country')
			.populate('transfer_company', '_id company_name')
			.populate('transfer_project', '_id proj_name')
			.exec(function(err, transfers) {
				if(transfers) {
					_.each(transfers, function (transfer) {
						country.transfers.push(transfer);
					});
				}
				res.send(country);
			});
	}
};