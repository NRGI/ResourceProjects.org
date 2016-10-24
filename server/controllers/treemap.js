var Source	 		= require('mongoose').model('Source'),
    Transfer 	    = require('mongoose').model('Transfer'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getPayments = function(req, res) {
    var sunburst_new = [],count=[], counter = 0,sunburst=[], payments_filter={};
    req.query.transfer_level = {$nin: ['country']};
    req.query.project = {$exists: true, $nin: [null]};
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
            .exec(function (err, transfers) {
                payments_filter.year_selector=_.countBy(transfers, "transfer_year");
                payments_filter.currency_selector=_.countBy(transfers, "transfer_unit");
                callback(null, payments_filter);
            })
    }
    function getPayment(payments_filter,callback) {
        Transfer.find(req.query)
            .populate('company', ' _id company_name')
            .populate('project', ' _id proj_name proj_id')
            .exec(function (err, transfers) {
                if (transfers.length>0) {
                    var value = 0;
                    var groups;
                    var transfers_value = 0;
                    var currency_value=[];
                    _.map(_.groupBy(transfers, function (doc) {
                        return doc.transfer_unit;
                    }), function (grouped) {
                        value=0;
                        transfers_value=0;
                        _.each(grouped, function (group) {
                            if(group.transfer_value>0) {
                                value = value +group.transfer_value
                            }
                        })
                        if (value > 0) {
                            transfers_value = (value / 1000000).toFixed(1)
                        }
                        currency_value.push({
                            currency:grouped[0].transfer_unit,
                            total_value:transfers_value
                        });
                        return currency_value;
                    });
                    value =0;
                    _.each(transfers, function (transfer) {
                        if(transfer.transfer_value>0){
                            value = value + transfer.transfer_value
                        }
                    })
                    if(value<1000000){
                        transfers_value = (value / 1000000).toFixed(3)
                    }else if(value>0){
                        transfers_value = (value / 1000000).toFixed(1)
                    }
                    sunburst_new.push({
                        name: 'Payments',
                        children: [],
                        size: value,
                        value: transfers_value,
                        total_value: transfers_value
                    });
                    if (transfers.length>0) {
                        _.map(_.groupBy(transfers, function (doc) {
                            if(doc.company && doc.company.company_name) {
                                return doc.company._id;
                            }
                        }), function (grouped) {
                            value = 0;
                            transfers_value = 0;

                            groups = _.map(_.groupBy(grouped, function (doc) {
                                if(doc.project && doc.project._id) {
                                    return doc.project._id;
                                }
                            }), function (grouped_) {
                                value = 0;
                                _.each(grouped_, function (group) {
                                    if(group.transfer_value>0) {
                                        value = value + group.transfer_value
                                    }
                                })
                                grouped_[0].values = value;
                                return grouped_[0];
                            });
                            value = 0;
                            _.each(groups, function (group) {
                                if(group.values>0) {
                                    value = value + group.values
                                }
                            })
                            if (value > 0) {
                                if(value<1000000){
                                    transfers_value = (value / 1000000).toFixed(3)
                                }else{
                                    transfers_value = (value / 1000000).toFixed(1)
                                }
                                if(grouped[0].company && grouped[0].company.company_name) {
                                    sunburst_new[0].children.push({
                                        name:  grouped[0].company.company_name,
                                        children: [],
                                        size:value,
                                        value:transfers_value
                                    });
                                    _.each(groups, function (transfer, key) {
                                        if (transfer.project) {
                                            var size = 0;
                                            if (transfer.values > 0) {
                                                size = transfer.values
                                                if (size < 1000000) {
                                                    transfers_value = (size / 1000000).toFixed(3)
                                                } else {
                                                    transfers_value = (size / 1000000).toFixed(1)
                                                }
                                                sunburst_new[0].children[counter].children.push({
                                                    name:  transfer.project.proj_name,
                                                    'size': transfer.values,
                                                    'value': transfers_value
                                                })
                                            }
                                        }
                                    })
                                    ++counter;
                                }
                            }
                            return sunburst_new;
                        });
                        sunburst = sunburst_new;

                        callback(null, {
                            data: sunburst,
                            total: currency_value,
                            filters: payments_filter,
                            transfers: transfers
                        })
                    } else {
                        callback(null, {data: '', total: '', filters: payments_filter, transfers: ''})
                    }
                } else {
                    callback(null, {data: '', total: '', filters: payments_filter, transfers: ''})
                }

            })
    }
};