var Source	 		= require('mongoose').model('Source'),
    Transfer 	    = require('mongoose').model('Transfer'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getPayments = function(req, res) {
    var sunburst_new = [],count=[], counter = 0,sunburst=[], payments_filter={},  currency_value = [], transfers_value, value;
    req.query.transfer_level = {$nin: ['country']};
    req.query.project = {$exists: true, $nin: [null]};
    req.query.company = {$exists: true, $nin: [null]};
    req.query.transfer_value = {$gt: 1};
    if(req.query.transfer_year){req.query.transfer_year = parseInt(req.query.transfer_year);}
    async.waterfall([
        getAllPayment,
        getCurrency,
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
        Transfer.find({'transfer_level':{ $nin: [ 'country' ] },'company':{ $exists: true,$nin: [ null ]},'project':{$exists: true, $nin: [null]},'transfer_value':{$gt: 1}})
            .exec(function (err, transfers) {
                if(transfers.length>0) {
                    payments_filter.year_selector = _.countBy(transfers, "transfer_year");
                    payments_filter.currency_selector = _.countBy(transfers, "transfer_unit");
                }
                callback(null, payments_filter);
            })
    }
    function getCurrency(payments_filter,callback) {
        Transfer.find(req.query)
            .exec(function (err, transfers) {
                if(transfers.length>0) {
                    _.map(_.groupBy(transfers, function (doc) {
                        return doc.transfer_unit;
                    }), function (grouped) {
                        value = 0;
                        transfers_value = 0;
                        value = _.reduce(grouped, function (memo, num) {
                            return memo + num.transfer_value;
                        }, 0);
                        if (value > 0) {
                            transfers_value = (value / 1000000).toFixed(1)
                        }
                        currency_value.push({
                            currency: grouped[0].transfer_unit,
                            total_value: transfers_value
                        });
                        return currency_value;
                    });
                }
                callback(null, payments_filter, currency_value);
            })
    }
    function getPayment(payments_filter,currency_value,callback) {
        Transfer.aggregate([
            { $match : req.query},
            { $lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
            { $lookup: {from: "projects",localField: "project",foreignField: "_id",as: "project"}},
            { $project :
                {
                    'company.company_name':1,
                    'company._id':1,
                    project:{_id:1, name:'$project.proj_name', transfer_type:'$transfer_type', transfer_value:'$transfer_value'},
                    total_value:1,
                    name:'$transfer_type',
                    size:'$transfer_value',
                    transfer_value:1
                }
            },
            { $group:
                {
                    "_id": "$project._id",
                    "project":{
                        $first:"$project"
                    },
                    'type':{$push:{name:'$name',size:'$size',value:'$size'}},
                    "company":{
                        $first:"$company"
                    },
                    "size":{ $sum: '$transfer_value' }

                }
            },
            { $project :
                {
                    'company.company_name':1,
                    'company._id':1,
                    project:{_id:1, name:1, children:'$type', transfer_value:'$size', size:'$size', value:'$size'},
                    total_value:1,
                    transfer_value:1
                }
            },
            { $unwind : "$project" },
            { $unwind : "$project.name" },
            { $group: {
                    "_id": "$company._id",
                    "company": {
                        $first: "$company"
                    },
                    "project": {$push: "$project"},
                    "transfer_type": {$addToSet: "$transfer_type"},
                    "total_value": {$sum: '$project.transfer_value'}
                }
            },
            { $unwind : "$company" },
            { $project :
                {
                    name:'$company.company_name', size:'$total_value',value:'$total_value', children:'$project' ,
                    _id:0

                }
            }
            ]).exec(function (err, transfers) {
                if(transfers) {
                    var sum = _.reduce(transfers, function(memo, num){
                        return memo + num.size; }, 0);
                    sunburst_new.push({
                        name: 'Payments',
                        children: transfers,
                        size: sum,
                        value: (sum / 1000000).toFixed(1),
                        total_value: (sum / 1000000).toFixed(1)

                    });
                    callback(null, {data: sunburst_new, total:currency_value, filters: payments_filter})
                } else {
                    callback(null, {data: '', total:currency_value, filters: payments_filter})
                }
            })
    }
};