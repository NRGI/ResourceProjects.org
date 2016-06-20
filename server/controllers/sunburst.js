var Source	 		= require('mongoose').model('Source'),
    Transfer 	    = require('mongoose').model('Transfer'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getPayments = function(req, res) {
    async.waterfall([
        getPayment
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getPayment(callback) {
        Transfer.find({})
            .populate('source country project')
            .deepPopulate('source.source_type_id')
            .exec(function (err, transfers) {
                callback(null, {data:transfers})
            });
    }
};