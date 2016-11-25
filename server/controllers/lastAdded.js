//For now not used



//var Project 		= require('mongoose').model('Project'),
//    Country 		= require('mongoose').model('Country'),
//    Source	 		= require('mongoose').model('Source'),
//    Link 	        = require('mongoose').model('Link'),
//    Transfer 	    = require('mongoose').model('Transfer'),
//    Production 	    = require('mongoose').model('Production'),
//    async           = require('async'),
//    _               = require("underscore"),
//    request         = require('request');
//
//exports.getLastAdded = function(req, res) {
//
//    async.waterfall([
//        projectCount,
//        sourceCount,
//        getLastProjects,
//        getLastSources
//    ], function (err, result) {
//        if (err) {
//            res.send(err);
//        } else {
//            if (req.query && req.query.callback) {
//                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
//            } else {
//                return res.send(result);
//            }
//        }
//    });
//    function projectCount(callback) {
//        Project.find({}).count().exec(function(err, project_count) {
//            if(project_count) {
//                callback(null, project_count);
//            } else {
//                callback(err);
//            }
//        });
//    }
//    function sourceCount(project_count, callback) {
//        Source.find({}).count().exec(function(err, source_count) {
//            if(source_count) {
//                callback(null, project_count, source_count);
//            } else {
//                callback(err);
//            }
//        });
//    }
//    function getLastProjects(project_count, source_count,callback) {
//        Project.find({})
//            .skip(project_count-10)
//            .deepPopulate('proj_established_source.source_type_id')
//            .exec(function (err, projects) {
//                if(projects.length>0){
//                    projects = projects.reverse()
//                }
//                callback(null, source_count,projects);
//            });
//
//    }
//    function getLastSources(source_count,projects, callback) {
//        Source.find({})
//            .skip(source_count-10)
//            .exec(function (err, sources) {
//                if(sources.length>0){
//                    sources = sources.reverse()
//                }
//                callback(null, {sources:sources, projects:projects});
//            });
//    }
//};