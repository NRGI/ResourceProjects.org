var SourceType 		= require('mongoose').model('SourceType'),
    Source   		= require('mongoose').model('Source'),
    Project   		= require('mongoose').model('Project'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request'),
    encrypt 		= require('../utilities/encryption');
exports.getSourceTypes = function(req, res) {
    var limit = Number(req.params.limit),
        skip = Number(req.params.skip),
        projects = [];

    async.waterfall([
        sourceTypeCount,
        getSourceTypeSet,
        getSourceSet,
        getProjectCount
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });

    function sourceTypeCount(callback) {
        SourceType.find({}).count().exec(function(err, source_type_count) {
            if(source_type_count) {
                callback(null, source_type_count);
            } else {
                callback(err);
            }
        });
    }
    function getSourceTypeSet(source_type_count, callback) {
        SourceType.find({})
            .sort({
                source_type_name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(function(err, source_types) {
                if(source_types.length>0) {
                    callback(null, source_type_count, source_types);
                } else {
                    callback(err);
                }
            });
    }
    function getSourceSet(source_type_count, source_types, callback) {
        if(source_types.length > 0) {
            source_type_len = source_types.length;
            source_type_counter = 0;
            _.each(source_types, function(source_type) {
                source_type.sources = [];
                Source.find({source_type_id: source_type._id})
                    .lean()
                    .exec(function(err, sources) {
                        ++source_type_counter;
                        source_len = sources.length;
                        source_counter = 0;
                        _.each(sources, function(source) {
                            source_type.sources.push(source._id);
                            ++source_counter;
                        });
                        if(source_type_len == source_type_counter && source_len == source_counter) {
                            callback(null, source_type_count, source_types);
                        }
                    });
            });
        }
    }

    function getProjectCount(source_type_count, source_types, callback) {
        if(source_types.length > 0) {
            source_type_len = source_types.length;
            source_type_counter = 0;
            _.each(source_types, function (source_type) {
                source_type.project_count = 0;
                if (source_type.sources.length > 0) {
                    ++source_type_counter;
                    source_type.sources = _.uniq(source_type.sources);
                    _.each(source_type.sources, function (source) {
                        Project.find({proj_established_source: source})
                            // .select("_id")
                            .exec(function (projects) {
                                // console.log(source);
                                console.log(projects);
                            });
                    });
                }
            });
        }
        
        
        res.send({data:source_types, count:source_type_count});

    }
    // function getSourceLinks(source_count, sources, callback) {
    //     source_len = sources.length;
    //     source_counter = 0;
    //     sources.forEach(function (c) {
    //         Link.find({source: c._id})
    //             .populate('project')
    //             .exec(function(err, links) {
    //                 ++source_counter;
    //                 link_len = links.length;
    //                 link_counter = 0;
    //                 c.projects = 0;
    //                 links.forEach(function(link) {
    //                     ++link_counter;
    //                     if(link.entities.indexOf('project')===0){
    //                         c.projects += 1;
    //                     }
    //                 });
    //                 if(source_counter == source_len && link_counter == link_len) {
    //                     res.send({data:sources, count:source_count});
    //                 }
    //             });
    //     });
    // }
//    get #projects
//    get #countries
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