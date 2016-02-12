var Commodity 		= require('mongoose').model('Commodity'),
	Link 	        = require('mongoose').model('Link'),
	async           = require('async'),
	_               = require("underscore"),
	request         = require('request'),
	encrypt 		= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getCommodities = function(req, res) {
	var commodity_len, link_len, commodity_counter, link_counter,
		limit = Number(req.params.limit),
		skip = Number(req.params.skip);

	async.waterfall([
		commodityCount,
		getCommoditySet,
		getCommodityLinks,
	], function (err, result) {
		if (err) {
			res.send(err);
		}
	});

	function commodityCount(callback) {
		Commodity.find({}).count().exec(function(err, commodity_count) {
			if(commodity_count) {
				callback(null, commodity_count);
			} else {
				callback(err);
			}
		});
	}

	function getCommoditySet(commodity_count, callback) {
		Commodity.find(req.query)
			.sort({
				commodity_name: 'asc'
			})
			.skip(skip)
			.limit(limit)
			.lean()
			.exec(function(err, commodities) {
				if(commodities) {
					callback(null, commodity_count, commodities);
				} else {
					callback(err);
				}
			});
	}

	function getCommodityLinks(commodity_count, commodities, callback) {
		commodity_len = commodities.length;
		commodity_counter = 0;
		commodities.forEach(function (c) {
			Link.find({commodity: c._id})
				.populate('concession')
				.populate('project')
				.populate('contract')
				.exec(function(err, links) {
					++commodity_counter;
					link_len = links.length;
					link_counter = 0;
					c.concessions = 0;
					c.contracts = 0;
					c.projects = 0;
					links.forEach(function(link) {
						++link_counter;

						var entity = _.without(link.entities, 'commodity')[0];
						switch (entity) {
							case 'concession':
								c.concessions+= 1;
								break;
							//
							case 'project':
								c.projects += 1;
								break;
							//
							case 'contract':
								c.contracts += 1;
								break;
							//
							default:
							//console.log(entity, 'link skipped...');
						}

					});
					if(commodity_counter == commodity_len && link_counter == link_len) {
						res.send({data:commodities, count:commodity_count});
					}
				});
		});
	}
};
exports.getCommodityByID = function(req, res) {
	var source=[];var country=[];var concession=[];var contract=[];var project=[];var company=[];var alias=[];var commodity=[];
	Company.find(req.query).exec(function(err, collection) {
		company = collection;
	});
	Alias.find(req.query).exec(function(err, collection) {
		alias = collection;
	});
	Source.find(req.query).exec(function(err, collection) {
		source = collection;
	});
	Country.find(req.query).exec(function(err, collection) {
		country = collection;
	});
	Project.find(req.query).exec(function(err, collection) {
		project = collection;
	});
	Concession.find(req.query).exec(function(err, collection) {
		concession = collection;
	});
	Contract.find(req.query).exec(function(err, collection) {
		contract = collection;
	});
	Commodity.findOne({_id:req.params.id}).exec(function(err, collection) {
		setTimeout(function() {
			commodity = collection;
			if (collection != null || collection != undefined) {
				if (collection.commodity_aliases.length != 0) {
					alias.forEach(function (alias_item) {
						collection.commodity_aliases.forEach(function (item, i) {
							if (alias_item._id == item.toString()) {
								commodity.commodity_aliases[i] = ({
									_id: alias_item._id,
									code: alias_item.code,
									reference: alias_item.reference
								});
							}


						})
					});
				}
				if (collection.concessions.length != 0) {
					concession.forEach(function (concession_item) {
						collection.concessions.forEach(function (item, i) {
							if (concession_item._id == item.toString()) {
								if (concession_item.concession_country.length != 0) {
									country.forEach(function (country_item) {
										if (country_item._id.toString() == concession_item.concession_country[0].string.toString()) {
											commodity.concessions[i] = ({
												_id: concession_item._id,
												concession_name: concession_item.concession_name,
												concession_country: {
													source: concession_item.concession_country[0].source,
													country: concession_item.concession_country[0].country,
													_id: country_item._id,
													name: country_item.name,
													iso2: country_item.iso2
												}
											});
										}
									});

								}
							}

						})
					});

				}
				if (collection.contracts.length != 0) {
					contract.forEach(function (contract_item) {
						collection.contracts.forEach(function (item, i) {
							if (contract_item._id == item.toString()) {
								if (contract_item.country.length != 0) {
									country.forEach(function (country_item) {
										if (country_item._id.toString() == contract_item.country[0].string.toString()) {
											commodity.contracts[i] = ({
												_id: contract_item._id,
												contract_id:  contract_item.contract_id,
												contract_name:  contract_item.contract_name,
												country: {
													source: contract_item.country[0].source,
													country: contract_item.country[0].string,
													_id: country_item._id,
													name: country_item.name,
													iso2: country_item.iso2
												}
											});
										}
									});

								}
							}

						})
					});

				}
				if (collection.projects.length != 0) {
					project.forEach(function (project_item) {
						collection.projects.forEach(function (item, i) {
							if (project_item._id.toString() == item.toString()) {
								if (project_item.country.length != 0) {
									country.forEach(function (country_item) {
										if (country_item._id.toString() == project_item.country[0].country.toString()) {
											commodity.projects[i] = ({
												_id: project_item._id,
												proj_name:  project_item.proj_name,
												country: {
													source: project_item.country[0].source,
													country: project_item.country[0].country,
													_id: country_item._id,
													name: country_item.name,
													iso2: country_item.iso2
												}
											});
										}
									});
								}
							}
						})
					});
				}
				if (collection.companies.length != 0) {
					company.forEach(function (companies_item) {
						collection.companies.forEach(function (item, i) {
							if (companies_item._id.toString() == item.toString()) {
								commodity.companies[i] = ({
									_id: companies_item._id,
									company_name:  companies_item.company_name
								});
							}
						})
					});
				}
				res.send(commodity);

			}
		},200);
	});
};


