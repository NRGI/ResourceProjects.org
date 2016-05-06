var SourceType 		= require('mongoose').model('SourceType'),
	async           = require('async'),
	_               = require("underscore"),
	request         = require('request'),
	encrypt 		= require('../utilities/encryption');
exports.getSourceTypes = function(req, res) {
	var limit = Number(req.params.limit),
		skip = Number(req.params.skip);

	async.waterfall([
		sourceTypeCount,
		getSourceTypeSet
	], function (err, result) {
		if (err) {
			res.send(err);
		} else{
			res.send(result)
		}
	});

	function sourceTypeCount(callback) {
		SourceType.find({}).count().exec(function(err, sourceType_count) {
			if(sourceType_count) {
				callback(null, sourceType_count);
			} else {
				callback(err);
			}
		});
	}
	function getSourceTypeSet(sourceType_count, callback) {
		SourceType.find(req.query)
			.sort({
				source_type_name: 'asc'
			})
			.skip(skip)
			.limit(limit)
			.lean()
			.exec(function(err, sources) {
				if(sources.length>0) {
					callback({data:sources, count:sourceType_count});
				} else {
					callback(err);
				}
			});
	}
};
exports.getSourceTypeByID = function(req, res) {

	async.waterfall([
		getSource
	], function (err, result) {
		if (err) {
			res.send(err);
		} else{
			res.send(result)
		}
	});

	function getSource(callback) {
		SourceType.findOne({_id:req.params.id})
			.exec(function(err, source) {
				if(source) {
					callback(source);
				} else {
					callback(err);
				}
			});
	}
};
exports.createSourceType = function(req, res, next) {
	var sourceData = req.body;
	SourceType.create(sourceData, function(err, sourceType) {
		if(err){
			res.status(400);
			err = new Error('Error');
			return res.send({ reason: err.toString() })
		} else{
			res.send();
		}
	});
};
exports.updateSourceType = function(req, res) {
	var sourceUpdates = req.body;
	SourceType.findOne({_id:req.body._id}).exec(function(err, sourceType) {
		if(err) {
			res.status(400);
			err = new Error('Error');
			return res.send({ reason: err.toString() });
		}
		sourceType.save(function(err) {
			if (err) {
				err = new Error('Error');
				return res.send({reason: err.toString()});
			} else{
				return res.send();
			}
		})
	});
};
exports.deleteSourceType = function(req, res) {
	SourceType.remove({_id: req.params.id}, function(err) {
		if(!err) {
			res.send();
		}else{
			err = new Error('Error');
			return res.send({ reason: err.toString() });
		}
	});
};