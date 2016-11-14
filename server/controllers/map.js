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
    mongoose 		= require('mongoose'),
    _               = require("underscore"),
    request         = require('request');
exports.getCoordinateCountryByID = function(req, res) {
    var _id = mongoose.Types.ObjectId(req.params.id);
    var country={}, site_counter, site_len;
    var type = req.params.type;
    async.waterfall([
        getSites,
        getCompanyLinks,
        getCompanyGroupLinks,
        getGroupCompanyLinks
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
    function getSites(callback) {
        country.proj_coordinates = [];
        country.location = [];
        if (type == 'country') {
            Site.aggregate([
                {$unwind: '$site_country'},
                {$match:{'site_country.country':_id,"site_coordinates":{ $exists: true,$nin: [ null ]}}},
                {$unwind:'$site_coordinates'},
                {$project:{
                    'lat':  { "$arrayElemAt": [ "$site_coordinates.loc", -2 ] },
                    'lng': { "$arrayElemAt": [ "$site_coordinates.loc", -1 ] },
                    'message': "$site_name",
                    'timestamp': "$site_coordinates.timestamp",
                    'type': {$cond: { if: { $gte: [ "$field", true ] }, then: 'field', else: 'site' }}
                }}
            ]).exec(function (err, sites) {
                console.log(sites)
                country.proj_coordinates = sites;
                callback(null, country)
            });
        }else {
            callback(null, country);
        }
    }
    function getCompanyLinks(map, callback) {
        if (type == 'company') {
            map.proj_coordinates = [];
            Link.find({company: req.params.id})
                .populate('site project')
                .exec(function (err, links) {
                    var link_len = links.length;
                    var link_counter = 0;
                    if (link_len > 0) {
                        links.forEach(function (link) {
                            ++link_counter;
                            var entity = _.without(link.entities, 'company')[0];
                            switch (entity) {
                                case 'site':
                                    if (link.site.field && link.site.site_coordinates.length > 0) {
                                        link.site.site_coordinates.forEach(function (loc) {
                                            if(loc && loc.loc) {
                                                map.proj_coordinates.push({
                                                    'lat': loc.loc[0],
                                                    'lng': loc.loc[1],
                                                    'message': link.site.site_name,
                                                    'timestamp': loc.timestamp,
                                                    'type': 'field',
                                                    'id': link.site._id
                                                });
                                            }
                                        });
                                        map.proj_coordinates = _.map(_.groupBy(map.proj_coordinates, function (doc) {
                                            return doc._id;
                                        }), function (grouped) {
                                            return grouped[0];
                                        });
                                    } else if (!link.site.field && link.site.site_coordinates.length > 0) {
                                        link.site.site_coordinates.forEach(function (loc) {
                                            if(loc && loc.loc) {
                                                map.proj_coordinates.push({
                                                    'lat': loc.loc[0],
                                                    'lng': loc.loc[1],
                                                    'message': link.site.site_name,
                                                    'timestamp': loc.timestamp,
                                                    'type': 'site',
                                                    'id': link.site._id
                                                });
                                            }
                                        });
                                        map.proj_coordinates = _.map(_.groupBy(map.proj_coordinates, function (doc) {
                                            return doc._id;
                                        }), function (grouped) {
                                            return grouped[0];
                                        });
                                    }
                                    break;
                                default:
                                    console.log(entity, 'link skipped...');
                            }
                            if (link_counter == link_len) {
                                callback(null, map);
                            }
                        });
                    } else {
                        callback(null, map);
                    }
                });
        }else {
            callback(null, map);
        }
    }
    function getCompanyGroupLinks(map,callback) {
        if(type=='group') {
            map.companies=[];
            map.proj_coordinates = [];
            Link.find({company_group: req.params.id})
                .populate('company', '_id company_name')
                .populate('commodity')
                .exec(function (err, links) {
                    var link_len = links.length;
                    if (link_len > 0) {
                        var link_counter = 0;
                        links.forEach(function (link) {
                            ++link_counter;
                            var entity = _.without(link.entities, 'company_group')[0];
                            switch (entity) {
                                case 'company':
                                    if (!map.companies.hasOwnProperty(link.company.company_name)) {
                                        map.companies.push({
                                            _id: link.company._id,
                                            company_name: link.company.company_name
                                        });
                                    }
                                    break;
                                default:
                                    console.log(entity, 'link skipped...');
                            }
                            if (link_counter == link_len) {
                                callback(null, map);
                            }
                        });
                    } else {
                        callback(null, map);

                    }
                });
        } else{
            callback(null, map)
        }
    }
    function getGroupCompanyLinks(companyGroup,callback) {
        if(type == 'group') {
            var company_counter = 0;
            var company_len = companyGroup.companies.length;
            if (company_len > 0) {
                companyGroup.companies.forEach(function (company) {
                    Link.find({company: company._id})
                        .populate('contract')
                        .deepPopulate('concession.concession_country.country concession.concession_commodity.commodity site.site_country.country site.site_commodity.commodity project.proj_country.country project.proj_commodity.commodity source.source_type_id')
                        .exec(function (err, links) {
                            var link_len = links.length;
                            ++company_counter;
                            var link_counter = 0;
                            if (link_len > 0) {
                                links.forEach(function (link) {
                                    ++link_counter;
                                    var entity = _.without(link.entities, 'company')[0];
                                    switch (entity) {
                                        case 'site':
                                            if (link.site.field && link.site.site_coordinates.length > 0) {
                                                link.site.site_coordinates.forEach(function (loc) {
                                                    if(loc && loc.loc) {
                                                        companyGroup.proj_coordinates.push({
                                                            'lat': loc.loc[0],
                                                            'lng': loc.loc[1],
                                                            'message': link.site.site_name,
                                                            'timestamp': loc.timestamp,
                                                            'type': 'field',
                                                            'id': link.site._id
                                                        });
                                                    }
                                                });
                                            } else if (!link.site.field && link.site.site_coordinates.length > 0) {
                                                link.site.site_coordinates.forEach(function (loc) {
                                                    if(loc && loc.loc) {
                                                        companyGroup.proj_coordinates.push({
                                                            'lat': loc.loc[0],
                                                            'lng': loc.loc[1],
                                                            'message': link.site.site_name,
                                                            'timestamp': loc.timestamp,
                                                            'type': 'site',
                                                            'id': link.site._id
                                                        });
                                                    }
                                                });
                                            }
                                            break;
                                        default:
                                    }
                                    if (company_counter == company_len && link_counter == link_len) {
                                        callback(null, companyGroup);
                                    }
                                });
                            } else {
                                if (company_counter == company_len && link_counter == link_len) {
                                    callback(null, companyGroup);
                                }
                            }
                        });
                });
            } else {
                callback(null, companyGroup);
            }
        } else{
            callback(null, companyGroup)
        }
    }
};
