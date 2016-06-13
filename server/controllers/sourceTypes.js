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
        project_list = {},
        country_list = {},
        source_list = {};

    async.waterfall([
        sourceTypeCount,
        getSourceTypeSet,
        getSourceSet,
        getProjectCount,
        getLinkSet
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
                Source.find({source_type_id: source_type._id})
                    .lean()
                    .exec(function(err, sources) {
                        ++source_type_counter;
                        source_len = sources.length;
                        source_counter = 0;
                        source_list[source_type._id] = [];
                        project_list[source_type._id] = [];
                        _.each(sources, function(source) {
                            source_list[source_type._id].push(source._id);
                            ++source_counter;
                        });
                        if(source_type_len == source_type_counter && source_len == source_counter) {
                            callback(null, source_type_count, source_types, source_list, project_list, country_list);
                        }
                    });
            });
        }
    }

    function getProjectCount(source_type_count, source_types, source_list, project_list, country_list, callback) {
        source_len = Object.keys(source_list).length;
        source_counter = 0;
        Object.keys(source_list).forEach(function(key) {
            Project.find({proj_established_source: source_list[key]})
                .select("_id proj_country.country")
                .exec(function(err, projects) {
                    ++source_counter;
                    if(projects) {
                        proj_len = projects.length;
                        proj_counter = 0;
                        _.each(projects, function (proj) {
                            ++proj_counter;
                            project_list[key].push(proj._id);
                            // console.log();
                            // console.log(proj.proj_country);
                            if(proj.proj_country) {
                                country_list[key] = _.pluck(proj.proj_country, "country");
                                // country_list[key].push(_.pluck(proj.proj_country, "country"));
                            }
                        });
                    } else {
                        proj_len = 0;
                        proj_counter = 0;
                    }
                    if(source_type_len == source_type_counter && source_len == source_counter) {
                        callback(null, source_type_count, source_types, source_list, project_list, country_list);
                        // res.send({data:source_types, count:source_type_count});
                    }
                });
        });
    }
    function getLinkSet(source_type_count, source_types, source_list, project_list, country_list, callback) {
        console.log(country_list);
        callback(null, source_type_count, source_types, source_list, project_list, country_list);
        // source_len = Object.keys(source_list).length;
        // source_counter = 0;
        // Object.keys(source_list).forEach(function(key) {
        //     Link.find({proj_established_source: source_list[key]})
        //         .select("_id")
        //         .exec(function(err, projects) {
        //             ++source_counter;
        //             if(projects) {
        //                 proj_len = projects.length;
        //                 proj_counter = 0;
        //                 _.each(projects, function (proj) {
        //                     ++proj_counter;
        //                     project_list[key].push(proj._id);
        //                 });
        //             } else {
        //                 proj_len = 0;
        //                 proj_counter = 0;
        //             }
        //             if(source_type_len == source_type_counter && source_len == source_counter) {
        //                 callback(null, source_type_count, source_types, source_list, project_list);
        //                 // res.send({data:source_types, count:source_type_count});
        //             }
        //         });
        // });
    }
    function getFinalCounts (source_type_count, source_types, source_list, project_list, country_list, callback) {
        // source_type.sources = _.uniq(source_type.sources);
        res.send({data:source_types, count:source_type_count});
    }
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