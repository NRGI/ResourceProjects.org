var Commodity 		=   require('mongoose').model('Commodity'),
    Link 	        =   require('mongoose').model('Link'),
    Project 	    =   require('mongoose').model('Project'),
    Site 	        =   require('mongoose').model('Site'),
    async           =   require('async'),
    _               =   require("underscore"),
    request         =   require('request'),
    mongoose 		=   require('mongoose'),
    errors 	        =   require('./errorList');

//Get all commodities
exports.getCommodities = function(req, res) {
    var data = {},
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);
    data.errorList = [];
    data.commodities = [];
    data.count = 0;
    async.waterfall([
        commodityCount,
        getCommoditySet,
        getProjectCount
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err, 'Commodity');
            res.send(data);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });

    function commodityCount(callback) {
        Commodity.find({}).count().exec(function (err, commodity_count) {
            if (err) {
                data.errorList = errors.errorFunction(err, 'Commodity');
                res.send(data);
            } else if (commodity_count == 0) {
                data.errorList = errors.errorFunction(err, 'Commodity not found');
                res.send(data);
            } else {
                data.count = commodity_count;
                callback(null, data);
            }
        });
    }

    function getCommoditySet(data, callback) {
        Commodity.aggregate([
            {$sort: {commodity_name: -1}},
            {$project: {_id: 1, commodity_name: 1, commodity_id: 1, commodity_type: 1,
                projects:{$literal:0}
            }},
            {$skip: skip},
            {$limit: limit}
        ]).exec(function (err, commodities) {
            if (err) {
                data.errorList = errors.errorFunction(err, 'Commodities');
                res.send(data);
            }
            else {
                if (commodities && commodities.length > 0) {
                    data.commodities = commodities;
                    callback(null, data);
                } else {
                    data.errorList.push({type: 'Commodities', message: 'commodities not found'})
                    res.send(data)
                }
            }
        });
    }

    function getProjectCount(data, callback) {
        var commoditiesId = _.pluck(data.commodities, '_id');
        if (commoditiesId.length > 0) {
            Project.aggregate([
                {$match: {$or: [{'proj_commodity.commodity': {$in: commoditiesId}}]}},
                {$unwind:'$proj_commodity'},
                {$group:{
                    _id:'$proj_commodity.commodity',
                    project:{$addToSet:'$proj_id'}
                }},
                {$project:{_id:1, proj_count:{$size:'$project'}}}
            ]).exec(function(err, projects) {
                if (err) {
                    data.errorList = errors.errorFunction(err,'Projects');
                    callback(null,  data);
                }
                else {
                    if (projects && projects.length>0) {
                        _.map(data.commodities, function (commodity) {
                            var list = _.find(projects, function (link) {
                                return link._id.toString() == commodity._id.toString();
                            });
                            if (list) {
                                commodity.projects = list.proj_count;
                            }
                            return commodity;
                        });
                        callback(null,  data);
                    } else {
                        data.errorList.push({type: 'Projects', message: 'projects not found'})
                        callback(null,  data);
                    }
                }
            })
        }
    }
}

//Get commodity by commodity_id
exports.getCommodityByID = function(req, res) {
    var data = {};
    data.commodity = [];

    async.waterfall([
        getCommodity
    ], function (err, result) {
        if (err) {
            data.errorList = errors.errorFunction(err, 'Projects');
            res.send(data);
        } else{
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });

    function getCommodity(callback) {
        Commodity.aggregate([
            {$match:{commodity_id:req.params.id}}
        ]).exec(function(err, commodity) {
            if (err) {
                data.errorList = errors.errorFunction(err,'Commodity');
                res.send(data);
            }
            else {
                if (commodity && commodity.length>0) {
                    data.commodity = commodity[0];
                    callback(null,  data);
                } else {
                    data.errorList.push({type: 'Commodity', message: 'Commodity '+ req.params.id+' not found'})
                    res.send(data)
                }
            }
                if(commodity) {
                    callback(null, data);
                } else {
                    callback(err);
                }
            });
    }
};
