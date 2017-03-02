var Source 		= require('mongoose').model('Source'),
	User 		= require('mongoose').model('User'),
	Link 	    = require('mongoose').model('Link'),
	mongoose 	= require('mongoose'),
	async       = require('async'),
	_           = require("underscore"),
	errors 		= require('./errorList'),
	request     = require('request');

// Get all sources
exports.getSources = function(req, res) {
	var data = {},
		limit = Number(req.params.limit),
		skip = Number(req.params.skip);
	data.sources = [];
	data.count = 0;
	data.errorList = [];
	if(req.query.source_type_id){req.query.source_type_id =mongoose.Types.ObjectId(req.query.source_type_id)}

	async.waterfall([
		sourceCount,
		getSourceSet
	], function (err, result) {
		if (err) {
			res.send(err);
		} else{
			if (req.query && req.query.callback) {
				return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
			} else {
				return res.send(result);
			}
		}
	});

	function sourceCount(callback) {
		Source.find(req.query).count().exec(function(err, sourcesCount) {
			if (err) {
				data.errorList = errors.errorFunction(err,'Sources');
				return res.send(data);
			} else if (sourcesCount == 0) {
				data.errorList = errors.errorFunction('Sources','sources not found');
			} else {
				data.count = sourcesCount;
				callback(null, data);
			}
		});
	}
	function getSourceSet(data, callback) {
		Source.aggregate([
			{$match:req.query},
			{$lookup: {from: "sourcetypes", localField: "source_type_id", foreignField: "_id", as: "source_type_id"}},
			{$unwind: {"path": "$source_type_id", "preserveNullAndEmptyArrays": true}},
			{$group:{
				"_id": "$_id",
				"source_name":{$first:"$source_name"},
				"source_url":{$first:"$source_url"},
				"source_archive_url":{$first:"$source_archive_url"},
				"retrieve_date":{$first:"$retrieve_date"},
				"source_date":{$first:"$source_date"},
				"source_type_id":{$first:"$source_type_id"}
			}},
			{$sort: {source_name: -1}},
			{$skip: skip},
			{$limit: limit}
		]).exec(function(err, sources) {
				if (err) {
					data.errorList = errors.errorFunction(err,'Sources');
					callback(null, data);
				}
				else {
					if (sources.length > 0) {
						data.sources = sources;
						callback(null, data);
					} else {
						data.errorList.push({type: 'Sources', message: 'sources not found'})
						res.send(data);
					}
				}
			});
	}
};

//Get source by ID
exports.getSourceByID = function(req, res) {
	var data = {};
	data.errorList= [];
	data.source= [];

	async.waterfall([
		getSource
	], function (err, result) {
		if (err) {
			data.errorList = errors.errorFunction(err,'Source ' + req.params.id);
			return res.send(data);
		} else{
			if (req.query && req.query.callback) {
				return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
			} else {
				return res.send(result);
			}
		}
	});

	function getSource(callback) {
		Source.aggregate([
			{$match:{_id: mongoose.Types.ObjectId(req.params.id)}},
			{$unwind: {"path": "$create_author", "preserveNullAndEmptyArrays": true}},
			{$lookup: {from: "sourcetypes", localField: "source_type_id", foreignField: "_id", as: "source_type_id"}},
			{$lookup: {from: "users", localField: "create_author", foreignField: "_id", as: "create_author"}},
			{$unwind: {"path": "$source_type_id", "preserveNullAndEmptyArrays": true}},
			{$unwind: {"path": "$create_author", "preserveNullAndEmptyArrays": true}},
			{$group:{
				"_id": "$_id",
				"source_name":{$first:"$source_name"},
				"source_notes":{$first:"$source_notes"},
				"source_url":{$first:"$source_url"},
				"source_archive_url":{$first:"$source_archive_url"},
				"retrieve_date":{$first:"$retrieve_date"},
				"source_date":{$first:"$source_date"},
				"create_date":{$first:"$create_date"},
				"source_type_id":{$first:"$source_type_id"},
				"create_author":{$first:"$create_author"}
			}},
			{
				$project: {
					_id: 1, source_name: 1, source_notes: 1, source_url: 1, source_archive_url: 1,
					retrieve_date: 1, source_date: 1, create_date: 1, source_type_id: 1,
					create_author: {
						$cond: {
							if: {$not: "$create_author"}, then: null,
							else: {
								_id: "$create_author._id", first_name: "$create_author.first_name",
								last_name: "$create_author.last_name"
							}
						}
					}
				}
			}
		]).exec(function(err, source) {
			if (err) {
				data.errorList = errors.errorFunction(err,'Source ' + req.params.id);
				res.send(data);
			} else if (source.length>0) {
				data.source = source[0];
				callback(null, data);
			} else {
				data.errorList.push({type: 'Source', message: 'source ' + req.params.id + ' not found'})
				res.send(data);
			}
		});
	}
};

