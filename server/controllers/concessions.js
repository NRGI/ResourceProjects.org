var Concession 		= require('mongoose').model('Concession'),
	Link 	        = require('mongoose').model('Link'),
	Country			= require('mongoose').model('Country'),
	async           = require('async'),
	_               = require("underscore"),
	request         = require('request'),
	encrypt 	= require('../utilities/encryption');
exports.getConcessions = function(req, res) {
	var concession_len, link_len, concession_counter, link_counter,
		limit = Number(req.params.limit),
		skip = Number(req.params.skip);

	async.waterfall([
		concessionCount,
		getConcessionSet,
		getConcessionLinks,
	], function (err, result) {
		if (err) {
			res.send(err);
		}
	});

	function concessionCount(callback) {
		Concession.find({}).count().exec(function(err, concession_count) {
			if(concession_count) {
				callback(null, concession_count);
			} else {
				callback(err);
			}
		});
	}

	function getConcessionSet(concession_count, callback) {
		Concession.find(req.query)
			.sort({
				company_name: 'asc'
			})
			.skip(skip)
			.limit(limit)
			.populate('concession_country.country', '_id iso2 name')
			//.populate('concession_aliases', ' _id alias')
			.lean()
			.exec(function(err, concessions) {
				if(concessions) {
					callback(null, concession_count, concessions);
				} else {
					callback(err);
				}
			});
	}

	function getConcessionLinks(concession_count, concessions, callback) {
		concession_len = concessions.length;
		concession_counter = 0;
		concessions.forEach(function (c) {
			Link.find({concession: c._id})
				.populate('commodity','_id commodity_name')
				.populate('project')
				.exec(function(err, links) {
					++concession_counter;
					link_len = links.length;
					link_counter = 0;
					c.concession_commodity = [];
					c.projects = 0;
					links.forEach(function(link) {
						++link_counter;
						var entity = _.without(link.entities, 'concession')[0]
						switch (entity) {
							case 'commodity':
								c.concession_commodity.push({
									_id: link.commodity._id,
									commodity_name: link.commodity.commodity_name
								});
								break;
							//
							case 'project':
								c.projects += 1;
								break;
							//
							default:
							//console.log(entity, 'link skipped...');
						}

					});
					if(concession_counter == concession_len && link_counter == link_len) {
						res.send({data:concessions, count:concession_count});
					}
				});
		});
	}
};
exports.getConcessionByID = function(req, res) {
	var country=[];var project=[];var source=[];var alias=[];var companies=[];var contracts=[];var commodities=[];var concessions=[];
	Commodity.find(req.query).exec(function(err, collection) {
		commodities = collection;
	});
	Company.find(req.query).exec(function(err, collection) {
		companies = collection;
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
	Contract.find(req.query).exec(function(err, collection) {
		contracts = collection;
	});
	Concession.findOne({_id:req.params.id}).exec(function(err, collection) {
		setTimeout(function() {
			if (collection != null || collection != undefined) {
				concessions = collection;
				if (collection.concession_status.length != 0) {
					source.forEach(function (source_item) {
						if (source_item._id.toString() == collection.concession_status[0].source.toString()) {
							concessions.concession_status[0] = {
								source: collection.concession_status[0].source,
								date: source_item.source_date,
								string: collection.concession_status[0].string
							};
						}
					})
				}
				if (collection.concession_aliases.length != 0) {
					collection.concession_aliases.forEach(function (aliases, i) {
						alias.forEach(function (alias_item) {
							if (alias_item._id.toString() == aliases.toString()) {
								concessions.concession_aliases[i] = {
									_id: aliases,
									name: alias_item.alias
								};
							}

						})
					})
				}
				if (collection.contracts.length != 0) {
					collection.contracts.forEach(function (contract, i) {
						contracts.forEach(function (contract_item) {
							if (contract_item._id.toString() == contract.toString()) {
								concessions.contracts[i] = {
									_id: contract,
									name: contract_item.contract_id
								};
							}

						})
					})
				}
				if (collection.commodities.length != 0) {
					collection.commodities.forEach(function (commodity, i) {
						commodities.forEach(function (commodity_item) {
							if (commodity_item._id.toString() == commodity.toString()) {
								concessions.commodities[i] = {
									_id: commodity,
									name: commodity_item.commodity_name
								};
							}

						})
					})
				}
				//if (collection.companies.length != 0) {
				//	collection.companies.forEach(function (company, i) {
				//		companies.forEach(function (company_item) {
				//			if (company_item._id.toString() == company.toString()) {
				//				concessions.companies[i] = {
				//					_id: company,
				//					name: company_item.company_name
				//				};
				//			}
                //
				//		})
				//	})
				//}
				country.forEach(function (country_item) {
					if (collection.concession_country.length != 0) {
						if (collection.concession_country[0].string != undefined) {
							if (country_item._id == collection.concession_country[0].string.toString()) {
								concessions.concession_country[0] = {
									source: collection.concession_country[0].source,
									string: collection.concession_country[0].string,
									_id: country_item._id,
									name: country_item.name,
									iso2: country_item.iso2
								};
							}
						}
					}
				});
				res.send(concessions);
			} else {
				res.send(collection);
			}
		},100);
		//res.send(concession);
	});
};