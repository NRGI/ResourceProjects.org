var Source	 		= require('mongoose').model('Source'),
    Transfer 	    = require('mongoose').model('Transfer'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getPayments = function(req, res) {
    var sunburst_new = [],count=[], counter = 0,sunburst=[];
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
        Transfer.find({})
            .populate('source country project')
            .deepPopulate('source.source_type_id')
            .exec(function (err, transfers) {
                sunburst_new.push({
                    name:'payments',
                    children:[],
                    size: transfers.length
                });
                if(transfers.length) {
                    _.map(_.groupBy(transfers, function (doc) {
                        return doc.country.iso2;
                    }), function (grouped) {
                        sunburst_new[0].children.push({
                            name: grouped[0].country.name,
                            children: [],
                            size: grouped.length
                        });
                        count = _.map(_.groupBy(grouped, function (doc) {
                            if (doc.project != undefined) {
                                return doc.project._id;
                            }
                        }), function (grouped_) {
                            return grouped_.length;
                        });
                        grouped = _.map(_.groupBy(grouped, function (doc) {
                            if (doc.project != undefined) {
                                return doc.project._id;
                            }
                        }), function (grouped_) {
                            return grouped_[0];
                        });
                        _.each(grouped, function (transfer, key) {
                            if (transfer.project != undefined) {
                                sunburst_new[0].children[counter].children.push({
                                    name: transfer.project.proj_name,
                                    'size': count[key]
                                })
                            }
                        })
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