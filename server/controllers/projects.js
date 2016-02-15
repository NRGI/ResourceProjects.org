var Project 		= require('mongoose').model('Project'),
	Country 		= require('mongoose').model('Country'),
	Source	 		= require('mongoose').model('Source'),
	Link 	        = require('mongoose').model('Link'),
	Transfer 	    = require('mongoose').model('Transfer'),
	async           = require('async'),
	_               = require("underscore"),
	request         = require('request'),
	encrypt 		= require('../utilities/encryption');
exports.getProjects = function(req, res) {
	var project_len, link_len, project_counter, link_counter,
		limit = Number(req.params.limit),
		skip = Number(req.params.skip);

	async.waterfall([
		projectCount,
		getProjectSet,
		getProjectLinks
	], function (err, result) {
		if (err) {
			res.send(err);
		}
	});

	function projectCount(callback) {
		Project.find({}).count().exec(function(err, project_count) {
			if(project_count) {
				callback(null, project_count);
			} else {
				callback(err);
			}
		});
	}

	function getProjectSet(project_count, callback) {
		Project.find(req.query)
			.sort({
				proj_name: 'asc'
			})
			.skip(skip)
			.limit(limit)
			.populate('proj_country.country', '_id iso2 name')
			//.populate('proj_aliases', ' _id alias')
			.lean()
			.exec(function(err, projects) {
				if(projects) {
					callback(null, project_count, projects);
				} else {
					callback(err);
				}
			});
	}

	function getProjectLinks(project_count, projects, callback) {
		project_len = projects.length;
		project_counter = 0;
		projects.forEach(function (c) {
			Link.find({project: c._id})
				.populate('commodity','_id commodity_name')
				.populate('company')
				.exec(function(err, links) {
					++project_counter;
					link_len = links.length;
					link_counter = 0;
					c.proj_commodity = [];
					c.companies = 0;
					links.forEach(function(link) {
						++link_counter;
						var entity = _.without(link.entities, 'project')[0];
						switch (entity) {
							case 'commodity':
								c.proj_commodity.push({
									_id: link.commodity._id,
									commodity_name: link.commodity.commodity_name
								});
								break;
							//
							case 'company':
								c.companies += 1;
								break;
							//
							default:
								console.log('error');
						}
					});
					if(project_counter == project_len && link_counter == link_len) {
						res.send({data:projects, count:project_count});
					}
				});
		});
	}
};
exports.getProjectByID = function(req, res) {
	var link_counter, link_len;

	async.waterfall([
		getProject,
		getTransfers,
		getProjectLinks
	], function (err, result) {
		if (err) {
			res.send(err);
		}

	});

	function getProject(callback) {
		Project.findOne({_id:req.params.id})
			.populate('proj_country.country')
			.populate('proj_aliases', ' _id alias')
			.populate('proj_commodity.commodity')
			.lean()
			.exec(function(err, project) {
				if(project) {
					callback(null, project);
				} else {
					callback(err);
				}
			});
	}
	function getTransfers(project, callback) {
		project.transfers = [];
		project.prodactions = [];
		Transfer.find({transfer_project: project._id})
			.populate('transfer_country')
			.populate('transfer_company', '_id company_name')
			.exec(function(err, transfers) {
				console.log(project._id);
				console.log(transfers);
				_.each(transfers, function(transfer) {
					project.transfers.push(transfer);
				});
				if(project) {
					callback(null, project);
				} else {
					callback(err);
				}
			});
	}
	function getProjectLinks(project, callback) {
		Link.find({project: project._id})
			.populate('commodity')
			.populate('company')
			.populate('contract')
			.populate('concession')
			.deepPopulate('company company.company_group')
			.exec(function(err, links) {
				link_len = links.length;
				link_counter = 0;
				project.companies = [];
				project.commodities = {};
				project.projects = [];
				project.concessions = [];
				project.contracts = [];
				links.forEach(function(link) {
					++link_counter;
					var entity = _.without(link.entities, 'project')[0];
					switch (entity) {
						case 'commodity':
							if (!project.commodities.hasOwnProperty(link.commodity_code)) {
								project.commodities[link.commodity.commodity_code] = link.commodity.commodity_name;
							}
							break;
						case 'company':
							if (!project.companies.hasOwnProperty(link.company._id)) {
								project.companies.push({
									_id: link.company._id,
									company_name: link.company.company_name
								});
							}
							break;
						case 'concession':
							project.concessions.push({
								_id: link.concession._id,
								concession_name: link.concession.concession_name
							});
							break;
						case 'contract':
							project.contracts.push(link);
							break;
						default:
							console.log('error');
					}
					if(link_counter == link_len) {
						res.send(project);
					}
				});
			});
	}
};
