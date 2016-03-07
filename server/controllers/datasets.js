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
    Dataset.findByIdAndUpdate(
        datasetRef,
        {$push: {"actions": {name: req.body.name, started: Date.now(), status: "Started"/* TODO: uncomment once working//, started_by: req.user._id*/}}},
        {safe: true, upsert: false},
        function(err, model) {
            if (!err) {
                res.status(200);
                res.send();
                if (req.body.name == "Extract from Google Sheets") {
                    console.log("Starting import from " + model);
                    request({
                        url: model.source_url,
                        json: true
                    }, function (error, response, body) {
                        if (!error && response.statusCode === 200) {
                            console.log(body);
                         }
                    })
                }
            }
            else {
                res.status(400);
                console.log(err);
	            return res.send({reason:err.toString()})
            }  
        }
    ); 
    //TODO: Perform the action
    //TODO: Perform following actions
	
}