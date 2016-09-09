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
            .populate('source country project')
            .deepPopulate('source.source_type_id')
            .exec(function (err, transfers) {
                var count = transfers.length;
                var value=0;
                var transfers_value=0;
                sunburst_new.push({
                    name:'payments',
                    children:[],
                    size: transfers.length
                });
                if(transfers.length) {
                    _.map(_.groupBy(transfers, function (doc) {
                        return doc.country.iso2;
                    }), function (grouped) {
                        _.each(grouped, function (group) {
                            value = value + group.transfer_value
                        })
                        if(value>0){
                            transfers_value =(value/1000000)
                        }
                        sunburst_new[0].children.push({
                            key: grouped[0].country.name,
                            y: ((grouped.length*100)/count),
                            value: transfers_value
                        });
                        ++counter;
                        return sunburst_new;
                    });
                    sunburst = sunburst_new;
                    callback(null, {data:sunburst,transfers:transfers})
                }else{
                    callback(null, {data:'',transfers:''})
                }
            });
    }
};