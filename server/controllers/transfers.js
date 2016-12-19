var Transfer 		= require('mongoose').model('Transfer'),
    async           = require('async'),
    mongoose 		= require('mongoose'),
    _               = require("underscore"),
    errors 	        = require('./errorList'),
    request         = require('request');

//Get payment filters
exports.getTransferFilters = function(req, res) {
    var data ={};
    data.filters={};
    data.errorList=[];
    var country={};
    country.company = {$exists: true, $nin: [null]};
    country.transfer_type = {$exists: true, $nin: [null]};

    if(req.params.country == 'false'){
       country.transfer_level={ $nin: [ 'country' ] };
    } else {
        country.transfer_level= 'country';
    }

    async.waterfall([
        getFilters
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Transfers');
            return res.send(data);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function getFilters(callback) {
        Transfer.aggregate([
            {$match: country},
            {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
            {$unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}}
        ]).exec(function (err, transfers) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Transfers');
                res.send(data);
            } else {
                if (transfers.length > 0) {
                    data.filters.year_selector = _.countBy(transfers, "transfer_year");
                    data.filters.currency_selector = _.countBy(transfers, "transfer_unit");
                    data.filters.type_selector = _.countBy(transfers, "transfer_type");
                    data.filters.company_selector = _.groupBy(transfers, function (doc) {
                        if (doc && doc.company && doc.company._id) {
                            return doc.company._id;
                        }
                    });
                    callback(null, data);
                } else {
                    data.errorList = errors.errorFunction('Transfers', 'not found');
                    res.send(data);
                }
            }
        })
    }
}

//Get payments by project
exports.getTransfers = function(req, res) {
    var data = {},
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);
    req.query.transfer_level={ $nin: [ 'country' ] };
    if(req.query.transfer_year){req.query.transfer_year = parseInt(req.query.transfer_year);}
    if(req.query.company){req.query.company = mongoose.Types.ObjectId(req.query.company);}
    data.errorList = [];
    data.transfers = [];
    data.count = 0;

    async.waterfall([
        transferCount,
        getTransferSet
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Transfers');
            return res.send(data);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });

    function transferCount(callback) {
        Transfer.find(req.query).count().exec(function(err, transfersCount) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Transfers');
                res.send(data);
            } else if (transfersCount == 0) {
                data.errorList.push({type: 'Transfers', message: 'transfers not found'})
                res.send(data);
            } else {
                data.count = transfersCount;
                callback(null, data);
            }
        });
    }

    function getTransferSet(data, callback) {
        Transfer.aggregate([
            {$match:req.query},
            {$lookup: {from: "projects",localField: "project",foreignField: "_id",as: "project"}},
            {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
            {$lookup: {from: "sites",localField: "site",foreignField: "_id",as: "site"}},
            {$lookup: {from: "countries",localField: "country",foreignField: "_id",as: "country"}},
            {$unwind: {"path": "$country", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}},
            {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
            {$project:{_id:1,transfer_year:1,
                country: { name:"$country.name",iso2:"$country.iso2"},
                company:{$cond: { if:  {$not: "$company" }, then: '', else: {_id:"$company._id",company_name:"$company.company_name"}}},
                proj_site:{$cond: { if:  {$not: "$site" },
                    then:  {
                        $cond: { if:  {$not: "$project" },  then: '', else:{
                            _id:"$project.proj_id",name:"$project.proj_name",
                            type:{$cond: { if: {$not: "$project"}, then: '', else: 'project'}}}

                        }},
                    else: {_id:"$site._id",name:"$site.site_name",
                        type:{$cond: { if: { $gte: [ "$site.field", true ] }, then: 'field', else: 'site' }}}}
                },
                transfer_level:1,transfer_type:1,transfer_unit:1,transfer_value:1, transfer_label:1
            }},
            {$group:{
                _id:'$_id',
                transfer_year:{$first:'$transfer_year'},
                transfer_type:{$first:'$transfer_type'},
                transfer_unit:{$first:'$transfer_unit'},
                transfer_label:{$first:'$transfer_label'},
                transfer_level:{$first:'$transfer_level'},
                transfer_value:{$first:'$transfer_value'},
                country:{$first:'$country'},
                company:{$first:'$company'},
                proj_site:{$first:'$proj_site'}
            }},
            {$project:{_id:1,transfer_year:1,transfer_type:1,transfer_unit:1,transfer_level:1,transfer_value:1,country:1,
                company:1,
                proj_site:{$cond: { if: {$not: "$transfer_label"},
                    then:  {_id:"$proj_site._id",name:"$proj_site.name",
                        type:'$proj_site.type'},
                    else: {name:"$transfer_label",
                        type:'$transfer_level'}
                }}, transfer_label:1
            }},
            {$skip: skip},
            {$limit: limit}
        ]).exec(function(err, transfers) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Transfers by Project');
                callback(null, data);
            }else {
                if (transfers.length > 0) {
                    data.transfers = transfers;
                    callback(null,data);
                } else {
                    data.errorList.push({type: 'Transfers by Project', message: 'transfers by project not found'})
                    callback(null, data);
                }
            }
        });
    }
};

//Get payment by recipient
exports.getTransfersByGov = function(req, res) {
    var data = {},
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);
    req.query.transfer_level='country';
    if(req.query.transfer_year){req.query.transfer_year = parseInt(req.query.transfer_year);}
    if(req.query.company){req.query.company = mongoose.Types.ObjectId(req.query.company);}

    data.errorList = [];
    data.transfers = [];
    data.count = 0;

    async.waterfall([
        transferCount,
        getTransferSet
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err,'Transfers');
            return res.send(data);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function transferCount(callback) {
        Transfer.find(req.query).count().exec(function(err, transfersCount) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Transfers');
                return res.send(data);
            } else if (transfersCount == 0) {
                data.errorList.push({type: 'Transfers by Recipient', message: 'transfers by recipient not found'})
                return res.send(data);
            } else {
                data.count = transfersCount;
                callback(null, data);
            }
        });
    }
    function getTransferSet(data,  callback) {
        Transfer.aggregate([
                {$match:req.query},
                {$lookup: {from: "projects",localField: "project",foreignField: "_id",as: "project"}},
                {$lookup: {from: "companies",localField: "company",foreignField: "_id",as: "company"}},
                {$lookup: {from: "sites",localField: "site",foreignField: "_id",as: "site"}},
                {$lookup: {from: "countries",localField: "country",foreignField: "_id",as: "country"}},
                {$unwind: {"path": "$country", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$project", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$company", "preserveNullAndEmptyArrays": true}},
                {$unwind: {"path": "$site", "preserveNullAndEmptyArrays": true}},
                {$project:{_id:1,transfer_year:1,
                    country: { name:"$country.name",iso2:"$country.iso2"},
                    company:{$cond: { if:  {$not: "$company" }, then: '', else: {_id:"$company._id",company_name:"$company.company_name"}}},
                    proj_site:{$cond: { if:  {$not: "$site" },
                        then:  {_id:"$project.proj_id",name:"$project.proj_name",
                            type:{$cond: { if: {$not: "$project"}, then: '', else: 'project'}}},
                        else: {_id:"$site._id",name:"$site.site_name",
                            type:{$cond: { if: { $gte: [ "$site.field", true ] }, then: 'field', else: 'site' }}}}
                    },
                    transfer_level:1,transfer_type:1,transfer_unit:1,transfer_value:1,transfer_gov_entity:1
                }},
                {$group:{
                    _id:'$_id',
                    transfer_year:{$first:'$transfer_year'},
                    transfer_type:{$first:'$transfer_type'},
                    transfer_unit:{$first:'$transfer_unit'},
                    transfer_value:{$first:'$transfer_value'},
                    transfer_level:{$first:'$transfer_level'},
                    transfer_gov_entity:{$first:'$transfer_gov_entity'},
                    country:{$first:'$country'},
                    company:{$first:'$company'},
                    proj_site:{$first:'$proj_site'}
                }},
                {$skip: skip},
                {$limit: limit}
        ]).exec(function(err, transfers) {
                if (err) {
                    data.errorList = errors.errorFunction(err,'Transfers by Recipient');
                    callback(null, data);
                }else {
                    if (transfers.length > 0) {
                        data.transfers = transfers;
                        callback(null, data);
                    } else {
                        data.errorList.push({type: 'Transfers by Recipient', message: 'transfers by recipient not found'})
                        callback(null, data);
                    }
                }
            });
    }
};