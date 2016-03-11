var Dataset 		= require('mongoose').model('Dataset'),
    Action 		    = require('mongoose').model('Action'),
    async           = require('async'),
    _               = require("underscore"),
    googlesheets    = require('../dataprocessing/googlesheets.js');

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
            .populate('actions')
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
    Dataset.findOne({_id:req.params.id})
        .populate('created_by')
        .populate('actions.started_by')
        .lean()
        .exec(function(err, dataset) {
            if(dataset) {
                res.send(dataset);
            } else {
                res.send(err);
        }
    });
};

exports.createDataset = function(req, res, next) {
	var datasetData = req.body;
	//TODO: uncomment once working //datasetData.created_by = req.user._id;

	Dataset.create(datasetData, function(err, dataset) {
		if(err){
			res.status(400)
			return res.send({reason:err.toString()})
		}
	});
	res.send();
};

exports.createAction = function(req, res, next) {
    var datasetRef = req.params['id'];
    console.log("STUB: Start an action for dataset " + datasetRef)
    //Create the action and set status "running"
    Action.create(
        {name: req.body.name, started: Date.now(), status: "Started"/* TODO: uncomment once working//, started_by: req.user._id*/},
        function(err, model) {
            if (err) {
                res.status(400);
                console.log(err);
	            return res.send({reason:err.toString()})
            }
            Dataset.findByIdAndUpdate(
                datasetRef,
                {$push: {"actions": model._id}},
                {safe: true, upsert: false},
                function(err, dmodel) {
                    if (!err) {
                        if (req.body.name == "Extract from Google Sheets") {
                            console.log("Starting import from " + dmodel.name);
                            res.status(200);
                            res.send();
                            console.log("Triggered, res sent\n");
                            googlesheets.processData(dmodel.source_url, function(status, report) {
                                console.log("process finished");
                                console.log("Status: " + status + "\n");
                                console.log("Report: " + report + "\n");
                                Action.findByIdAndUpdate(
                                    model._id,
                                    {finished: Date.now(), status: status, details: report},
                                    {safe: true, upsert: false},
                                    function(err, amodel) {
                                        if (err) console.log("Failed to update an action: " + err);
                                    }
                                );
                            });
                        }
                    }
                    else {
                        res.status(400);
                        console.log(err);
                        return res.send({reason:err.toString()})
                    }  
                }
            );
        }
    ); 
    //TODO: Perform the action
    //TODO: Perform following actions
}