var Source	 		= require('mongoose').model('Source'),
    Transfer 	    = require('mongoose').model('Transfer'),
    async           = require('async'),
    _               = require("underscore"),
    errors 	    = require('./errorList'),
    request         = require('request');

//GET TREEMAP
exports.getPayments = function(req, res) {
    var sunburstNew = [], paymentsFilter={},errorList=[];
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

    //Get payment filters
    function getAllPayment(callback) {
        Transfer.aggregate([
            { $match : {'transfer_level':{ $nin: [ 'country' ] },'company':{ $exists: true,$nin: [ null ]},
              'project':{$exists: true, $nin: [null]},'transfer_value':{$gt: 1}
            }}
        ]).exec(function (err, transfers) {
                if (err) {
                    err = new Error('Error: '+ err);
                    return res.send({reason: err.toString()});
                } else if(transfers.length>0) {
                    paymentsFilter.year_selector = _.countBy(transfers, "transfer_year");
                    paymentsFilter.currency_selector = _.countBy(transfers, "transfer_unit");
                    callback(null, paymentsFilter);
                } else {
                    return res.send({reason: 'not found'});
                }
            })
    }

    //Grouping of all transfers by transfer_unit field.
    function getCurrency(paymentsFilter,callback) {
        Transfer.aggregate([
            {$match : req.query},
            {$group:{
                _id:'$transfer_unit',
                currency:{$first:'$transfer_unit'},
                total_value: {$sum:'$transfer_value'}
            }},
            {$project: {currency:1, total_value:{$divide:['$total_value',1000000]}}},
            {$project: {currency:1, total_value:{$divide:[
            {$subtract:[
                {$multiply:['$total_value',1000000]},
                {$mod:[{$multiply:['$total_value',100]}, 1]}
            ]},
            100]}}}
        ]).exec(function (err, currencyValue) {
            if (err) {
                errorList = errors.errorFunction(err, 'Transfer units');
                callback(null, paymentsFilter, currencyValue, errorList);
            }
            else {
                if (currencyValue.length > 0) {
                    callback(null, paymentsFilter, currencyValue, errorList);
                } else {
                    errorList.push({type: 'Transfer units', message: 'transfer units not found'})
                    return res.send({reason: 'transfer units not found'});
                }
            }
        })
    }

    // Get all payments
    function getPayment(paymentsFilter, currencyValue, errorList, callback) {
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
            if (err) {
                errorList = errors.errorFunction(err, 'Transfers');
                callback(null, {data: sunburstNew, total: currencyValue, filters: paymentsFilter, errorList:errorList});
            }
            else {
                if (transfers) {
                    var sum = _.reduce(transfers, function (memo, num) {
                        if(num && num.size) {
                            return memo + num.size;
                        }
                    }, 0);
                    if(sum) {
                        sunburstNew.push({
                            name: 'Payments',
                            children: transfers,
                            size: sum,
                            value: (sum / 1000000).toFixed(1),
                            total_value: (sum / 1000000).toFixed(1)

                        });
                    }
                    callback(null, {data: sunburstNew, total: currencyValue, filters: paymentsFilter, errorList:errorList});
                } else {
                    errorList.push({type: 'Transfers', message: 'transfers not found'})
                    callback(null, {data: sunburstNew, total: currencyValue, filters: paymentsFilter, errorList:errorList});
                }
            }
        })
    }
};