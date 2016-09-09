var Source	 		= require('mongoose').model('Source'),
    Transfer 	    = require('mongoose').model('Transfer'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getPayments = function(req, res) {
    var sunburst_new = [], counter = 0,sunburst=[];
    async.waterfall([
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
    function getPayment(callback) {
        Transfer.find(req.query)
            .populate('country')
            .exec(function (err, transfers) {
                var counter = 0;
                var value=0;
                var transfers_value=0;
                sunburst_new.push({
                    name:'payments',
                    children:[],
                    size: transfers.length
                });
                if(transfers.length) {
                    var transfers_data = _.map(_.groupBy(transfers, function (doc) {if(doc.project!=undefined||doc.site!=undefined) {return doc;}}), function (grouped) {return grouped})
                    _.map(_.groupBy(transfers, function (doc) {
                        if(doc.project!=undefined||doc.site!=undefined) {return doc.country.iso2;}
                    }), function (grouped) {
                        if(grouped[0].project!=undefined||grouped[0].site!=undefined){
                            _.each(grouped, function (group) {
                                value = value + group.transfer_value
                            })
                            if (value > 0) {
                                transfers_value = (value / 1000000)
                            }
                            sunburst_new[0].children.push({
                                key: grouped[0].country.name,
                                y: ((grouped.length * 100) / transfers_data.length),
                                value: transfers_value
                            });
                            ++counter;

                            return sunburst_new;
                        }
                    });
                    sunburst = sunburst_new;
                    callback(null, {data:sunburst,transfers:transfers})
                }else{
                    callback(null, {data:'',transfers:''})
                }
            });
    }
};