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
		if(commodity_len>0) {
			commodities.forEach(function (c) {
				Link.find({commodity: c._id})
					.populate('concession')
					.populate('project')
					.populate('contract')
					.exec(function (err, links) {
						++commodity_counter;
						link_len = links.length;
						link_counter = 0;
						c.concessions = 0;
						c.contracts = 0;
						c.projects = 0;
						links.forEach(function (link) {
							++link_counter;

							var entity = _.without(link.entities, 'commodity')[0];
							switch (entity) {
								case 'concession':
									c.concessions += 1;
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
						if (commodity_counter == commodity_len && link_counter == link_len) {
							res.send({data: commodities, count: commodity_count});
						}
					});
			});
		} else{
			res.send({data: commodities, count: commodity_count});
		}
	}
};
exports.getCommodityByID = function(req, res) {
	var link_counter, link_len;

	async.waterfall([
		getCommodity,
		getCommodityLinks,
		getContracts,
		getProjectLocation,
		getCompanyGroup
	], function (err, result) {
		if (err) {
			res.send(err);
		}
	});

	function getCommodity(callback) {
		Commodity.findOne({_id:req.params.id})
			.populate('commodity_aliases', ' _id code reference')
			.lean()
			.exec(function(err, commodity) {
				if(commodity) {
					callback(null, commodity);
				} else {
					callback(err);
				}
			});
	}
	function getCommodityLinks(commodity, callback) {
		commodity.company_groups = [];
		commodity.companies = [];
		commodity.projects = [];
		commodity.contracts_link = [];
		commodity.concessions = [];
		Link.find({commodity: commodity._id})
			.populate('company_group','_id company_group_name')
			.populate('company')
			.populate('contract')
			.deepPopulate('project project.proj_country.country project.proj_commodity.commodity ' +
			'concession concession.concession_country.country concession.concession_commodity.commodity')
			.exec(function(err, links) {
				if(links.length>0) {
					link_len = links.length;
					link_counter = 0;
					links.forEach(function (link) {
						++link_counter;
						var entity = _.without(link.entities, 'commodity')[0];
						switch (entity) {
							case 'company':
								if (!commodity.companies.hasOwnProperty(link._id)) {
									commodity.companies.push({
										_id: link.company._id,
										company_name: link.company.company_name
									});
								}
								break;
							case 'company_group':
								if (!commodity.company_groups.hasOwnProperty(link.company_group.company_group_name)) {
									commodity.company_groups.push({
										_id: link.company_group._id,
										company_group_name: link.company_group.company_group_name
									});
								}
								break;
							case 'concession':
								if (!commodity.concessions.hasOwnProperty(link.concession._id)) {
									commodity.concessions.push({
										_id: link.concession._id,
										concession_name: link.concession.concession_name,
										concession_country: _.find(link.concession.concession_country.reverse()).country,
										concession_type: _.find(link.concession.concession_type.reverse()),
										concession_commodities: link.concession.concession_commodity,
										concession_status: link.concession.concession_status
									});
									//commodity.concessions[link.concession._id+'kkk'] = {
									//	concession_name: link.concession.concession_name,
									//	concession_country: _.find(link.concession.concession_country.reverse().country),
									//	concession_type: _.find(link.concession.concession_type.reverse()),
									//	concession_commodities: link.concession.concession_commodity,
									//	concession_status: link.concession.concession_status
									//};
								}
								break;
							case 'contract':
								if (!_.contains(commodity.contracts_link, link.contract.contract_id)) {
									commodity.contracts_link.push({_id:link.contract.contract_id});
								}
								break;
							case 'project':
								commodity.projects.push(link.project);
								break;
							default:
								console.log(entity, 'link skipped...');
						}
						if(link_counter == link_len) {
							//res.send(commodity);
							callback(null, commodity);
						}
					});
				}
			});
	}
	function getContracts(commodity, callback) {
		commodity.contracts = [];
		var contract_counter = 0;
		var contract_len = commodity.contracts_link.length;
		if(contract_len>0) {
			_.each(commodity.contracts_link, function (contract) {
				request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract._id + '/metadata', function (err, res, body) {
					var body = JSON.parse(body);
					++contract_counter;
					commodity.contracts.push({
						_id: contract._id,
						contract_name: body.name,
						contract_country: body.country,
						contract_commodity: body.resource
					});
					if (contract_counter == contract_len) {
						callback(null, commodity);
					}
				});
			});
		} else{
			callback(null, commodity);
		}
	}
	function getContracts(commodity, callback) {
		commodity.contracts = [];
		var contract_counter = 0;
		var contract_len = commodity.contracts_link.length;
		if(contract_len>0) {
			_.each(commodity.contracts_link, function (contract) {
				request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract._id + '/metadata', function (err, res, body) {
					var body = JSON.parse(body);
					++contract_counter;
					commodity.contracts.push({
						_id: contract._id,
						contract_name: body.name,
						contract_country: body.country,
						contract_commodity: body.resource
					});
					if (contract_counter == contract_len) {
						callback(null, commodity);
					}
				});

			});
		} else{
			callback(null, commodity);
		}
	}
	function getContracts(commodity, callback) {
		commodity.contracts = [];
		var contract_counter = 0;
		var contract_len = commodity.contracts_link.length;
		if(contract_len>0) {
			_.each(commodity.contracts_link, function (contract) {
				request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract._id + '/metadata', function (err, res, body) {
					var body = JSON.parse(body);
					++contract_counter;
					commodity.contracts.push({
						_id: contract._id,
						contract_name: body.name,
						contract_country: body.country,
						contract_commodity: body.resource
					});
					if (contract_counter == contract_len) {
						callback(null, commodity);
					}
				});

			});
		} else{
			callback(null, commodity);
		}
	}
	function getProjectLocation(commodity,callback) {
		var project_counter = 0;
		commodity.location = [];
		var project_len = commodity.projects.length;
		if (commodity.projects.length>0) {
			commodity.projects.forEach(function (project) {
				++project_counter;
				project.project.proj_coordinates.forEach(function (loc) {
					commodity.location.push({
						'lat': loc.loc[0],
						'lng': loc.loc[1],
						'message': "<a href =\'/project/" + project.project._id + "\'>" + project.project.proj_name + "</a><br>" + project.project.proj_name
					});
					if (project_counter == project_len) {
						res.send(commodity);
					}
				})
			});
		}else {
			res.send(commodity);
		}
	}
	function getCompanyGroup(commodity, callback) {
		var company_len = commodity.companies.length;
		var company_counter = 0;
		if(company_len>0) {
			commodity.companies.forEach(function (company) {
				Link.find({company: company._id})
					.populate('company_group', '_id company_group_name')
					.exec(function (err, links) {
						if (links.length > 0) {
							++company_counter;
							link_len = links.length;
							link_counter = 0;
							company.company_groups = [];
							links.forEach(function (link) {
								++link_counter;
								var entity = _.without(link.entities, 'company')[0];
								switch (entity) {
									case 'company_group':
										if (!company.company_groups.hasOwnProperty(link.company_group.company_group_name)) {
											company.company_groups.push({
												_id: link.company_group._id,
												company_group_name: link.company_group.company_group_name
											});
										}
										break;
									default:
										console.log('error');
								}
								if (company_counter == company_len && link_counter == link_len) {
									res.send(commodity);
								}
							});
						} else {
							res.send(commodity);
						}
					});
			});
		} else{
			res.send(commodity);
		}
	}
};
exports.createCommodity = function(req, res, next) {
	var commodityData = req.body;
	Commodity.create(commodityData, function(err, commodity) {
		if(err){
			res.status(400)
			return res.send({reason:err.toString()})
		}
	});
	res.send();
};
exports.updateCommodity = function(req, res) {
	var commodityUpdates = req.body;
	Commodity.findOne({_id:req.body._id}).exec(function(err, commodity) {
		if(err) {
			res.status(400);
			return res.send({ reason: err.toString() });
		}
		commodity._id=commodityUpdates._id;
		commodity.commodity_name= commodityUpdates.commodity_name;
		commodity.commodity_code= commodityUpdates.commodity_code;
		commodity.commodity_aliases= commodityUpdates.commodity_aliases;
		commodity.save(function(err) {
			if(err)
				return res.send({ reason: err.toString() });
		})
	});
	res.send();
};

exports.deleteCommodity = function(req, res) {

	Commodity.remove({_id: req.params.id}, function(err) {
		if(!err) {
			res.send();
		}else{
			return res.send({ reason: err.toString() });
		}
	});
	res.send();
};