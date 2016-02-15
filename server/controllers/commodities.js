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

};


