var Commodity 		=   require('mongoose').model('Commodity'),
    Link 	        =   require('mongoose').model('Link'),
    Project 	    =   require('mongoose').model('Project'),
    Site 	        =   require('mongoose').model('Site'),
    async           =   require('async'),
    _               =   require("underscore"),
    request         =   require('request'),
    encrypt 		=   require('../utilities/encryption');

exports.getCommodities = function(req, res) {
    var commodity_len, link_len, commodity_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);
    async.waterfall([
        commodityCount,
        getCommoditySet,
        getCommodityLinks
        //getContractCount
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else{
            res.send(result);
        }
    });

    function commodityCount(callback) {
        Commodity.find({}).count().exec(function(err, commodity_count) {
            if(commodity_count) {
                callback(null, commodity_count);
            } else {
                callback(err);
            }
        });
    }
    function getCommoditySet(commodity_count, callback) {
        Commodity.find(req.query, {commodity_name: 1, commodity_id: 1, commodity_type: 1})
            .sort({
                commodity_name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(function(err, commodities) {
                if(commodities) {
                    callback(null, commodity_count, commodities);
                } else {
                    callback(err);
                }
            });
    }
    function getCommodityLinks(commodity_count, commodities, callback) {
        commodity_len = commodities.length;
        commodity_counter = 0;
        if(commodity_len>0) {
            commodities.forEach(function (c) {
                var models = [
                    {name:'Concession',field:{'concession_commodity.commodity':c._id},params:'concession'},
                    {name:'Project',field:{'proj_commodity.commodity':c._id},params:'project'},
                    {name:'Site',field:{'site_commodity.commodity':c._id,field:true},params:'field'},
                    {name:'Site',field:{'site_commodity.commodity':c._id,field:false},params:'site'}
                ];
                c.concessions=0;
                c.projects=0;
                c.fields=0;
                c.sites=0;
                c.contract =0;
                models_len = models.length;
                async.eachOf(models, function(model) {
                    ++commodity_counter;
                    models_counter=0;
                    var name = require('mongoose').model(model.name);
                    var $field = model.field;
                    name.find($field).count().exec(function (err, count) {
                        ++models_counter;
                        if(model.params=='concession'){c.concessions = count;}
                        if(model.params=='project'){c.projects = count;}
                        if(model.params=='field'){c.fields = count;}
                        if(model.params=='site'){c.sites =count;}
                        if(commodity_counter==models_counter) {
                            callback(null, {data: commodities, count: commodity_count});
                        }
                    });
                });
            });
        }
    }
    //function getContractCount(commodity_count, commodities, callback) {
    //	commodity_len = commodities.length;
    //	commodity_counter = 0;
    //	if(commodity_len>0) {
    //		commodities.forEach(function (c) {
    //			c.sites=0;
    //			c.fields=0;
    //			Site.find({'site_commodity.commodity': c._id})
    //				.exec(function (err, sites) {
    //					++commodity_counter;
    //					link_len = sites.length;
    //					link_counter = 0;
    //					sites.forEach(function (site) {
    //						if(site.field){
    //							c.fields += 1;
    //						}else{
    //							c.sites += 1;
    //						}
    //						++link_counter;
    //					});
    //					if (commodity_counter == commodity_len && link_counter == link_len) {
    //						callback(null,{data: commodities, count: commodity_count});
    //					}
    //				});
    //		});
    //	} else{
    //		callback(null,{data: commodities, count: commodity_count});
    //	}
    //}
};

exports.getCommodityByID = function(req, res) {
    var link_counter, link_len,
        commodity={};

    async.waterfall([
        getCommodity
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else{
            res.send(result);
        }
    });

    function getCommodity(callback) {
        Commodity.findOne({commodity_id:req.params.id})
            .populate('commodity_aliases', ' _id code reference')
            .lean()
            .exec(function(err, commodity) {
                if(commodity) {
                    callback(null, commodity);
                } else {
                    callback(err);
                }
            });
    }
};

exports.createCommodity = function(req, res, next) {
    var commodityData = req.body;
    Commodity.create(commodityData, function(err, commodity) {
        if(err){
            res.status(400);
            err = new Error('Error');
            return res.send({reason:err.toString()})
        }else {
            res.send();
        }
    });
};

exports.updateCommodity = function(req, res) {
    var commodityUpdates = req.body;
    Commodity.findOne({_id:req.body._id}).exec(function(err, commodity) {
        if(err) {
            res.status(400);
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
        commodity.commodity_name= commodityUpdates.commodity_name;
        commodity.save(function(err) {
            if(err) {
                err = new Error('Error');
                return res.send({reason: err.toString()});
            } else {
                res.send();
            }
        })
    });
};

exports.deleteCommodity = function(req, res) {
    Commodity.remove({_id: req.params.id}, function(err) {
        if(!err) {
            res.send();
        }else{
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
    });
};