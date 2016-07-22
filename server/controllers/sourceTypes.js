var SourceType 		= require('mongoose').model('SourceType'),
    Source   		= require('mongoose').model('Source'),
    Project   		= require('mongoose').model('Project'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request'),
    encrypt 		= require('../utilities/encryption');
exports.getSourceTypes = function(req, res) {
    var limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        sourceTypeCount,
        getSourceTypeSet,
        getSourceSet,
        getProjectCount,
        getFinalCounts
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
            var source_type_len = source_types.length;
            var source_type_counter = 0;
            _.each(source_types, function(source_type) {
                source_types.sources =[];
                var sources_list =[];
                Source.find({source_type_id: source_type._id})
                    .lean()
                    .exec(function(err, sources) {
                        ++source_type_counter;
                        var source_len = sources.length;
                        var source_counter = 0;
                        _.each(sources, function(source) {
                            sources_list.push({_id:source._id});
                            ++source_counter;
                        });
                        sources_list = _.map(_.groupBy(sources_list,function(doc){
                            return doc._id;
                        }),function(grouped){
                            return grouped[0];
                        });
                        source_type.sources = sources_list
                        if(source_type_len == source_type_counter && source_len == source_counter) {
                            callback(null, source_type_count, source_types);
                        }
                    });
            });
        }
    }

    function getProjectCount(source_type_count, source_types, callback) {
        var source_types_len = source_types.length;
        var source_types_counter = 0;
        if(source_types_len>0) {
            _.each(source_types, function (source_type) {
                source_type.project_count = 0;
                source_type.country_count = 0;
                var country = [];
                if(source_type.sources.length>0) {

                    var source_len = source_type.sources.length;
                    var source_counter = 0;
                    _.each(source_type.sources, function (source) {
                        Project.find({proj_established_source: source._id})
                            .select("_id proj_country.country")
                            .exec(function (err, projects) {
                                if(source_counter==0) {
                                    ++source_types_counter;
                                }
                                ++source_counter;
                                if (projects) {
                                    projects = _.map(_.groupBy(projects, function (doc) {
                                        return doc._id;
                                    }), function (grouped) {
                                        return grouped[0];
                                    });
                                    var proj_len = projects.length;
                                    var proj_count = 0;
                                    source_type.project_count = source_type.project_count + proj_len;
                                    _.each(projects, function (proj) {
                                        proj_count++;
                                        if (proj.proj_country) {
                                            country.push(proj.proj_country[0]);
                                        }
                                    });
                                    if(proj_len==proj_count){
                                        if(country!=undefined) {
                                            country = _.map(_.groupBy(country, function (doc) {
                                                return doc.country;
                                            }), function (grouped) {
                                                return grouped[0];
                                            });
                                            source_type.country_count = country.length;
                                        }
                                    }
                                    if (source_types_len == source_types_counter&&source_len == source_counter) {
                                        callback(null, source_type_count, source_types);
                                    }
                                }
                            })
                    });
                } else{
                    source_types_counter++;
                    if (source_types_len == source_types_counter) {
                        callback(null, source_type_count, source_types);
                    }
                }
            });
        } else{
            callback(null, source_type_count, source_types);
        }
    }
    function getFinalCounts (source_type_count, source_types, callback) {
        callback(null, {data:source_types, count:source_type_count});
    }
};
exports.getSourceTypeByID = function(req, res) {

    async.waterfall([
        getSource
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