var SourceType 		= require('mongoose').model('SourceType'),
    Source   		= require('mongoose').model('Source'),
    Project   		= require('mongoose').model('Project'),
    Link 	        = require('mongoose').model('Link'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request'),
    encrypt 		= require('../utilities/encryption');
exports.getSourceTypes = function(req, res) {
    var limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    var project_id = [];
    async.waterfall([
        sourceTypeCount,
        getProjects,
        getLinkProjects,
        getSourceTypeSet
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
    function getProjects(source_type_count, callback) {
        var sources = [];
        Project.find({})
            .select("_id proj_country.country proj_country.source proj_established_source")
            .populate('proj_established_source')
            .exec(function(err, projects) {
                if(projects.length>0) {
                    _.map(_.groupBy(projects,function(doc){
                        if(doc.proj_established_source!=undefined && doc.proj_established_source!=null) {
                            return doc.proj_established_source.source_type_id;
                        }
                    }),function(grouped){
                        if(grouped[0].proj_established_source!=undefined && grouped[0].proj_established_source!=null && grouped[0].proj_established_source.source_type_id!=undefined && grouped[0].proj_established_source.source_type_id!=null) {
                            sources.push({
                                '_id': grouped[0].proj_established_source.source_type_id,
                                'source_id': grouped[0].proj_established_source._id,
                                'count': grouped.length

                            })
                        }
                        return sources;
                    });
                    callback(null, source_type_count, sources);
                } else {
                    callback(null, source_type_count, []);
                }
            });
    }
    function getLinkProjects(source_type_count,sources, callback) {
        var link =[];
        Link.find({'entities':'project'})
            .select("source project.proj_country.country project.proj_country.source project.proj_established_source")
            .populate('proj_established_source source project company concession site contract')
            .exec(function(err, links) {
                if(links.length>0) {
                    link = _.map(_.groupBy(links,function(doc){
                        if(doc.project!=undefined && doc.project!= null
                            && doc.project.proj_established_source!=undefined
                            && doc.project.proj_established_source!=null) {
                            return doc.project.proj_established_source.source_type_id;
                        }
                    }),function(grouped){
                        if(grouped[0].project!=undefined && grouped[0].project!= null
                            && grouped[0].project.proj_established_source!=undefined
                            && grouped[0].project.proj_established_source!=null
                            && grouped[0].project.proj_established_source.source_type_id!=undefined
                            && grouped[0].project.proj_established_source.source_type_id!=null) {
                            sources.push({
                                '_id': grouped[0].project.proj_established_source.source_type_id,
                                'source_id': grouped[0].project.proj_established_source._id,
                                'count': grouped.length
                            })
                        }
                        return sources;
                    });
                    callback(null, source_type_count, sources);
                } else {
                    callback(null, source_type_count, sources);
                }
            });
    }
    function getSourceTypeSet(source_type_count,sources, callback) {
        SourceType.find({})
            .sort({
                source_type_name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(function(err, source_types) {
                if(source_types.length>0) {
                    source_types = _.map(source_types, function (source_type) {
                        source_type.project_count = 0
                        _.each(sources, function (source) {
                            if (source._id.toString() == source_type._id.toString()) {
                                source_type.project_count = source_type.project_count + source.count;
                            }
                        })
                        return source_type;
                    });
                    callback(null, {data: source_types, count: source_type_count});
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