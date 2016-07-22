var Transfer 		= require('mongoose').model('Transfer'),
    // Country 		= require('mongoose').model('Country'),
    // Source	 		= require('mongoose').model('Source'),
    // Link 	        = require('mongoose').model('Link'),
    // Production 	    = require('mongoose').model('Production'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getTransfers = function(req, res) {
    var transfer_len, transfer_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        TransferCount,
        getTransferSet,
        // getProjectLinks,
        // getTransfersCount,
        // getProductionCount,
        // getVerified
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
    function TransferCount(callback) {
        Transfer.find({}).count().exec(function(err, transfer_count) {
            //console.log(transfer_count);
            if(transfer_count) {
                callback(null, transfer_count);
            } else {
                callback(err);
            }
        });
    }
    function getTransferSet(transfer_count, callback) {
        Transfer.find({})
            .sort({
                proj_name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .populate('country', '_id iso2 name')
            .populate('company', ' _id company_name')
            .populate('source source', '_id source_name source_url source_date source_type_id')
            // .deepPopulate('source.source_type_id', '_id source_name source_url source_date source_type_id')
            .lean()
            .exec(function(err, transfers) {
                if(transfers.length>0) {
                    //TODO clean up returned data if we see performance lags
                    // callback(null, transfer_count, projects);
                    res.send({data: transfers, count: transfer_count});
                } else {
                    res.send({data: transfers, count: transfer_count});
                }
            });
    }
};