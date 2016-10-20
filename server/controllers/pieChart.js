var Source	 		= require('mongoose').model('Source'),
    Transfer 	    = require('mongoose').model('Transfer'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getPayments = function(req, res) {
    var sunburst_new = [], counter = 0,sunburst=[], payments_filter={};
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
        Transfer.find({})
            .populate('country')
            .exec(function (err, transfers) {
                var transfer = _.filter(transfers, function(transfer){ return transfer.transfer_level!='country'; });
                payments_filter.year_selector=_.countBy(transfer, "transfer_year");
                payments_filter.currency_selector=_.countBy(transfer, "transfer_unit");
                callback(null, payments_filter);
            })
    }
    function getPayment(payments_filter,callback) {
        Transfer.find(req.query)
            .populate('country')
            .exec(function (err, transfers) {
                var counter = 0;
                var value=0;
                var transfers_value=0;
                _.each(transfers, function (transfer) {
                    value = value + transfer.transfer_value
                })
                if (value > 0) {
                    transfers_value = (value / 1000000).toFixed(3)
                }
                sunburst_new.push({
                    name:'payments',
                    children:[],
                    total_value: transfers_value
                });
                if(transfers.length) {
                    value = 0; transfers_value = 0;
                    var len = _.filter(transfers, function(transfer){ return transfer.transfer_level!='country'; });
                    _.map(_.groupBy(transfers, function (doc) {
                        if(doc.transfer_level!='country') {return doc.country.iso2;}
                    }), function (grouped) {
                        if(grouped[0].transfer_level!='country'){
                            _.each(grouped, function (group) {
                                value = value + group.transfer_value
                            })
                            if (value > 0) {
                                transfers_value = (value / 1000000)
                            }
                            sunburst_new[0].children.push({
                                key: grouped[0].country.name,
                                y: ((grouped.length * 100) / len.length),
                                value: transfers_value
                            });
                            ++counter;
                            return sunburst_new;
                        }
                    });
                    sunburst = sunburst_new;
                    callback(null, {data:sunburst,filters:payments_filter})
                }else{
                    callback(null, {data:'',filters:payments_filter})
                }
            });
    }
};