var Source	 		= require('mongoose').model('Source'),
    Transfer 	    = require('mongoose').model('Transfer'),
    async           = require('async'),
    _               = require("underscore"),
    mongoose 		= require('mongoose'),
    errors 	        = require('./errorList'),
    request         = require('request');

//GET Sunburst Chart on Payments by Project
exports.getPayments = function(req, res) {
    var data = {};
    data.sunburstNew = []; 
    data.errorList=[]; 
    data.transfers=[]; 
    data.total=[]; 
    data.filters={};
    var company = req.query.company;
    if(company){
        req.query.company=mongoose.Types.ObjectId(company);
    }else {
        req.query.company = {$exists: true, $nin: [null]};
    }
    req.query.transfer_level={ $nin: [ 'country' ] };
    req.query.transfer_value={$gt: 0};
    if(req.query.transfer_year){req.query.transfer_year = parseInt(req.query.transfer_year);}
    
    async.waterfall([
        getAllPayment,
        getCurrency,
        getPayment
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Sunburst');
            return res.send(data);
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
            {$match: {'transfer_level':{ $nin: [ 'country' ] },'company':{ $exists: true,$nin: [ null ]}}},
            {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
            {$unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}}
        ]).exec(function (err, transfers) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Sunburst');
                res.send(data);
            } else if (transfers.length>0) {
                data.filters.year_selector = _.countBy(transfers, "transfer_year");
                data.filters.currency_selector = _.countBy(transfers, "transfer_unit");
                data.filters.type_selector=_.countBy(transfers, "transfer_type");
                data.filters.company_selector=_.groupBy(transfers, function (doc) {if(doc&&doc.company&&doc.company._id){return doc.company._id;}});
                callback(null, data);
            } else {
                data.errorList = errors.errorFunction('Sunburst','data not found');
                res.send(data);
            }
        })
    }
    function getCurrency(data, callback) {
        Transfer.aggregate([
            {$match: req.query},
            {$lookup: {from: "countries",localField: "country",foreignField: "_id",as: "country"}},
            {$unwind: "$country"},
            { $project : { _id:1, transfer_unit:'$transfer_unit', transfer_value:1}},
            { $group: { "_id": "$transfer_unit", "total_value":{ $sum: '$transfer_value' }}},
            { $project :{ _id:0, currency:'$_id', total_value:{$divide:['$total_value',1000000]}}}
        ]).exec(function (err, transfers) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Transfer currency');
                res.send(data);
            }
            else {
                if (transfers.length>0) {
                    data.transfers = transfers;
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Transfer currency', message: 'transfer currency not found'})
                    res.send(data);
                }
            }
        })
    }
    function getPayment(data, callback) {
        Transfer.aggregate([
            {$match : req.query},
            {$lookup: {from: "projects",localField: "project",foreignField: "_id",as: "project"}},
            {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
            {$lookup: {from: "sites",localField: "site",foreignField: "_id",as: "site"}},
            {$lookup: {from: "countries",localField: "country",foreignField: "_id",as: "country"}},
            {$unwind: "$country"},
            {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
            {$project:{_id:1,transfer_year:1,
                country: { name:"$country.name",iso2:"$country.iso2"},
                company:{$cond: { if:  {$not: "$company" }, then: '', else: {_id:"$company._id",company_name:"$company.company_name"}}},
                proj_site:{$cond: { if:  {$not: "$project" },
                    then: {$cond: { if:  {$not: "$site" },
                        then:[],
                        else:{_id:"$site._id",name:"$site.site_name",
                            type:{$cond: { if: { $gte: [ "$site.field", true ] }, then: 'field', else: 'site' }}}
                    }} ,
                    else: {_id:"$project.proj_id",name:"$project.proj_name",
                        type:{$cond: { if: {$not: "$project"}, then: '', else: 'project'}}}
                }},
                transfer_level:1,transfer_type:1,transfer_unit:1,transfer_value:1,transfer_label:1
            }},
            {$unwind: {"path": "$proj_site", "preserveNullAndEmptyArrays": true}},
            {$project:{_id:1,transfer_year:1,transfer_type:1,transfer_unit:1,transfer_level:1,
                transfer_value:1,country:1,
                company:1,
                proj_site:{$cond: { if: {$not: "$transfer_label"},
                    then:  {_id:"$proj_site._id",name:"$proj_site.name",
                        type:'$proj_site.type'},
                    else: {name:"$transfer_label",
                        type:'$transfer_level'}
                }}, transfer_label:1
            }},
            {$group:{
                _id:'$_id',
                transfer_year:{$first:'$transfer_year'},
                transfer_type:{$first:'$transfer_type'},
                transfer_label:{$first:'$transfer_label'},
                transfer_unit:{$first:'$transfer_unit'},
                transfer_value:{$sum:'$transfer_value'},
                country:{$first:'$country'},
                company:{$first:'$company'},
                proj_site:{$first:'$proj_site'}
            }},
            { $project :
            {
                _id:1,
                transfers:{
                    transfer_year:'$transfer_year',
                    transfer_type:'$transfer_type',
                    transfer_unit:'$transfer_unit',
                    transfer_value:'$transfer_value',
                    country:'$country',
                    company:'$company',
                    proj_site:'$proj_site'
                },
                transfer_value: {$divide:['$transfer_value',1000000]},
                country:1,
                proj_site:1,
                company:1
            }
            },
            { $project :
            {
                _id:1,
                transfers:1,
                transfer_value:{$divide:[
                    {$subtract:[
                        {$multiply:['$transfer_value',100]},
                        {$mod:[{$multiply:['$transfer_value',100]}, 10]}
                    ]},
                    100]},
                country:1,
                proj_site:1,
                company:1
            }
            },

            { $group:
            {
                "_id": "$country.iso2",
                'type':{$push:{transfer_name:{ $concat: [ "$country.iso2", " - ", "$proj_site.name" ]  },name:'$proj_site.name',size:'$transfer_value'}},
                "country":{$first:"$country"},
                "transfers":{$addToSet:"$transfers"},
                "size":{ $sum: '$transfer_value' }
            }
            },

            {$unwind: "$type"},
            { $group:
            {
                "_id": "$type.transfer_name",
                name: {$first:"$type.name"},
                country: {$addToSet:"$country"},
                transfers: {$first:"$transfers"},
                transfer_value: {$sum:"$transfer_value"},
                "size":{ $sum: '$type.size' }
            }
            },
            { $project :
            {
                _id:1,
                name: { $concat: [ {$literal: '<b>Payment to</b><br>' }, "", "$name",'<br> ',
                    {$substr:[{ $sum: '$size' },0,100000000000000]}, ' Million' ]  },
                country: 1,
                transfers: 1,
                transfer_value: 1,
                "size":1
            }
            },

            {$unwind: "$country"},
            { $group:
            {
                "_id": "$country.iso2",
                'type':{$push:{name:'$name',size:'$size'}},
                "country":{$first:"$country"},
                "transfers":{$first:"$transfers"},
                transfer_value: {$first:"$transfer_value"},
                size: {$sum:"$size"}
            }
            },

            {$unwind: "$country"},
            { $project :
            {
                _id:1,
                transfers:1,
                size: '$size',
                country:1,
                type:1,
                company:1
            }
            },  { $project :
            {
                _id:1,
                transfers:1,
                size: {$divide:[
                    {$subtract:[
                        {$multiply:['$size',100]},
                        {$mod:[{$multiply:['$size',100]}, 10]}
                    ]},
                    100]},
                country:1,
                type:1,
                company:1
            }
            },
            { $project :
            {
                name:'$_id',
                transfers:1,
                project:{_id:1,  name:{ $concat: [ {$literal: '<b>Payment to</b><br>' }, "", "$country.name",'<br> ',{$substr:["$size",0,1000000000000000000000]}, ' Million' ]  },
                    children:'$type',size:'$size'},
                size: '$size'
            }
            },
            {$unwind: {"path": "$transfers", "preserveNullAndEmptyArrays": true}},
            {$group:{
                _id: null,
                total_value:{$sum:'$transfers.transfer_value'},
                children:{$addToSet:'$project'},
                transfers:{$addToSet:'$transfers'}
            }},
            { $project : {
                _id:0,
                children:1,
                transfers:1,
                total_value: {$divide:['$total_value',1000000]}
            }},
            { $project :{
                _id:0,
                transfers:1,
                children:1,
                total_value: {$divide:[
                    {$subtract:[
                        {$multiply:['$total_value',100]},
                        {$mod:[{$multiply:['$total_value',100]}, 10]}
                    ]},
                    100]},
                name: { $concat: [ {$literal: '<b>Payment to</b><br> Payments<br>' },' ',
                    {$substr:["$total_value",0,1000000000000000000000]}, ' Million' ]  }
            }
            }
        ]).exec(function (err, transfers) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Transfers');
                res.send(data);
            }
            else {
                if (transfers.length>0 && transfers[0]&& transfers[0].total_value&& transfers[0].children) {
                    data.sunburstNew.push({
                        name: '<b>Payment to</b><br> Payments<br> ' + transfers[0].total_value.toFixed(1)+ ' Million',
                        children:  transfers[0].children,
                        size:  transfers[0].total_value.toFixed(1).toString(),
                        total_value:  transfers[0].total_value.toFixed(1).toString()
                    });
                    callback(null, data)
                } else {
                    data.errorList.push({type: 'Transfers', message: 'transfers not found'})
                    callback(null, data)
                }
            }
        });
    }
};
exports.getPaymentsByGov = function(req, res) {
    var data = {};
    data.sunburstNew = [];
    data.errorList=[];
    data.transfers=[];
    data.total=[];
    data.filters={};

    var company = req.query.company;
    if(company){
        req.query.company=mongoose.Types.ObjectId(company);
    }else {
        req.query.company = {$exists: true, $nin: [null]};
    }
    req.query.transfer_level= 'country';
    req.query.transfer_value={$gt: 0};
    req.query.transfer_gov_entity={ $exists: true, $nin: [ null ]};
    if(req.query.transfer_year){req.query.transfer_year = parseInt(req.query.transfer_year);}
    async.waterfall([
        getAllPayment,
        getCurrency,
        getPayment
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Sunburst');
            res.send(data);
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
            {$match: {'transfer_level':'country','company':{ $exists: true,$nin: [ null ]}}},
            {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
            {$unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}}
        ]).exec(function (err, transfers) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Sunburst');
                res.send(data);
            } else if (transfers.length>0) {
                data.filters.year_selector = _.countBy(transfers, "transfer_year");
                data.filters.currency_selector = _.countBy(transfers, "transfer_unit");
                data.filters.type_selector=_.countBy(transfers, "transfer_type");
                data.filters.company_selector=_.groupBy(transfers, function (doc) {if(doc&&doc.company&&doc.company._id){return doc.company._id;}});
                callback(null, data);
            } else {
                data.errorList = errors.errorFunction('Sunburst','data not found');
                res.send(data);
            }
        })
    }
    function getCurrency(data, callback) {
        Transfer.aggregate([
            {$match: req.query},
            {$lookup: {from: "countries",localField: "country",foreignField: "_id",as: "country"}},
            {$unwind: "$country"},
            { $project : { _id:1, transfer_unit:'$transfer_unit', transfer_value:1}},
            { $group: { "_id": "$transfer_unit", "total_value":{ $sum: '$transfer_value' }}},
            { $project :{ _id:0, currency:'$_id', total_value:{$divide:['$total_value',1000000]}}}
        ]).exec(function (err, transfers) {

            if (err) {
                data.errorList = errors.errorFunction(err,'Transfer currency');
                res.send(data);
            }
            else {
                if (transfers.length>0) {
                    data.transfers = transfers;
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Transfer currency', message: 'transfer currency not found'})
                    res.send(data);
                }
            }
        })
    }

    function getPayment(data, callback) {
        Transfer.aggregate([
            {$match : req.query},
            {$lookup: {from: "countries",localField: "country",foreignField: "_id",as: "country"}},
            {$unwind: "$country"},
            {$project:{_id:1,transfer_year:1,transfer_gov_entity:1,
                country: { name:"$country.name",iso2:"$country.iso2"},
                transfer_level:1,transfer_type:1,transfer_unit:1,transfer_value:1,transfer_label:1
            }},
            {$group:{
                _id:'$transfer_gov_entity',
                transfer_year:{$first:'$transfer_year'},
                transfer_type:{$first:'$transfer_type'},
                transfer_unit:{$first:'$transfer_unit'},
                transfer_value:{$sum:'$transfer_value'},
                transfer_gov_entity:{$first:'$transfer_gov_entity'},
                country:{$first:'$country'}
            }},
            { $project :
            {
                _id:1,
                transfers:{
                    transfer_year:'$transfer_year',
                    transfer_type:'$transfer_type',
                    transfer_unit:'$transfer_unit',
                    transfer_value:'$transfer_value',
                    transfer_gov_entity:'$transfer_gov_entity',
                    country:'$country'
                },
                transfer_value: {$divide:['$transfer_value',1000000]},
                country:1,transfer_gov_entity:1
            }
            },
            { $project :
            {
                _id:1,
                transfers:1,
                transfer_value:{$divide:[
                    {$subtract:[
                        {$multiply:['$transfer_value',100]},
                        {$mod:[{$multiply:['$transfer_value',100]}, 10]}
                    ]},
                    100]},
                country:1,
                transfer_gov_entity:1
            }
            },

            { $group:
            {
                "_id": "$country.iso2",
                'type':{$push:{transfer_name:{ $concat: [ "$country.iso2", " - ", "$transfer_gov_entity" ]  },
                    name:'$transfer_gov_entity',size:'$transfer_value'}},
                "country":{$first:"$country"},
                "transfers":{$addToSet:"$transfers"},
                "size":{ $sum: '$transfer_value' }
            }
            },
            {$unwind: "$type"},
            { $group:
            {
                "_id": "$type.transfer_name",
                name: {$first:"$type.name"},
                country: {$addToSet:"$country"},
                transfers: {$first:"$transfers"},
                transfer_value: {$sum:"$transfer_value"},
                "size":{ $sum: '$type.size' }
            }
            },
            { $project :
            {
                _id:1,
                name: { $concat: [ {$literal: '<b>Payment to</b><br>' }, "", "$name",'<br> ',
                    {$substr:[{ $sum: '$size' },0,100000000000000]}, ' Million' ]  },
                country: 1,
                transfers: 1,
                transfer_value: 1,
                "size":1
            }
            },

            {$unwind: "$country"},
            { $group:
            {
                "_id": "$country.iso2",
                'type':{$push:{name:'$name',size:'$size'}},
                "country":{$first:"$country"},
                "transfers":{$first:"$transfers"},
                transfer_value: {$first:"$transfer_value"},
                size: {$sum:"$size"}
            }
            },

            {$unwind: "$country"},
            { $project :
            {
                _id:1,
                transfers:1,
                size: '$size',
                country:1,
                type:1,
                company:1
            }
            },  { $project :
            {
                _id:1,
                transfers:1,
                size: {$divide:[
                    {$subtract:[
                        {$multiply:['$size',100]},
                        {$mod:[{$multiply:['$size',100]}, 10]}
                    ]},
                    100]},
                country:1,
                type:1,
                company:1
            }
            },
            { $project :
            {
                name:'$_id',
                transfers:1,
                project:{_id:1,  name:{ $concat: [ {$literal: '<b>Payment to</b><br>' }, "", "$country.name",'<br> ',{$substr:["$size",0,1000000000000000000000]}, ' Million' ]  },
                    children:'$type',size:'$size'},
                size: '$size'
            }
            },
            {$unwind: {"path": "$transfers", "preserveNullAndEmptyArrays": true}},
            {$group:{
                _id: null,
                total_value:{$sum:'$transfers.transfer_value'},
                children:{$addToSet:'$project'},
                transfers:{$addToSet:'$transfers'}
            }},
            { $project : {
                _id:0,
                children:1,
                transfers:1,
                total_value: {$divide:['$total_value',1000000]}
            }},
            { $project :{
                _id:0,
                transfers:1,
                children:1,
                total_value: {$divide:[
                    {$subtract:[
                        {$multiply:['$total_value',100]},
                        {$mod:[{$multiply:['$total_value',100]}, 10]}
                    ]},
                    100]},
                name: { $concat: [ {$literal: '<b>Payment to</b><br> Payments<br>' },' ',
                    {$substr:["$total_value",0,1000000000000000000000]}, ' Million' ]  }
            }
            }
        ]).exec(function (err, transfers) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Transfers');
                res.send(data);
            }
            else {
                if (transfers.length>0 && transfers[0]&& transfers[0].total_value&& transfers[0].children) {
                    data.sunburstNew.push({
                        name: '<b>Payment to</b><br> Payments<br> ' + transfers[0].total_value.toFixed(1)+ ' Million',
                        children:  transfers[0].children,
                        size:  transfers[0].total_value.toFixed(1).toString(),
                        total_value:  transfers[0].total_value.toFixed(1).toString()
                    });
                    callback(null, data)
                } else {
                    data.errorList.push({type: 'Transfers', message: 'transfers not found'})
                    callback(null, data)
                }
            }
        });
    }
};