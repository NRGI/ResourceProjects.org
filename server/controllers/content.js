var AboutPage	 	= require('mongoose').model('AboutPage'),
    GlossaryPage	= require('mongoose').model('GlossaryPage'),
    LandingPage 	= require('mongoose').model('LandingPage'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getAboutPage = function(req, res) {
    async.waterfall([
        getContent
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getContent(callback) {
        AboutPage.find({_id:'57639b9e2b50bbd70c2ff252'})
            .exec(function (err, content) {
                if(content.length>0){
                    callback(null, content[0])
                } else{
                    callback(null, content)
                }
            });
    }
};
exports.updateAboutPage = function(req, res) {
    var aboutPageUpdates = req.body;
    AboutPage.findOne({_id:req.body._id}).exec(function(err, content) {
        if(err) {
            err = new Error('Error');
            res.status(400);
            return res.send({ reason: err.toString() });
        }
        content.about_text = aboutPageUpdates.about_text;

        content.save(function(err) {
            if(err) {
                err = new Error('Error');
                return res.send({reason: err.toString()});
            } else{
                res.send(content);
            }
        })
    });
};
exports.getGlossaryPage = function(req, res) {
    async.waterfall([
        getContent
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function getContent(callback) {
        GlossaryPage.find({_id:'57639b9e2b50bbd70c2ff251'})
            .exec(function (err, content) {
                if(content.length>0){
                    callback(null, content[0])
                } else{
                    callback(null, content)
                }
            });
    }
};
exports.updateGlossaryPage = function(req, res) {
    var glossaryPageUpdates = req.body;
    GlossaryPage.findOne({_id:req.body._id}).exec(function(err, content) {
        if(err) {
            err = new Error('Error');
            res.status(400);
            return res.send({ reason: err.toString() });
        }
        content.glossary_text = glossaryPageUpdates.glossary_text;

        content.save(function(err) {
            if(err) {
                err = new Error('Error');
                return res.send({reason: err.toString()});
            } else{
                res.send(content);
            }
        })
    });
};
exports.getLandingPage = function(req, res) {
    async.waterfall([
        getContent
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function getContent(callback) {
        LandingPage.find({_id:'57639b9e2b50bbd70c2ff251'})
            .exec(function (err, content) {
                if(content.length>0){
                    callback(null, content[0])
                } else{
                    callback(null, content)
                }
            });
    }
};
exports.updateGlossaryPage = function(req, res) {
    var landingPageUpdates = req.body;
    LandingPage.findOne({_id:req.body._id}).exec(function(err, content) {
        if(err) {
            err = new Error('Error');
            res.status(400);
            return res.send({ reason: err.toString() });
        }
        content.landing_text = landingPageUpdates.landing_text;

        content.save(function(err) {
            if(err) {
                err = new Error('Error');
                return res.send({reason: err.toString()});
            } else{
                res.send(content);
            }
        })
    });
};