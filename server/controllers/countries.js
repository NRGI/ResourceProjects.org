'use strict';

var Country 		= require('mongoose').model('Country'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Link            = require('mongoose').model('Link'),
    Project 		= require('mongoose').model('Project'),
    Company 		= require('mongoose').model('Company'),
    Site 			= require('mongoose').model('Site'),
    Concession 		= require('mongoose').model('Concession'),
    Production 		= require('mongoose').model('Production'),
    Commodity 		= require('mongoose').model('Commodity'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getCountries = function(req, res) {
    var countries_len, countries_counter, final_country_set,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip),
        models = [
            {name:'Site',field:'site_country.country',params:'false',count:'site_count'},
            {name:'Site',field:'site_country.country',params:'true',count:'field_count'},
            {name:'Concession',field:'concession_country.country',count:'concession_count'},
            {name:'Transfer',field:'country',count:'transfer_count'},
            {name:'Production',field:'country',count:'production_count'}
        ];

    async.waterfall([
        countryCount,
        getCountrySet,
        getProjectCounts,
        getSiteCounts,
        getFieldCounts,
        getConcessionCount,
        getTransferCount,
        getRelevantCountries
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });

    function countryCount(callback) {
        Country.find({}).count().exec(function(err, country_count) {
            if (err) {
                callback(err);
            } else if (!country_count) {
                callback(null, 0);
            } else {
                callback(null, country_count);
            }
        });
    }
    function getCountrySet(country_count, callback) {
        Country.find(req.query)
            .sort({
                name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(function(err, countries) {
                if (err) {
                    callback(err);
                } else if (!countries) {
                    callback(null, country_count, []);
                } else {
                    callback(null, country_count, countries);
                }
            });
    }
    function getProjectCounts(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        _.each(countries, function(country) {
            Project.find({'proj_country.country': country._id})
                .count()
                .exec(function (err, count){
                    ++countries_counter;
                    country.project_count = count;
                    if (countries_counter == countries_len) {
                        callback(null, country_count, countries);
                    }
                });
        });
    }
    function getSiteCounts(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        _.each(countries, function(country) {
            Site.find({'site_country.country': country._id, field:false})
                .count()
                .exec(function (err, count){
                    ++countries_counter;
                    country.site_count = count;
                    if (countries_counter == countries_len) {
                        callback(null, country_count, countries);
                    }
                });
        });
    }
    function getFieldCounts(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        _.each(countries, function(country) {
            Site.find({'site_country.country': country._id, field:true})
                .count()
                .exec(function (err, count){
                    ++countries_counter;
                    country.field_count = count;
                    if (countries_counter == countries_len) {
                        callback(null, country_count, countries);
                    }
                });
        });
    }
    function getConcessionCount(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        _.each(countries, function(country) {
            Concession.find({'concession_country.country': country._id})
                .count()
                .exec(function (err, count){
                    ++countries_counter;
                    country.concession_count = count;
                    if (countries_counter == countries_len) {
                        callback(null, country_count, countries);
                    }
                });
        });
    }
    function getTransferCount(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        _.each(countries, function(country) {
            Transfer.find({'country': country._id})
                .count()
                .exec(function (err, count){
                    ++countries_counter;
                    country.transfer_count = count;
                    if (countries_counter == countries_len) {
                        // callback(null, {data:countries, count:country_count})
                        callback(null, country_count, countries);
                    }
                });
        });
    }
    function getRelevantCountries(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        final_country_set = [];
        _.each(countries, function(country) {
            if (country.project_count!==0 || country.site_count!==0 || country.field_count!==0 || country.concession_count!==0 || country.transfer_count!==0) {
                final_country_set.push(country);
            } else {
                --country_count;
            }
        });
        callback(null, {data:final_country_set, count:country_count})
    }
};

exports.getCountryByID = function(req, res) {
    var concession_len, concession_counter, site_counter, site_len, project_counter, project_len;

    async.waterfall([
        getCountry,
        getProjects,
        getSites,
        getConcessions
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result)
        }
    });

    function getCountry(callback) {
        Country.findOne({iso2:req.params.id})
            .populate('country_commodity.commodity')
            .lean()
            .exec(function(err, country) {
                if(country) {
                    callback(null, country);
                } else {
                    res.send(err);
                }
            });
    }
    function getProjects(country, callback) {
        country.proj_coordinates = [];
        country.projects = [];
        country.location = [];
        country.commodities = [];
        country.sources = {};
        country.transfers_query = [country._id];
        country.site_coordinates = {sites: [], fields: []};
        Project.find({'proj_country.country': country._id})
            .populate('proj_country.country')
            .populate('proj_aliases', ' _id alias')
            .populate('proj_commodity.commodity')
            .exec(function (err, project) {
                project_len = project.length;
                project_counter= 0;
                if (project_len>0) {
                    _.each(project, function (proj) {
                        ++project_counter;
                        proj.proj_coordinates.forEach(function (loc) {
                            country.proj_coordinates.push({
                                'lat': loc.loc[0],
                                'lng': loc.loc[1],
                                'message': proj.proj_name,
                                'timestamp': loc.timestamp,
                                'type': 'project',
                                'id': proj.proj_id
                            });
                        });
                        if (proj.proj_commodity.length>0) {
                            if (_.where(country.commodities, {_id: _.last(proj.proj_commodity).commodity._id}).length<1) {
                                country.commodities.push({
                                    _id: _.last(proj.proj_commodity).commodity._id,
                                    commodity_name: _.last(proj.proj_commodity).commodity.commodity_name,
                                    commodity_type: _.last(proj.proj_commodity).commodity.commodity_type,
                                    commodity_id: _.last(proj.proj_commodity).commodity.commodity_id
                                });
                            }
                        }
                        if (project_counter == project_len) {
                            callback(null, country);
                        }
                    });
                } else {
                    callback(null, country);
                }
            });
    }
    function getSites(country, callback) {
        country.sites = [];
        Site.find({'site_country.country': country._id})
            .populate('site_commodity.commodity')
            .exec(function (err, sites) {
                site_len = sites.length;
                site_counter = 0;
                if (site_len>0) {
                    _.each(sites, function (site) {
                        ++site_counter;
                        if (site.field && site.site_coordinates.length>0) {
                            site.site_coordinates.forEach(function (loc) {
                                country.proj_coordinates.push({
                                    'lat': loc.loc[0],
                                    'lng': loc.loc[1],
                                    'message': site.site_name,
                                    'timestamp': loc.timestamp,
                                    'type': 'field',
                                    'id': site._id
                                });
                            });
                        } else if (!site.field && site.site_coordinates.length>0) {
                            site.site_coordinates.forEach(function (loc) {
                                country.proj_coordinates.push({
                                    'lat': loc.loc[0],
                                    'lng': loc.loc[1],
                                    'message': site.site_name,
                                    'timestamp': loc.timestamp,
                                    'type': 'site',
                                    'id': site._id
                                });
                            });
                        }
                        if (site.site_commodity.length>0) {
                            if (_.where(country.commodities, {_id: _.last(site.site_commodity).commodity._id}).length<1) {
                                country.commodities.push({
                                    _id: _.last(site.site_commodity).commodity._id,
                                    commodity_name: _.last(site.site_commodity).commodity.commodity_name,
                                    commodity_type: _.last(site.site_commodity).commodity.commodity_type,
                                    commodity_id: _.last(site.site_commodity).commodity.commodity_id
                                });
                            }
                        }

                        if(site_counter==site_len){
                            callback(null, country);
                        }
                    });
                } else {
                    if(site_counter==site_len){
                        callback(null, country);
                    }
                }
            });
    }
    function getConcessions(country, callback) {
        concession_counter = 0;
        Concession.find({'concession_country.country': country._id})
            .populate('concession_country.country')
            .populate('concession_commodity.commodity')
            .exec(function (err, concessions) {
                if (concessions.length>0) {
                    concession_len = concessions.length;
                    _.each(concessions, function (concession) {
                        ++concession_counter;
                        if (concession.concession_commodity.length>0) {
                            if (_.where(country.commodities, {_id: _.last(concession.concession_commodity).commodity._id}).length<1) {
                                country.commodities.push({
                                    _id: _.last(concession.concession_commodity).commodity._id,
                                    commodity_name: _.last(concession.concession_commodity).commodity.commodity_name,
                                    commodity_type: _.last(concession.concession_commodity).commodity.commodity_type,
                                    commodity_id: _.last(concession.concession_commodity).commodity.commodity_id
                                });
                            }
                        }
                        if (concession_counter == concession_len) {
                            callback(null, country);
                        }
                    });
                } else {
                    callback(null, country);
                }
            });
    }
};

exports.createCountry = function(req, res, next) {
    var countryData = req.body;
    Country.create(countryData, function(err, country) {
        if(err){
            res.status(400);
            err = new Error('Error');
            return res.send({reason:err.toString()})
        } else{
            res.send();
        }
    });
};

exports.updateCountry = function(req, res) {
    var countryUpdates = req.body;
    Country.findOne({_id:req.body._id}).exec(function(err, country) {
        if(err) {
            res.status(400);
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
        country.iso2= countryUpdates.iso2;
        country.name= countryUpdates.name;
        //country.country_aliases= countryUpdates.country_aliases;
        //country.country_type= countryUpdates.country_type;
        //country.country_commodity= countryUpdates.country_commodity;
        country.save(function(err) {
            if(err) {
                err = new Error('Error');
                return res.send({reason: err.toString()});
            } else{
                res.send();
            }
        })
    });
};

exports.deleteCountry = function(req, res) {
    Country.remove({_id: req.params.id}, function(err) {
        if(!err) {
            res.send();
        }else{
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
    });
};