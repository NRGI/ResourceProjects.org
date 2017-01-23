var Source	 		= require('mongoose').model('Source'),
    Transfer 	    = require('mongoose').model('Transfer'),
    async           = require('async'),
    _               = require("underscore"),
    errors 	    = require('./errorList'),
    request         = require('request');

//GET TREEMAP
exports.getPayments = function(req, res) {
    var  data={};
    data.sunburstNew =[];
    data.total =0;
    data.filters ={};
    data.errorList =[];
    req.query.transfer_level = {$nin: ['country']};
    //req.query.project = {$exists: true, $nin: [null]};
    req.query.company = {$exists: true, $nin: [null]};
    req.query.transfer_value = {$gt: 1};
    if(req.query.transfer_year){req.query.transfer_year = parseInt(req.query.transfer_year);}
    async.waterfall([
        getAllPayment,
        getCurrency,
        getPayment
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Treemap');
            res.send(data);
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
            }},
            {$project:{
                transfer_year:{_id:'$transfer_year',name:'$transfer_year'},
                transfer_unit:{_id:'$transfer_unit',name:'$transfer_unit'}
            }},
            {$group:{
                _id:null,
                transfer_unit:{$addToSet:'$transfer_unit'},
                transfer_year:{$addToSet:'$transfer_year'}
            }}
        ]).exec(function (err, transfers) {
                if (err) {
                    err = new Error('Error: '+ err);
                    return res.send({reason: err.toString()});
                } else if(transfers.length>0) {
                    data.filters.year_selector = transfers[0].transfer_year;
                    data.filters.currency_selector = transfers[0].transfer_unit;
                    callback(null, data);
                } else {
                    return res.send({reason: 'not found'});
                }
            })
    }

    //Grouping of all transfers by transfer_unit field.
    function getCurrency(data,callback) {
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
                data.errorList = errors.errorFunction(err, 'Transfer units');
                callback(null, data);
            }
            else {
                if (currencyValue.length > 0) {
                    data.total = currencyValue;
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Transfer units', message: 'transfer units not found'})
                    return res.send({reason: 'transfer units not found'});
                }
            }
        })
    }

    // Get all payments
    function getPayment(data, callback) {
        Transfer.aggregate([
            { $match : req.query},
            { $lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
            { $lookup: {from: "projects",localField: "project",foreignField: "_id",as: "project"}},
            { $unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
            { $unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}},
            { $project :
            {
                'company.company_name':1,
                'company._id':1,
                project:{$cond: { if: {$not: "$transfer_label"},
                    then:  {name:'$project.proj_name', transfer_type:'$transfer_type',
                        transfer_value:'$transfer_value'},
                    else: {name:'$transfer_label', transfer_type:'$transfer_type',
                        transfer_value:'$transfer_value'}
                }},
                total_value:1,
                name:'$transfer_type',
                size:'$transfer_value',
                transfer_value:1
            }
            },
            { $group:
            {
                "_id": "$project.name",
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
                data.errorList = errors.errorFunction(err, 'Transfers');
                callback(null, data);
            }
            else {
                if (transfers) {
                    var sum = _.reduce(transfers, function (memo, num) {
                        if(num && num.size) {
                            return memo + num.size;
                        }
                    }, 0);
                    if(sum) {
                        data.sunburstNew.push({
                            name: 'Payments',
                            children: transfers,
                            size: sum,
                            value: (sum / 1000000).toFixed(1),
                            total_value: (sum / 1000000).toFixed(1)

                        });
                    }
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Transfers', message: 'transfers not found'})
                    callback(null, data);
                }
            }
        })
    }
};