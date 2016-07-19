var Site 		    = require('mongoose').model('Site'),
    Country 		= require('mongoose').model('Country'),
    Source	 		= require('mongoose').model('Source'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request'),
    encrypt 		= require('../utilities/encryption');

exports.getSites = function(req, res) {
    var site_len, link_len, site_counter, link_counter,
        limit = Number(req.params.limit),
        field = req.params.field,
        skip = Number(req.params.skip);

    async.waterfall([
        siteCount,
        getSiteSet,
        getSiteLinks,
        getTransfersCount,
        getProductionCount
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
    function siteCount(callback) {
        Site.find({field:field}).count().exec(function(err, site_count) {
            if(site_count) {
                callback(null, site_count);
            } else {
                callback(null, 0);
            }
        });
    }
    function getSiteSet(site_count, callback) {
        Site.find({field:field})
            .sort({
               proj_name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .populate('site_country.country', '_id iso2 name')
            .populate('site_commodity.commodity', ' _id commodity_name commodity_id commodity_type')
            .lean()
            .exec(function(err, sites) {
                if(sites.length>0) {
                    //TODO clean up returned data if we see performance lags
                    callback(null, site_count, sites);
                } else {
                    callback(null, [], sites);
                }
            });
    }
    function getSiteLinks(site_count, sites, callback) {
        site_len = sites.length;
        site_counter = 0;
        if(site_len>0) {
            sites.forEach(function (site) {
                var commodity = site.site_commodity;
                site.site_commodity = [];
                if (commodity.length>0) {
                    if (_.where(commodity, {_id: _.last(commodity).commodity._id}).length<1) {
                        site.site_commodity.push({
                            _id: _.last(commodity).commodity._id,
                            commodity_name: _.last(commodity).commodity.commodity_name,
                            commodity_type: _.last(commodity).commodity.commodity_type,
                            commodity_id: _.last(commodity).commodity.commodity_id
                        });
                    }
                }
                site.transfers_query = [site._id];
                site.source_type = {p: false, c: false};
                Link.find({site: site._id})
                    .populate('company')
                    .deepPopulate('source.source_type_id project.proj_commodity.commodity site.site_commodity.commodity concession.concession_commodity.commodity')
                    .exec(function (err, links) {
                        ++site_counter;
                        link_len = links.length;
                        link_counter = 0;
                        site.company_count = 0;
                        site.contract_count = 0;
                        site.project_count = 0;
                        site.field_count = 0;
                        site.site_count = 0;
                        site.concession_count = 0;
                        site.transfers_query = [site._id];
                        links.forEach(function (link) {
                            ++link_counter;
                            var entity = _.without(link.entities, 'site')[0];
                            if (!site.source_type.p || !site.source_type.c) {
                                if(link.source!=null) {
                                    if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                        site.source_type.c = true;
                                    } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                        site.source_type.c = true;
                                    } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                        site.source_type.p = true;
                                    }
                                }
                            }
                            switch (entity) {
                                case 'company':
                                    site.company_count += 1;
                                    break;
                                case 'contract':
                                    site.contract_count += 1;
                                    break;
                                case 'site':
                                    if (link.site.field) {
                                        site.site_count += 1;
                                    } else if (!link.site.field) {
                                        site.field_count += 1;
                                    }
                                    if (!_.contains(site.transfers_query, link.site)) {
                                        site.transfers_query.push(link.site._id);
                                    }
                                    if (link.site.site_commodity.length>0) {
                                        if (_.where(site.site_commodity, {_id:_.last(link.site.site_commodity).commodity._id}).length<1) {
                                            site.site_commodity.push({
                                                _id: _.last(link.site.site_commodity).commodity._id,
                                                commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                                commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                                commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                            });
                                        }
                                    }
                                    break;
                                case 'project':
                                    site.project_count += 1;
                                    if (!_.contains(site.transfers_query, link.project)) {
                                        site.transfers_query.push(link.project._id);
                                    }
                                    if (link.project.proj_commodity.length>0) {
                                        if (_.where(site.site_commodity, {_id:_.last(link.project.proj_commodity)._id}).length<1) {
                                            site.site_commodity.push({
                                                _id: _.last(link.project.proj_commodity).commodity._id,
                                                commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                                commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                                commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                            });
                                        }
                                    }
                                    break;
                                case 'concession':
                                    if (link.concession.concession_commodity.length>0) {
                                        if (_.where(site.site_commodity, {_id:_.last(link.concession.concession_commodity)._id}).length<1) {
                                            site.site_commodity.push({
                                                _id: _.last(link.concession.concession_commodity).commodity._id,
                                                commodity_name: _.last(link.concession.concession_commodity).commodity.commodity_name,
                                                commodity_type: _.last(link.concession.concession_commodity).commodity.commodity_type,
                                                commodity_id: _.last(link.concession.concession_commodity).commodity.commodity_id

                                            });
                                        }
                                    }
                                    site.concession_count += 1;
                                    break;
                                default:
                                    console.log(entity, 'skipped...');
                            }
                        });
                        if (site_counter == site_len && link_counter == link_len) {
                            callback(null, site_count, sites);
                        }
                    });
            });
        } else{
            callback(null, site_count, sites);
        }
    }
    function getTransfersCount(site_count, sites, callback) {
        site_len = sites.length;
        site_counter = 0;

        _.each(sites, function(site) {
            Transfer.find({$or: [
                    {project:{$in: site.transfers_query}},
                    {site:{$in: site.transfers_query}}]})
                .count()
                .exec(function (err, transfer_count) {
                    ++site_counter;
                    site.transfer_count = transfer_count;
                    if (site_counter === site_len) {
                        callback(null, site_count, sites);
                    }
                });

        });
    }
    function getProductionCount(site_count, sites, callback) {
        site_len = sites.length;
        site_counter = 0;

        _.each(sites, function(site) {
            Production.find({$or: [
                    {project:{$in: site.transfers_query}},
                    {site:{$in: site.transfers_query}}]})
                .count()
                .exec(function (err, production_count) {
                    ++site_counter;
                    site.production_count = production_count;
                    if (site_counter === site_len) {
                        // callback(null, site_count, sites);
                        // res.send({data: sites, count: site_count});
                        callback(null, {data: sites, count: site_count});
                    }
                });

        });
    }
};

exports.getSiteByID = function(req, res) {
    var proj_len, proj_counter, link_counter, link_len, companies_len, companies_counter, transfers_counter, transfers_len, production_counter, production_len;

    async.waterfall([
        getSite,
        getSiteLinks,
        getProjectLinks
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
	function getSite(callback) {
        Site.findOne({_id:req.params.id})
            .populate('site_country.country', '_id iso2 name')
            .populate('site_commodity.commodity', ' _id commodity_name commodity_id commodity_type')
            .populate('site_aliases', '_id alias')
            .lean()
            .exec(function(err, site) {
                if(site) {
                    callback(null, site);
                } else {
                    callback(err);
                }
            });
    }
    function getSiteLinks(site, callback) {
        site.concessions = [];
        site.contracts = [];
        site.sites = [];
        site.projects = [];
        site.proj_coordinates=[];
        site.coordinates=[];
        site.source_type = {p: false, c: false};
        if (site.field && site.site_coordinates.length>0) {
            site.site_coordinates.forEach(function (loc) {
                site.coordinates.push({
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
                site.coordinates.push({
                    'lat': loc.loc[0],
                    'lng': loc.loc[1],
                    'message': site.site_name,
                    'timestamp': loc.timestamp,
                    'type': 'site',
                    'id': site._id
                });
            });
        }
        var commodity = site.site_commodity;
        site.site_commodity = [];
        if (commodity.length>0) {
            if (_.where(commodity, {_id: _.last(commodity).commodity._id}).length<1) {
                site.site_commodity.push({
                    _id: _.last(commodity).commodity._id,
                    commodity_name: _.last(commodity).commodity.commodity_name,
                    commodity_type: _.last(commodity).commodity.commodity_type,
                    commodity_id: _.last(commodity).commodity.commodity_id
                });
            }
        }
        Link.find({site: site._id})
            .populate('company contract concession site project company_group')
            .deepPopulate('project.proj_country.country project.proj_commodity.commodity site.site_commodity.commodity site.site_country.country concession.concession_country.country concession.concession_commodity.commodity source.source_type_id')
            .exec(function(err, links) {
                if(links.length>0) {
                    link_len = links.length;
                    link_counter = 0;
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'site')[0];
                        if (!site.source_type.p || !site.source_type.c) {
                            if(link.source!=null) {
                                if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                    site.source_type.c = true;
                                } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                    site.source_type.c = true;
                                } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                    site.source_type.p = true;
                                }
                            }
                        }
                        switch (entity) {
                            case 'project':
                                site.projects.push({
                                    _id: link.project._id,
                                    proj_id: link.project.proj_id,
                                    proj_name: link.project.proj_name
                                });
                                //site.projects.push(link.project);
                                link.project.proj_coordinates.forEach(function (loc) {
                                    site.coordinates.push({
                                        'lat': loc.loc[0],
                                        'lng': loc.loc[1],
                                        'message': link.project.proj_name,
                                        'timestamp': loc.timestamp,
                                        'type': 'project',
                                        'id': link.project.proj_id
                                    });
                                });
                                if (link.project.proj_commodity.length>0) {
                                    if (_.where(site.site_commodity, {_id: _.last(link.project.proj_commodity).commodity._id}).length<1) {
                                        site.site_commodity.push({
                                            _id: _.last(link.project.proj_commodity).commodity._id,
                                            commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                        });
                                    }
                                }
                                break;
                            case 'site':
                                site.sites.push({
                                    _id: link.site._id,
                                    field: link.site.field,
                                    site_name: link.site.site_name
                                });
                                if (link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        site.proj_coordinates.fields.push({
                                            'lat': loc.loc[0],
                                            'lng': loc.loc[1],
                                            'message': link.site.site_name,
                                            'timestamp': loc.timestamp,
                                            'type': 'field',
                                            'id': link.site._id
                                        });
                                    });
                                } else if (!link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        site.proj_coordinates.sites.push({
                                            'lat': loc.loc[0],
                                            'lng': loc.loc[1],
                                            'message': link.site.site_name,
                                            'timestamp': loc.timestamp,
                                            'type': 'site',
                                            'id': link.site._id
                                        });
                                    });
                                }
                                if (link.site.site_commodity.length>0) {
                                    if (_.where(site.site_commodity, {_id: _.last(link.site.site_commodity).commodity._id}).length<1) {
                                        site.site_commodity.push({
                                            _id: _.last(link.site.site_commodity).commodity._id,
                                            commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                        });
                                    }
                                }
                                break;
                            case 'concession':
                                site.concessions.push({
                                    _id: link.concession._id,
                                    concession_name: link.concession.concession_name
                                });
                                if (link.concession.concession_commodity.length>0) {
                                    if (_.where(site.site_commodity, {_id: _.last(link.concession.concession_commodity).commodity._id}).length<1) {
                                        site.site_commodity.push({
                                            _id: _.last(link.concession.concession_commodity).commodity._id,
                                            commodity_name: _.last(link.concession.concession_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.concession.concession_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.concession.concession_commodity).commodity.commodity_id
                                        });
                                    }
                                }
                                break;
                            case 'contract':
                                site.contracts.push(link.contract);
                                break;
                            default:
                                console.log('switch (entity) error');
                        }
                        if(link_counter == link_len) {
                            callback(null, site);
                        }
                    });
                }else {
                    callback(null, site);
                }
            });
    }
    function getProjectLinks(site, callback) {
        proj_len = site.projects.length;
        proj_counter = 0;
        if(proj_len>0) {
            site.projects.forEach(function (project) {
                Link.find({project: project._id})
                    .populate('company contract concession site project')
                    .deepPopulate('company_group source.source_type_id site.site_commodity.commodity site.site_country.country')
                    .exec(function(err, links) {
                        ++proj_counter;
                        link_len = links.length;
                        link_counter = 0;
                        if(link_len>0) {
                            links.forEach(function (link) {
                                ++link_counter;
                                var entity = _.without(link.entities, 'project')[0];
                                if (!site.source_type.p || !site.source_type.c) {
                                    if(link.source!=null) {
                                        if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                            site.source_type.c = true;
                                        } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                            site.source_type.c = true;
                                        } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                            site.source_type.p = true;
                                        }
                                    }
                                }
                                switch (entity) {
                                    case 'site':
                                        if (link.site.site_commodity.length>0) {
                                            if (_.where(site.site_commodity, {_id:_.last(link.site.site_commodity).commodity._id}).length<1) {
                                                site.site_commodity.push({
                                                    _id: _.last(link.site.site_commodity).commodity._id,
                                                    commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                        break;
                                    case 'project':
                                        if (link.project.proj_commodity.length>0) {
                                            if (_.where(site.site_commodity, {_id:_.last(link.project.proj_commodity).commodity._id}).length<1) {
                                                site.site_commodity.push({
                                                    _id: _.last(link.project.proj_commodity).commodity._id,
                                                    commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                        break;
                                    case 'concession':
                                        site.concessions.push({
                                            _id: link.concession._id,
                                            concession_name: link.concession.concession_name
                                        });
                                        break;
                                    case 'contract':
                                        site.contracts.push(link.contract);
                                        break;
                                    default:
                                        console.log('switch (entity) error');
                                }
                                if(proj_counter == proj_len && link_counter == link_len) {
                                    callback(null, site);
                                }
                            });
                        } else {
                            if(proj_counter == proj_len && link_counter == link_len) {
                                callback(null, site);
                            }
                        }
                    });
            });
        } else {
            callback(null, site);
        }
    }
};

exports.getSitesMap = function(req, res) {
    var site_len, site_counter,site_type;
    var field = req.params.field;
    async.waterfall([
        getSite
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else{
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });

    function getSite(callback) {
        Site.find({field:field})
            .lean()
            .exec(function(err, sites) {
                site_len = sites.length;
                site_counter = 0;
                var data = [];
                if(sites) {
                    sites.forEach(function (site) {
                        ++site_counter;
                        site.site_coordinates.forEach(function (loc) {
                            if(field==true){
                                site_type ='field';
                            }else{
                                site_type='site';
                            }
                            data.push({
                                'lat': loc.loc[0],
                                'lng': loc.loc[1],
                                'message': site.site_name,
                                'timestamp': loc.timestamp,
                                'type': site_type,
                                'id': site._id
                            })
                        })
                    });
                    if(site_counter == site_len) {
                        res.send({data:data});}
                } else {
                    callback(err);
                }
            });
    }
};

exports.createSite = function(req, res, next) {
	var siteData = req.body;
	Site.create(siteData, function(err, site) {
		if(err){
			err = new Error('Error');
			res.status(400);
			return res.send({reason:err.toString()})
		} else{
			res.send();
		}
	});
};

exports.updateSite = function(req, res) {
	var siteUpdates = req.body;
	Site.findOne({_id:req.body._id}).exec(function(err, site) {
		if(err) {
			err = new Error('Error');
			res.status(400);
			return res.send({ reason: err.toString() });
		}
		site.proj_name= siteUpdates.proj_name;
		//site.proj_aliases= siteUpdates.proj_aliases;
		//site.proj_established_source= siteUpdates.proj_established_source;
		//site.proj_country= siteUpdates.proj_country;
		//site.proj_type= siteUpdates.proj_type;
		////site.proj_commodity= siteUpdates.proj_commodity;
		//site.proj_site_name= siteUpdates.proj_site_name;
		//site.proj_address= siteUpdates.proj_address;
		//site.proj_coordinates= siteUpdates.proj_coordinates;
		//site.proj_status= siteUpdates.proj_status;
		//site.description= siteUpdates.description;
		site.save(function(err) {
			if(err) {
				err = new Error('Error');
				return res.send({reason: err.toString()});
			} else{
				res.send();
			}
		})
	});
};

exports.deleteSite = function(req, res) {
    Site.remove({_id: req.params.id}, function(err) {
        if(!err) {
            res.send();
        }else{
            return res.send({ reason: err.toString() });
        }
    });
};