// DO NOT MERGE TO PRODUCTION! FOR STAGING USE ONLY!

var Project 		= require('mongoose').model('Project'),
    Source	 		= require('mongoose').model('Source'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    Contract 	    = require('mongoose').model('Contract'),
    Site 	        = require('mongoose').model('Site'),
    Concession 	    = require('mongoose').model('Concession'),
    Company 	    = require('mongoose').model('Company'),
    CompanyGroup 		= require('mongoose').model('CompanyGroup'),
    Dataset 		= require('mongoose').model('Dataset'),
    Duplicate		= require('mongoose').model('Duplicate'),
    Action 		    = require('mongoose').model('Action'),
    ImportSource    = require('mongoose').model('ImportSource'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.destroy = function(req, res) {
    var models = [
        {name: 'Source'},
        {name: 'Link'},
        {name: 'Transfer'},
        {name: 'Production'},
        {name: 'Contract'},
        {name: 'Site'},
        {name: 'Concession'},
        {name: 'Company'},
        {name: 'CompanyGroup'},
        {name: 'Dataset'},
        {name: 'Duplicate'},
        {name: 'ImportSource'},
        {name: 'Action'},
        {name: 'Project'}
    ];

    var companies = {};
    companies.companies = [];
    companies.query = [];
    var models_len, models_counter = 0;
    async.waterfall([
        destroyAllData
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
    function destroyAllData(callback){
        models_counter=0;
        models_len = models.length;
        _.each(models, function(model) {
            var name = require('mongoose').model(model.name);
            name.find({}).remove({}, function(err) {
                    if (err) {
                        console.log(err)
                    } else {
                        models_counter++;

                        if(models_counter==models_len){
                            callback(null, 'success');
                        }
                    }
                }
            );
        });
    }
}
