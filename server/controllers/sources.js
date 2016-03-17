var Source 		= require('mongoose').model('Source'),
	User 		= require('mongoose').model('User'),
	Link 	        = require('mongoose').model('Link'),
	async           = require('async'),
	_               = require("underscore"),
	request         = require('request'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getSources = function(req, res) {
	var source_len, link_len, source_counter, link_counter,
		limit = Number(req.params.limit),
		skip = Number(req.params.skip);

	async.waterfall([
		sourceCount,
		getSourceSet,
		getSourceLinks
	], function (err, result) {
		if (err) {
			res.send(err);
		}
	});

	function sourceCount(callback) {
		Source.find({}).count().exec(function(err, source_count) {
			if(source_count) {
				callback(null, source_count);
			} else {
				callback(err);
			}
		});
	}
	function getSourceSet(source_count, callback) {
		Source.find(req.query)
			.sort({
				source_name: 'asc'
			})
			.skip(skip)
			.limit(limit)
			.lean()
			.exec(function(err, sources) {
				if(sources) {
					callback(null, source_count, sources);
				} else {
					callback(err);
				}
			});
	}
	function getSourceLinks(source_count, sources, callback) {
		source_len = sources.length;
		source_counter = 0;
		sources.forEach(function (c) {
			Link.find({source: c._id})
				.populate('project')
				.exec(function(err, links) {
					++source_counter;
					link_len = links.length;
					link_counter = 0;
					c.projects = 0;
					links.forEach(function(link) {
						++link_counter;
						if(link.entities.indexOf('project')===0){
							c.projects += 1;
						}
					});
					if(source_counter == source_len && link_counter == link_len) {
						res.send({data:sources, count:source_count});
					}
				});
		});
	}
};
exports.getSourceByID = function(req, res) {

	async.waterfall([
		getSource
	], function (err, result) {
		if (err) {
			res.send(err);
		}
	});

	function getSource(callback) {
		Source.findOne({_id:req.params.id})
			.populate('create_author', ' _id first_name last_name')
			.lean()
			.exec(function(err, source) {
				if(source) {
					callback(null, source);
					res.send(source);
				} else {
					callback(err);
				}
			});
	}
};
exports.createSource = function(req, res, next) {
	var sourceData = req.body;
	Source.create(sourceData, function(err, source) {
		if(err){
			res.status(400);
			err = new Error('Error');
			return res.send({ reason: err.toString() })
		} else{
			res.send();
		}
	});
};
exports.updateSource = function(req, res) {
	var sourceUpdates = req.body;
	Source.findOne({_id:req.body._id}).exec(function(err, source) {
		if(err) {
			res.status(400);
			err = new Error('Error');
			return res.send({ reason: err.toString() });
		}
		source.source_name= sourceUpdates.source_name;
		source.source_type= sourceUpdates.source_type;
		source.source_type_id= sourceUpdates.source_type_id;
		source.source_url= sourceUpdates.source_url;
		source.source_archive_url= sourceUpdates.source_archive_url;
		source.source_notes= sourceUpdates.source_notes;
		source.create_author= sourceUpdates.create_author;
		source.retrieve_date= sourceUpdates.retrieve_date;
		source.save(function(err) {
			if (err) {
				err = new Error('Error');
				return res.send({reason: err.toString()});
			} else{
				return res.send();
			}
		})
	});
};
exports.deleteSource = function(req, res) {
	Source.remove({_id: req.params.id}, function(err) {
		if(!err) {
			res.send();
		}else{
			err = new Error('Error');
			return res.send({ reason: err.toString() });
		}
	});
};