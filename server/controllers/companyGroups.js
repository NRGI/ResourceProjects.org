var CompanyGroup 		= require('mongoose').model('CompanyGroup'),
	Link 	        = require('mongoose').model('Link'),
	Transfer 	    = require('mongoose').model('Transfer'),
	async           = require('async'),
	_               = require("underscore"),
	request         = require('request');
//.populate('comments.author', 'firstName lastName role')
exports.getCompanyGroups = function(req, res) {
	var companyGroup_len, link_len, companyGroup_counter, link_counter,
		limit = Number(req.params.limit),
		skip = Number(req.params.skip);

	async.waterfall([
		companyGroupCount,
		getCompanyGroupSet,
		getCompanyGroupLinks
	], function (err, result) {
		if (err) {
			res.send(err);
		}
	});

	function companyGroupCount(callback) {
		CompanyGroup.find({}).count().exec(function(err, companyGroup_count) {
			if(companyGroup_count) {
				callback(null, companyGroup_count);
			} else {
				callback(err);
			}
		});
	}

	function getCompanyGroupSet(companyGroup_count, callback) {
		CompanyGroup.find(req.query)
			.sort({
				company_group_name: 'asc'
			})
			.skip(skip)
			.limit(limit)
			.lean()
			.exec(function(err, companiesGroup) {
				if(companiesGroup) {
					callback(null, companyGroup_count, companiesGroup);
				} else {
					callback(err);
				}
			});
	}

	function getCompanyGroupLinks(companyGroup_count, companyGroup, callback) {
		companyGroup_len = companyGroup.length;
		companyGroup_counter = 0;
		companyGroup.forEach(function (c) {
			Link.find({company_group: c._id})
				.populate('company')
				.populate('project')
				.exec(function(err, links) {
					++companyGroup_counter;
					link_len = links.length;
					link_counter = 0;
					c.companies = 0;
					c.projects = 0;
					links.forEach(function(link) {
						++link_counter;

						var entity = _.without(link.entities, 'company_group')[0];
						switch (entity) {
							case 'company':
								c.companies += 1;
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
					if(companyGroup_counter == companyGroup_len && link_counter == link_len) {
						res.send({data:companyGroup, count:companyGroup_count});
					}
				});
		});
	}
};
exports.getCompanyGroupByID = function(req, res) {
	var link_counter, link_len;

	async.waterfall([
		getCompanyGroup,
		getTransfers,
		getCompanyGroupLinks,
		getProjectLocation
		//getContracts,
	], function (err, result) {
		if (err) {
			res.send(err);
		}
	});

	function getCompanyGroup(callback) {
		CompanyGroup.findOne({_id:req.params.id})
			.populate('company_group_aliases', '_id alias')
			.populate('company','_id company_name')
			.lean()
			.exec(function(err, companyGroup) {
				if(companyGroup) {
					callback(null, companyGroup);
				} else {
					callback(err);
				}
			});
	}
	function getTransfers(companyGroup, callback) {
		companyGroup.transfers = [];
		Transfer.find({transfer_company: companyGroup._id})
			.populate('transfer_country')
			.populate('transfer_company', '_id company_name')
			.exec(function(err, transfers) {
				_.each(transfers, function(transfer) {
					companyGroup.transfers.push(transfer);
				});
				if(companyGroup) {
					callback(null, companyGroup);
				} else {
					callback(err);
				}
			});
	}
	function getCompanyGroupLinks(companyGroup, callback) {
		//console.log(company);
		Link.find({company_group: companyGroup._id})
			.populate('company','_id company_name')
			.populate('commodity')
			.populate('contract')
			.deepPopulate('project project.proj_country.country project.proj_commodity.commodity ' +
			'concession concession.concession_country.country concession.concession_commodity.commodity')
			//.deepPopulate()
			.exec(function(err, links) {
				link_len = links.length;
				if(link_len>0) {
					link_counter = 0;
					companyGroup.companies = [];
					companyGroup.commodities = [];
					companyGroup.projects = [];
					companyGroup.contracts = [];
					companyGroup.contracts = [];
					companyGroup.concessions = [];
					links.forEach(function (link) {
						++link_counter;
						var entity = _.without(link.entities, 'company_group')[0];
						switch (entity) {
							case 'commodity':
								if (!companyGroup.commodities.hasOwnProperty(link.commodity_code)) {
									companyGroup.commodities.push({
										_id: link.commodity._id,
										commodity_code: link.commodity.commodity_code,
										commodity_name: link.commodity.commodity_name
									})
								}
								break;
							case 'company':
								if (!companyGroup.companies.hasOwnProperty(link.company.company_name)) {
									companyGroup.companies.push({
										_id: link.company._id,
										company_name: link.company.company_name
									});
								}
								break;
							case 'concession':
								if (!companyGroup.concessions.hasOwnProperty(link.concession._id)) {
									companyGroup.concessions.push({
										_id:link.concession._id,
										concession_name: link.concession.concession_name,
										concession_country: _.find(link.concession.concession_country.reverse()).country,
										concession_type: _.find(link.concession.concession_type.reverse()),
										concession_commodities: link.concession.concession_commodity,
										concession_status: link.concession.concession_status
									});
								}
								break;
							case 'contract':
								//if (!company.contracts.hasOwnProperty(link.contract.contract_id)) {
								//    request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + link.contract.contract_id + '/metadata', function (err, res, body) {
								//        if (!err && res.statusCode == 200) {
								//            company.contracts[link.contract.contract_id] = {
								//                contract_name: body.name,
								//                contract_country: body.country,
								//                contract_commodity: body.resource
								//            };
								//        }
								//    });
								//}
								if (!_.contains(companyGroup.contracts, link.contract.contract_id)) {
									companyGroup.contracts.push(link.contract.contract_id);
								}
								break;
							case 'project':
								companyGroup.projects.push(link.project);
								break;

							default:
								console.log(entity, 'link skipped...');
						}
						if (link_counter == link_len) {
							callback(null, companyGroup);
						}
					});
				} else{
					callback(null, companyGroup);
				}
			});
	}
	function getProjectLocation(companyGroup,callback) {
		var project_counter = 0;
		companyGroup.location = [];
		var project_len = companyGroup.projects.length;
		if(project_len>0) {
			companyGroup.projects.forEach(function (project) {
				++project_counter;
				project.proj_coordinates.forEach(function (loc) {
					companyGroup.location.push({
						'lat': loc.loc[0],
						'lng': loc.loc[1],
						'message': "<a href =\'/project/" + project._id + "\'>" + project.proj_name + "</a><br>" + project.proj_name
					});
					if (project_counter == project_len) {
						res.send(companyGroup);
					}
				})
			});
		} else{
			res.send(companyGroup);
		}
	}
};