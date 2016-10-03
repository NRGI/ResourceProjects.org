var Source	 		= require('mongoose').model('Source'),
    Transfer 	    = require('mongoose').model('Transfer'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getPayments = function(req, res) {
    var sunburst_new = [],count=[], counter = 0,sunburst=[], payments_filter={};
    req.query.company={ $exists: true, $nin: [ null ] };
    req.query.transfer_level={ $nin: [ 'country' ] };
    req.query.project={ $exists: true, $nin: [ null ]};
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
        Transfer.find({'transfer_level':{ $nin: [ 'country' ] },'company':{ $exists: true,$nin: [ null ]}})
            .populate('country')
            .exec(function (err, transfers) {
                payments_filter.year_selector=_.countBy(transfers, "transfer_year");
                payments_filter.currency_selector=_.countBy(transfers, "transfer_unit");
                payments_filter.type_selector=_.countBy(transfers, "transfer_type");
                callback(null, payments_filter);
            })
    }
    function getPayment(payments_filter,callback) {
        Transfer.find(req.query)
            .populate('source country project')
            .deepPopulate('source.source_type_id')
            .exec(function (err, transfers) {
                var value=0;
                var groups;
                var transfers_value=0;
                _.each(transfers, function (transfer) {
                    value = value + transfer.transfer_value
                })
                if (value > 0) {
                    transfers_value = (value / 1000000).toFixed(3)
                }
                sunburst_new.push({
                    name:'<b>Payment to</b><br>Payments<br>'+transfers_value+' Million',
                    children:[],
                    size: parseInt(value),
                    total_value:transfers_value
                });
                if(transfers.length) {
                    _.map(_.groupBy(transfers, function (doc) {
                        return doc.country.iso2;
                    }), function (grouped) {
                        value=0;
                        transfers_value=0;

                        groups = _.map(_.groupBy(grouped, function (doc) {
                            if (doc.project != undefined) {
                                return doc.project._id;
                            }
                        }), function (grouped_) {
                            return grouped_[0];
                        });
                        _.each(groups, function (group) {
                            value = value + group.transfer_value
                        })
                        if (value > 0) {
                            transfers_value =  (value / 1000000).toFixed(3)
                        }
                        sunburst_new[0].children.push({
                            name:'<b>Payment to</b><br>'+grouped[0].country.name+'<br>'+transfers_value+' Million',
                            children: [],
                            size: parseInt(value)
                        });
                        _.each(groups, function (transfer, key) {
                            if (transfer.project != undefined) {
                                transfers_value = (transfer.transfer_value / 1000000).toFixed(3)
                                sunburst_new[0].children[counter].children.push({
                                    name:'<b>Payment to</b><br>'+transfer.project.proj_name+'<br>'+transfers_value+' Million',
                                    'size': parseInt(transfer.transfer_value)
                                })
                            }
                        })
                        ++counter;
                        return sunburst_new;
                    });
                    sunburst = sunburst_new;
                    callback(null, {data:sunburst,filters:payments_filter})
                }else{
                    callback(null, {data:'',filters:payments_filter})
                }
            });
    }
};
exports.getPaymentsByGov = function(req, res) {
    var sunburst_new = [],count=[], counter = 0,sunburst=[], payments_filter={};
    req.query.company={ $exists: true, $nin: [ null ] };
    req.query.transfer_level= 'country';
    req.query.transfer_gov_entity={ $exists: true, $nin: [ null ]};
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
        Transfer.find({'transfer_level':[ 'country' ],'company':{ $exists: true,$nin: [ null ]}})
            .populate('country')
            .exec(function (err, transfers) {
                payments_filter.year_selector=_.countBy(transfers, "transfer_year");
                payments_filter.currency_selector=_.countBy(transfers, "transfer_unit");
                payments_filter.type_selector=_.countBy(transfers, "transfer_type");
                callback(null, payments_filter);
            })
    }
    function getPayment(payments_filter,callback) {
        Transfer.find(req.query)
            .populate('source country project')
            .deepPopulate('source.source_type_id')
            .exec(function (err, transfers) {
                var value=0;
                var groups;
                var transfers_value=0;
                _.each(transfers, function (transfer) {
                    value = value + transfer.transfer_value
                })
                if (value > 0) {
                    transfers_value = (value / 1000000).toFixed(3)
                }
                sunburst_new.push({
                    name:'<b>Payment to</b><br>Payments<br>'+transfers_value+' Million',
                    children:[],
                    size: parseInt(value),
                    total_value:transfers_value
                });
                if(transfers.length) {
                    _.map(_.groupBy(transfers, function (doc) {
                        return doc.country.iso2;
                    }), function (grouped) {
                        value=0;
                        transfers_value=0;

                        groups = _.map(_.groupBy(grouped, function (doc) {
                            return doc.transfer_gov_entity;
                        }), function (grouped_) {
                            return grouped_[0];
                        });
                        _.each(groups, function (group) {
                            value = value + group.transfer_value
                        })
                        if (value > 0) {
                            transfers_value =  (value / 1000000).toFixed(3)
                        }
                        sunburst_new[0].children.push({
                            name:'<b>Payment to</b><br>'+grouped[0].country.name+'<br>'+transfers_value+' Million',
                            children: [],
                            size: parseInt(value)
                        });
                        _.each(groups, function (transfer, key) {
                            if (transfer.project != undefined) {
                                transfers_value = (transfer.transfer_value / 1000000).toFixed(3)
                                sunburst_new[0].children[counter].children.push({
                                    name:'<b>Payment to</b><br>'+transfer.transfer_gov_entity+'<br>'+transfers_value+' Million',
                                    'size': parseInt(transfer.transfer_value)
                                })
                            }
                        })
                        ++counter;
                        return sunburst_new;
                    });
                    sunburst = sunburst_new;
                    callback(null, {data:sunburst,filters:payments_filter})
                }else{
                    callback(null, {data:'',filters:payments_filter})
                }
            });
    }
};