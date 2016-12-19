var SourceType 		= require('mongoose').model('SourceType'),
    Source   		= require('mongoose').model('Source'),
    Project   		= require('mongoose').model('Project'),
    Link 	        = require('mongoose').model('Link'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request'),
    errors 	        = require('./errorList');

//Get all source types
exports.getSourceTypes = function(req, res) {
    var data = {},
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);
    data.sourceTypes = [];
    data.count =0;
    data.errorList =[];

    async.waterfall([
        sourceTypeCount,
        getSourceTypeSet
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Source Types');
            return res.send(data);
        } else{
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });

    function sourceTypeCount(callback) {
        SourceType.find({}).count().exec(function(err, sourceTypesCount) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Source Types');
                res.send(data);
            } else if (sourceTypesCount == 0) {
                data.errorList = errors.errorFunction('Source Types','source types not found');
                res.send(data);
            } else {
                data.count = sourceTypesCount;
                callback(null, data);
            }
        });
    }

    function getSourceTypeSet(data, callback) {
        if(limit == 0){limit = data.count}
        SourceType.aggregate([
            {$sort: {source_type_authority: -1}},
            {$skip: skip},
            {$limit: limit}
        ]).exec(function(err, sourceTypes) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Source Types');
                res.send(data);
            } else {
                if (sourceTypes.length>0) {
                    data.sourceTypes = sourceTypes;
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Source Types', message: 'source types not found'})
                    res.send(data);
                }
            }
        });
    }
};

//Get source type by ID
exports.getSourceTypeByID = function(req, res) {
    var data = {};
    data.errorList = [];
    data.source = [];

    async.waterfall([
        getSource
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Source Types');
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
        SourceType.findOne({_id:req.params.id})
            .exec(function(err, source) {
                if (err) {
                    data.errorList = errors.errorFunction(err,'Source Types');
                    res.send(data);
                } else if (source) {
                    data.source = source;
                    callback(data);
                } else {
                    data.errorList.push({type: 'Source Types', message: 'source types not found'})
                    res.send(data);
                }
            });
    }
};

//Create new source type
exports.createSourceType = function(req, res) {
    var sourceData = req.body;
    SourceType.create(sourceData, function(err) {
        if(err){
            res.status(400);
            err = new Error('Error');
            return res.send({ reason: err.toString() })
        } else{
            res.send();
        }
    });
};

//Update source type
exports.updateSourceType = function(req, res) {
    SourceType.findOne({_id:req.body._id}).exec(function(err, sourceType) {
        if(err) {
            res.status(400);
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
        sourceType.source_type_name=req.body.source_type_name;
        sourceType.source_type_id=req.body.source_type_id;
        sourceType.source_type_display=req.body.source_type_display;
        sourceType.source_type_authority=req.body.source_type_authority;
        sourceType.source_type_examples=req.body.source_type_examples;
        sourceType.source_type_url_type=req.body.source_type_url_type;
        sourceType.source_type_notes=req.body.source_type_notes;
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

//Delete source type
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