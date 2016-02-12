var CompanyGroup 		= require('mongoose').model('CompanyGroup'),
	Link 	        = require('mongoose').model('Link'),
	Country			= require('mongoose').model('Country'),
	async           = require('async'),
	_               = require("underscore"),
	request         = require('request'),
	encrypt 	= require('../utilities/encryption');
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
	CompanyGroup.findOne({_id:req.params.id}).exec(function(err, companyGroup) {
		res.send(companyGroup);
	});
};