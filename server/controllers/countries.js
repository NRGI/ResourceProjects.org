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
    _               = require("underscore"),
    request         = require('request');

exports.getCountries = function(req, res) {
    var limit = Number(req.params.limit),
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
	var countries_len,countries_counter=0,models_len,models_counter=0,counter=0;
	var models =[];
	models = [
		{name:'Project',field:'proj_country.country',arr:'projects'},
		{name:'Site',field:'site_country.country',params:'false',arr:'sites'},
		{name:'Site',field:'site_country.country',params:'true',arr:'fields'},
		{name:'Concession',field:'concession_country.country',arr:'concessions'},
		{name:'Transfer',field:'country',arr:'transfers'},
		{name:'Production',field:'country',arr:'productions'}
	];
    function getCountryProjectCount(country_count, countries, callback) {
		countries_len = countries.length;
		models_len = models.length;
		_.each(countries, function(country) {
			models_counter=0;
			_.each(models, function(model) {
				countries_counter++;
				var params ={};
				var name = require('mongoose').model(model.name);
				var $field = model.field;
				if(model.name == 'Site'){
					params = {field:params};}
				else{
					params={};
				}
				counter=0;
				name.find(params).where($field, country._id).exec(function (err, responce) {
					models_counter++;
					country[model.arr] = responce.length;
					if (models_counter == countries_counter) {
						res.send({data:countries, count:country_count});
					}
				});
			});
		})
	}

};
exports.getCountryByID = function(req, res) {
	var concession_len, concession_counter, link_counter, link_len, company_counter, company_len, project_counter, project_len;

	async.waterfall([
		getCountry,
		getCountryCompanies,
		getCountryProjects,
		getCountryConcessions,
		getContracts,
		getCommodity,
		getSites,
		getCompanyGroupLinks,
		getProjectLinks,
		getConcessionLinks,
		getTransfers,
		getProduction,
		getSiteTransfers,
		getSiteProduction
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
	function getCountryCompanies(country, callback) {
		country.companies = [];
		Company.find({'countries_of_operation.country': country._id,'country_of_incorporation.country': country._id})
				.populate('company_aliases', ' _id alias')
				.populate('company_group')
				.exec(function (err, company) {
				company_len = company.length;
				company_counter = 0;
				if (company_len>0) {
					_.each(company, function (c) {
						company_counter++;
						country.companies.push({_id:c._id,company_name: c.company_name,company_groups:[]});
					});
					if(company_counter==company_len){
						callback(null, country);
					}
				} else {
					callback(null, country);
				}
				//res.send(country);
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
					_.each(project, function (proj) {
							++project_counter;
							country.projects.push({
								_id: proj._id,
								proj_name: proj.proj_name,
								proj_id: proj.proj_id,
								proj_commodity: proj.proj_commodity,
								proj_status: proj.proj_status,
								proj_type: proj.proj_type,
								companies: []
							});
							_.each(proj.proj_coordinates, function (loc) {
								country.location.push({
									'lat': loc.loc[0],
									'lng': loc.loc[1],
									'message': proj.proj_name,
									'timestamp': loc.timestamp,
									'type': 'project',
									'id': proj.proj_id
								});
							});
							if (project_counter == project_len) {
								callback(null, country);
							}
						}
					);
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
					_.each(concessions, function (concession) {
						++concession_counter;
						country.concessions.push({
							_id: concession._id,
							concession_name: concession.concession_name,
							concession_country: _.find(concession.concession_country.reverse()).country,
							concession_type: _.find(concession.concession_type.reverse()),
							concession_commodities: concession.concession_commodity,
							concession_status: concession.concession_status,
							projects:[]
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
	function getContracts(country, callback) {
		country.contracts = [];
		country.commodities = [];
		request('http://rc-api-stage.elasticbeanstalk.com/api/contracts/search?group=metadata&country_code=' + country.iso2.toLowerCase(), function (err, res, body) {
			var body = JSON.parse(body);
			body = body.results;
			var contract_counter = 0;
			var contract_len =body.length;
			if(contract_len>0) {
				country.concessions = [];
				_.each(body, function (contract) {
					++contract_counter;
					country.contracts.push({
						_id: contract.open_contracting_id,
						contract_name: contract.name,
						contract_commodity: contract.resource,
						companies:contract.company_name
					});
				});
				if (contract_counter == contract_len) {
					callback(null, country);
				}
			} else {
				callback(null, country);
			}
		});
	}
	function getCommodity(country, callback) {
		var contract_len = country.contracts.length;
		var contract_counter = 0;
		if(contract_len>0) {
			country.contracts.forEach(function (contract) {
				contract.commodity=[];
				var commodity_len = contract.contract_commodity.length;
				if(commodity_len>0) {
					contract.contract_commodity.forEach(function (commodity_name) {
						if (commodity_name != undefined) {
							Commodity.find({commodity_name: commodity_name})
								.exec(function (err, commodity) {
									++contract_counter;
									commodity.map(function (name) {
										return contract.commodity.push({
											commodity_name: commodity_name,
											_id: name._id,
											commodity_id: name.commodity_id
										});
									});
									if (contract_counter == contract_len) {
										callback(null, country);
									}
								});
						}
					})
				}
			})
		} else{
			callback(null, country);
		}
	}
	function getSites(country, callback) {
		country.sites = [];
		Site.find({'site_country.country': country._id})
			.populate('site_country.country')
			.populate('site_commodity.commodity')
			.exec(function (err, sites) {
				var len = sites.length;
				var type = 'site';
				var counter = 0;
				_.each(sites, function (site) {
					++counter;
					if(site.field==true){
						type = 'field';
					}else{type = 'site';}
					var site_len = site.site_coordinates.length;
					if(site_len>0) {
						site.site_coordinates.forEach(function (loc) {
							country.location.push({
								'lat': loc.loc[0],
								'lng': loc.loc[1],
								'message': site.site_name,
								'type': type,
								'timestamp': loc.timestamp,
								'id': site._id
							});
						});
					}
					country.sites.push(site);
					if(counter==len){
						callback(null, country);
					}
				});
			});
	}
	function getCompanyGroupLinks(country, callback) {
		company_counter = 0;
		link_counter = 0;
		country.sources = {};
		company_len = country.companies.length;
		if(company_len>0) {
			_.each(country.companies,function (company) {
				++company_counter;
				Link.find({company: company._id})
					.populate('company_group','_id company_group_name')
					.deepPopulate('source.source_type_id')
					.exec(function (err, links) {
						link_len = links.length;
						link_counter = 0;
						links.forEach(function (link) {
							++link_counter;
							var entity = _.without(link.entities, 'company')[0];
							if(link.source!=undefined) {
								if (!country.sources[link.source._id]) {
									country.sources[link.source._id] = link.source;
								}
							}
							switch (entity) {
								case 'company_group':
									company.company_groups.push({
											_id:link._id,
											company_group_name: link.company_group.company_group_name
									});
									break;
								default:
									console.log(entity, 'link skipped...');
							}
						});
						if (link_counter == link_len && company_len==company_counter) {
							callback(null, country);
						}
					});
			})
		} else {
			callback(null, country);
		}
	}
	function getProjectLinks(country, callback) {
		project_counter = 0;
		link_counter = 0;
		project_len = country.projects.length;
		if(project_len>0) {
			_.each(country.projects, function (project) {
				++project_counter;
				project.companies = 0;
				Link.find({project: project._id})
					.populate('company_group','_id company_group_name')
					.deepPopulate('source.source_type_id')
					.exec(function (err, links) {
						link_len = links.length;
						link_counter = 0;
						links.forEach(function (link) {
							++link_counter;
							var entity = _.without(link.entities, 'project')[0];
							if(link.source!=undefined) {
								if (!country.sources[link.source._id]) {
									country.sources[link.source._id] = link.source;
								}
							}
							switch (entity) {
								case 'company':
									project.companies += 1;
									break;
								default:
									console.log(entity, 'link skipped...');
							}
						});
						if (link_counter == link_len && project_counter==project_len) {
							callback(null, country);
						}
					});
			})
		} else {
			callback(null, country);
		}
	}
	function getConcessionLinks(country, callback) {
		link_counter = 0;
		concession_len = country.concessions.length;
		if(concession_len>0) {
			concession_counter = 0;
			_.each(country.concessions, function (concession) {
				concession.projects = 0;
				Link.find({concession: concession._id})
					.populate('project')
					.deepPopulate('source.source_type_id')
					.exec(function (err, links) {
						++concession_counter;
						link_len = links.length;
						link_counter = 0;
						if(link_len>0) {
							links.forEach(function (link) {
								++link_counter;
								var entity = _.without(link.entities, 'concession')[0];
								if (link.source != undefined) {
									if (!country.sources[link.source._id]) {
										country.sources[link.source._id] = link.source;
									}
								}
								switch (entity) {
									case 'project':
										concession.projects += 1;
										break;
									default:
										console.log(entity, 'link skipped...');
								}
								if (link_counter == link_len && concession_counter==concession_len) {
									callback(null, country);
								}
							});
						}
					});
			})
		} else {
			callback(null, country);
		}
	}
	function getTransfers(country, callback) {
		country.transfers = [];
		Transfer.find({country: country._id})
			.populate('country')
			.populate('company', '_id company_name')
			.populate('project', '_id proj_name proj_id')
			.lean()
			.exec(function(err, transfers) {
				var transfers_counter = 0;
				var transfers_len = transfers.length;
				if (transfers_len>0) {
					transfers.forEach(function (transfer) {
						if (!country.sources[transfer.source._id]) {
							//TODO clean up returned data if performance lags
							country.sources[transfer.source._id] = transfer.source;
						}
						var proj_name = '',proj_id='';
						++transfers_counter;
						if(transfer.project!=undefined){
							proj_name = transfer.project.proj_name;
							proj_id =transfer.project.proj_id
						}
						country.transfers.push({
							_id: transfer._id,
							transfer_year: transfer.transfer_year,
							company: {
								company_name: transfer.company.company_name,
								_id: transfer.company._id},
							country: {
								name: transfer.country.name,
								iso2: transfer.country.iso2},
							transfer_type: transfer.transfer_type,
							transfer_unit: transfer.transfer_unit,
							transfer_value: transfer.transfer_value,
							transfer_level: transfer.transfer_level,
							transfer_audit_type: transfer.transfer_audit_type,
							proj_site:{name:proj_name,_id:proj_id,type:'project'}
						});
						if (transfers_counter===transfers_len) {
							callback(null, country);
						}
					});
				} else {
					callback(null, country);
				}
			});
	}
	function getProduction(country, callback) {
		country.production = [];
		Production.find({country: country._id})
			.populate('production_commodity')
			.populate('project')
			.deepPopulate('source.source_type_id')
			.lean()
			.exec(function(err, production) {
				var production_counter = 0;
				var production_len = production.length;
				if (production_len>0) {
					production.forEach(function (prod) {
						if (!country.sources[prod.source._id]) {
							//TODO clean up returned data if performance lags
							country.sources[prod.source._id] = prod.source;
						}
						var proj_name = '',proj_id='';
						if(prod.project!=undefined){
							proj_name = prod.project.proj_name;
							proj_id =prod.project.proj_id
						}
						++production_counter;
						country.production.push({
							_id: prod._id,
							production_year: prod.production_year,
							production_volume: prod.production_volume,
							production_unit: prod.production_unit,
							production_commodity: {
								_id: prod.production_commodity._id,
								commodity_name: prod.production_commodity.commodity_name,
								commodity_id: prod.production_commodity.commodity_id},
							production_price: prod.production_price,
							production_price_unit: prod.production_price_unit,
							production_level: prod.production_level,
							proj_site:{name:proj_name,_id:proj_id,type:'project'}
						});
						if (production_counter===production_len) {
							callback(null, country);
						}
					});
				} else {
					callback(null, country);
				}
			});
	}
	function getSiteTransfers(country, callback) {
		var site_len = country.sites.length;
		var site_counter = 0;
		if(site_len>0) {
			country.sites.forEach(function (site) {
				Transfer.find({site:site._id})
					.populate('company country')
					.deepPopulate('source.source_type_id')
					.exec(function(err, transfers) {
						++site_counter;
						var transfers_counter = 0;
						var transfers_len = transfers.length;
						if (transfers_len>0) {
							transfers.forEach(function (transfer) {
								if (!country.sources[transfer.source._id]) {
									//TODO clean up returned data if performance lags
									country.sources[transfer.source._id] = transfer.source;
								}
								++transfers_counter;
								country.transfers.push({
									_id: transfer._id,
									transfer_year: transfer.transfer_year,
									company: {
										company_name: transfer.company.company_name,
										_id: transfer.company._id},
									country: {
										name: transfer.country.name,
										iso2: transfer.country.iso2},
									transfer_type: transfer.transfer_type,
									transfer_unit: transfer.transfer_unit,
									transfer_value: transfer.transfer_value,
									transfer_level: transfer.transfer_level,
									transfer_audit_type: transfer.transfer_audit_type,
									proj_site:{name:site.site_name,_id:site._id,type:'site'}
								});
								if (site_counter===site_len && transfers_counter===transfers_len) {
									callback(null, country);
								}
							});
						} else {
							if (site_counter===site_len && transfers_counter===transfers_len) {
								callback(null, country);
							}
						}
					});

			});
		} else {
			callback(null, country);
		}
	}
	function getSiteProduction(country, callback) {
		var site_len = country.sites.length;
		var site_counter = 0;
		if(site_len>0) {
			country.sites.forEach(function (site) {
				Production.find({site:site._id})
					.populate('production_commodity')
					.deepPopulate('source.source_type_id')
					.exec(function(err, production) {
						++site_counter;
						var production_counter = 0;
						var production_len = production.length;
						if (production_len>0) {
							production.forEach(function (prod) {
								if (!country.sources[prod.source._id]) {
									//TODO clean up returned data if performance lags
									country.sources[prod.source._id] = prod.source;
								}
								++production_counter;
								country.production.push({
									_id: prod._id,
									production_year: prod.production_year,
									production_volume: prod.production_volume,
									production_unit: prod.production_unit,
									production_commodity: {
										_id: prod.production_commodity._id,
										commodity_name: prod.production_commodity.commodity_name,
										commodity_id: prod.production_commodity.commodity_id},
									production_price: prod.production_price,
									production_price_unit: prod.production_price_unit,
									production_level: prod.production_level,
									proj_site:{name:site.site_name,_id:site._id,type:'site'}
								});
								if (site_counter===site_len && production_counter===production_len) {
									res.send(country);
								}
							});
						} else {
							if (site_counter===site_len && production_counter===production_len) {
								res.send(country);
							}
						}
					});

			});
		} else {
			res.send(country);
		}
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
		//country.country_aliases= countryUpdates.country_aliases;
		//country.country_type= countryUpdates.country_type;
		//country.country_commodity= countryUpdates.country_commodity;
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