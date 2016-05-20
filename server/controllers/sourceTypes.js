var SourceType 		= require('mongoose').model('SourceType'),
	async           = require('async'),
	_               = require("underscore"),
	request         = require('request'),
	encrypt 		= require('../utilities/encryption');
exports.getSourceTypes = function(req, res) {
	var limit = Number(req.params.limit),
		skip = Number(req.params.skip),
		display = req.params.display,
		query ={};

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
		if(display==='true'){
			query={source_type_display:true}
		}
		SourceType.find(query).count().exec(function(err, sourceType_count) {
			if(sourceType_count) {
				callback(null, sourceType_count);
			} else {
				callback(err);
			}
		});
	}
	function getSourceTypeSet(sourceType_count, callback) {

		if(display==='true'){
			query={source_type_display:true}
		}
		SourceType.find(query)
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
		sourceType.source_type_name=sourceUpdates.source_type_name;
		sourceType.source_type_id=sourceUpdates.source_type_id;
		sourceType.source_type_display=sourceUpdates.source_type_display;
		sourceType.source_type_authority=sourceUpdates.source_type_authority;
		sourceType.source_type_examples=sourceUpdates.source_type_examples;
		sourceType.source_type_url_type=sourceUpdates.source_type_url_type;
		sourceType.source_type_notes=sourceUpdates.source_type_notes;
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