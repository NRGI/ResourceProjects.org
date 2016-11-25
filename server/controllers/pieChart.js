var Source	 		= require('mongoose').model('Source'),
    Transfer 	    = require('mongoose').model('Transfer'),
    async           = require('async'),
    _               = require("underscore"),
    errors 		    = require('./errorList'),
    request         = require('request');


//Get Pie chart
exports.getPayments = function(req, res) {

    var paymentsFilter={};
    if(req.query.transfer_year){req.query.transfer_year = parseInt(req.query.transfer_year);}
    req.query.transfer_value={$gt: 0};

    async.waterfall([
        getAllPayment,
        getPayment
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

    function getAllPayment(callback) {
        Transfer.aggregate([
            {$match:{transfer_level:{ $nin: [ 'country' ] }}}
        ]).exec(function (err, transfers) {
            if (err) {
                err = new Error('Error: '+ err);
                return res.send({error: err.toString()});
            } else if (transfers.length>0) {
                paymentsFilter.year_selector=_.countBy(transfers, "transfer_year");
                paymentsFilter.currency_selector=_.countBy(transfers, "transfer_unit");
                callback(null, paymentsFilter);
            } else {
                return res.send({error: 'not found'});
            }
        })
    }

    function getPayment(paymentsFilter,callback) {
        Transfer.aggregate([
            {$match:req.query},
            {$lookup: {from: "countries",localField: "country",foreignField: "_id",as: "country"}},
            {$unwind: "$country"},
            { $project: {
                country:1,
                transfer_value:1
            }},
            {$group:{
                _id: '$country._id',
                name: {$first:'$country.name'},
                transfers_value:{$sum:'$transfer_value'},
                total_value:{$push:'$transfer_value'},
                count:{$sum:1}
            }},
            {$unwind: "$transfers_value"},
            { $project: {
                children:{
                    key:"$name",
                    value:{$divide:['$transfers_value',1000000]},
                    y:'$count'},
                count:1,
                total_value:  {$divide:['$transfers_value',1000000]}}
            },
            {$group:{
                _id: null,
                total_value:{$sum:'$total_value'},
                children:{$addToSet:'$children'},
                count:{$sum:'$count'}
            }},
            { $project: {
                total_value:1,children:1,
                count:1
            }
            }
        ]).exec(function (err, transfers) {
            if (err) {
                err = new Error('Error: '+ err);
                return res.send({reason: err.toString()});
            } else if (transfers.length>0) {
                callback(null, {data:transfers,filters:paymentsFilter})
            } else {
                return res.send({reason: 'not found'});
            }
        });
    }
};