var Dataset 		= require('mongoose').model('Dataset'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getDatasets = function(req, res) {
    var dataset_len, limit = null, skip = 0;
    
    if (req.params.limit) limit = Number(req.params.limit);
    if (req.params.skip) skip = Number(req.params.skip);

    async.waterfall([
        datasetCount,
        getAllDatasets
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });

    function datasetCount(callback) {
        Dataset.find({}).count().exec(function(err, dataset_count) {
            if(dataset_count) {
                callback(null, dataset_count);
            } else {
                callback(err);
            }
        });
    }

    function getAllDatasets(dataset_count, callback) {
        Dataset.find(req.query)
            .sort({
                created: 'desc'
            })
            .skip(skip)
            .limit(limit)
            .populate('created_by')
            .populate('actions.started_by')
            .lean()
            .exec(function(err, datasets) {
                if(datasets) {
                    res.send({data:datasets, count:dataset_count});
                } else {
                    callback(err);
                }
            });
    }
};


exports.getDatasetByID = function(req, res) {
    async.waterfall([
        getDataset
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });

    function getDataset(callback) {
        Dataset.findOne({_id:req.params.id})
            .populate('created_by')
            .populate('actions.started_by')
            .lean()
            .exec(function(err, dataset) {
                if(dataset) {
                    res.send(dataset);
                } else {
                    callback(err);
                }
            });
    }
};