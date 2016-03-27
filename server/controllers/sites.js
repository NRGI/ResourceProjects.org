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
        }
    });
    function siteCount(callback) {
        Site.find({}).count().exec(function(err, site_count) {
            if(site_count) {
                callback(null, site_count);
            } else {
                callback(err);
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
            .populate('site_commodity.commodity', ' _id commodity_name commodity_id')
            .lean()
            .exec(function(err, sites) {
                if(sites.length>0) {
                    //TODO clean up returned data if we see performance lags
                    callback(null, site_count, sites);
                } else {
                    callback(err);
                }
            });
    }
    function getSiteLinks(site_count, sites, callback) {
        site_len = sites.length;
        site_counter = 0;
        if(site_len>0) {
            sites.forEach(function (site) {
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
                                if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                    site.source_type.c = true;
                                } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                    site.source_type.c = true;
                                } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                    site.source_type.p = true;
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
                                        site.transfers_query.push(link.site);
                                    }
                                    if (link.site.site_commodity.length>0) {
                                        if (_.where(site.site_commodity, {_id:_.last(link.site.site_commodity)._id}).length<1) {
                                            site.site_commodity.push({
                                                _id: _.last(link.site.site_commodity)._id,
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
                                        site.transfers_query.push(link.project);
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
                                                _id: _.last(link.site.site_commodity)._id,
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
                        res.send({data: sites, count: site_count});
                    }
                });

        });
    }
};

exports.getSiteByID = function(req, res) {
    var site_len, site_counter, link_counter, link_len, companies_len, companies_counter, transfers_counter, transfers_len, production_counter, production_len;

    async.waterfall([
        getSite,
        getSiteLinks,
        getTransfers,
        getProduction,
        getSiteCoordinate,
        getCompanyGroup
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });
	function getSite(callback) {
        Site.findOne({_id:req.params.id})
            .populate('site_country.country', '_id iso2 name')
            .populate('site_commodity.commodity', ' _id commodity_name commodity_id')
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
        site.companies = [];
        site.projects = [];
        site.concessions = [];
        site.contracts = [];
        site.sites = [];
        site.transfers_query = [site._id];
        site.source_type = {p: false, c: false};
        site.site_coordinates = {sites: [], fields: []};
        site.sources = {};
        Link.find({site: site._id})
            .populate('company contract concession site project')
            .deepPopulate('company_group source.source_type_id')
            .exec(function(err, links) {
                if(links.length>0) {
                    link_len = links.length;
                    link_counter = 0;
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'site')[0];
                        if (!site.source_type.p || !site.source_type.c) {
                            if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                site.source_type.c = true;
                            } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                site.source_type.c = true;
                            } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                site.source_type.p = true;
                            }
                        }
                        if (!site.sources[link.source._id]) {
                            //TODO clean up returned data if performance lags
                            site.sources[link.source._id] = link.source;
                        }
                        switch (entity) {
                            case 'project':
                                site.transfers_query.push(link.project._id);
                                site.projects.push({
                                    _id: link.project._id,
                                    proj_name: link.project.proj_name,
                                    proj_id: link.project.proj_id,
                                    proj_country: link.project.proj_country,
                                    proj_coordinates: link.project.proj_coordinates,
                                    proj_type: link.project.proj_type,
                                    proj_commodity: link.project.proj_commodity,
                                    proj_status: link.project.proj_status
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
                                site.transfers_query.push(link.site._id);
                                site.sites.push({
                                    _id: link.site._id,
                                    field: link.site.field,
                                    site_name: link.site.site_name
                                });
                                if (link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        site.site_coordinates.fields.push({
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
                                        site.site_coordinates.sites.push({
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
                            case 'company':
                                if (!site.companies.hasOwnProperty(link.company._id)) {
                                    site.transfers_query.push(link.company._id);
                                    site.companies.push({
                                        _id: link.company._id,
                                        company_name: link.company.company_name
                                    });
                                }
                                break;
                            case 'concession':
                                site.transfers_query.push(link.concession._id);
                                site.concessions.push({
                                    _id: link.concession._id,
                                    concession_name: link.concession.concession_name
                                });
                                if (link.concession.concession_commodity.length>0) {
                                    if (_.where(site.site_commodity, {_id: _.last(link.concession.concession_commodity).commodity._id}).length<1) {
                                        site.site_commodity.push({
                                            _id: _.last(link.project.proj_commodity).commodity._id,
                                            commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
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
    function getTransfers(site, callback) {
        site.transfers = [];
        Transfer.find({$or: [
                {project:{$in: site.transfers_query}},
                {site:{$in: site.transfers_query}}]})
            .populate('company country project site')
            .deepPopulate('source.source_type_id')
            // .lean()
            .exec(function(err, transfers) {
                transfers_counter = 0;
                transfers_len = transfers.length;
                if (transfers_len>0) {
                    transfers.forEach(function (transfer) {
                        if (!site.sources[transfer.source._id]) {
                            //TODO clean up returned data if performance lags
                            site.sources[transfer.source._id] = transfer.source;
                        }
                        ++transfers_counter;
                        site.transfers.push({
                            _id: transfer._id,
                            transfer_year: transfer.transfer_year,
                            country: {
                                name: transfer.country.name,
                                iso2: transfer.country.iso2},
                            transfer_type: transfer.transfer_type,
                            transfer_unit: transfer.transfer_unit,
                            transfer_value: transfer.transfer_value,
                            transfer_level: transfer.transfer_level,
                            transfer_audit_type: transfer.transfer_audit_type,
                            transfer_links: []
                            // proj_site:{name:project.proj_name,_id:project.proj_id,type:'project'}
                        });
                        if (transfer.company!==null) {
                            _.last(site.transfers).company = {_id: transfer.company._id, company_name: transfer.company.company_name};
                        }
                        if (transfer.project!==null && transfer.project) {
                            _.last(site.transfers).transfer_links.push({
                                _id: transfer.project._id,
                                route: transfer.project.proj_id,
                                type: 'project',
                                name: transfer.project.proj_name});
                        }
                        if (transfer.site!==null && transfer.site) {
                            var type;
                            if (transfer.site.field) {
                                type = 'field';
                            } else {
                                type = 'site';
                            }
                            _.last(site.transfers).transfer_links.push({
                                _id: transfer.project._id,
                                route: transfer.project.proj_id,
                                type: type,
                                name: transfer.project.proj_name});
                        }
                        if (transfers_counter===transfers_len) {
                            callback(null, site);
                        }
                    });
                } else {
                    callback(null, site);
                }
            });
    }
    function getProduction(site, callback) {
        site.production = [];
        Production.find({$or: [
                {project:{$in: site.transfers_query}},
                {site:{$in: site.transfers_query}}]})
            .populate('production_commodity project site')
            .deepPopulate('source.source_type_id')
            // .lean()
            .exec(function(err, production) {
                production_counter = 0;
                production_len = production.length;
                if (production_len>0) {
                    production.forEach(function (prod) {
                        if (!site.sources[prod.source._id]) {
                            //TODO clean up returned data if performance lags
                            site.sources[prod.source._id] = prod.source;
                        }
                        ++production_counter;
                        site.production.push({
                            _id: prod._id,
                            production_year: prod.production_year,
                            production_volume: prod.production_volume,
                            production_unit: prod.production_unit,
                            production_commodity: {
                                _id: prod.production_commodity._id,
                                commodity_name: prod.production_commodity.commodity_name,
                                commodity_id: prod.production_commodity.commodity_id},
                            production_price: prod.production_price,
                            production_price_unit: prod.production_price_unit,
                            production_level: prod.production_level,
                            production_links: []
                            // proj_site:{name:project.proj_name,_id:project.proj_id,type:'project'}
                        });
                        if (prod.project!==null && prod.project) {
                            _.last(site.production).production_links.push({
                                _id: prod.project._id,
                                route: prod.project.proj_id,
                                type: 'project',
                                name: prod.project.proj_name});
                        }
                        if (prod.site!==null && prod.site) {
                            var type;
                            if (prod.site.field) {
                                type = 'field';
                            } else {
                                type = 'site';
                            }
                            _.last(site.production).production_links.push({
                                _id: prod.project._id,
                                route: prod.project.proj_id,
                                type: type,
                                name: prod.project.proj_name});
                        }
                        if (production_counter===production_len) {
                            callback(null, site);
                        }
                    });
                } else {
                    callback(null, site);
                }
            });
    }
    function getSiteCoordinate(site, callback) {
        site.coordinates = [];
        site_counter = 0;
        site_len = site.site_coordinates.length;
        if(site_len>0) {
            site.site_coordinates.forEach(function (loc) {
                ++site_counter;
                site.coordinates.push({
                    'lat': loc.loc[0],
                    'lng': loc.loc[1],
                    'message': site.site_name,
                    'timestamp': loc.timestamp,
                    'id': site._id
                });
                if (site_counter == site_len) {
                    callback(null, site);
                }
            });
        } else {
            callback(null, site);
        }
    }
    function getCompanyGroup(site, callback) {
        companies_len = site.companies.length;
        companies_counter = 0;
        if (companies_len > 0) {
            site.companies.forEach(function (company) {
                Link.find({company: company._id, entities: 'company_group'})
                    .populate('company_group', '_id company_group_name')
                    .deepPopulate('source.source_type_id')
                    .exec(function (err, links) {
                        ++companies_counter;
                        link_len = links.length;
                        link_counter = 0;
                        company.company_groups = [];
                        if (link_len > 0) {
                            links.forEach(function (link) {
                                if (!site.sources[link.source._id]) {
                                    //TODO clean up returned data if performance lags
                                    site.sources[link.source._id] = link.source;
                                }
                                ++link_counter;
                                var entity = _.without(link.entities, 'company')[0];
                                switch (entity) {
                                    case 'company_group':
                                        if (!company.company_groups.hasOwnProperty(link.company_group.company_group_name)) {
                                            company.company_groups.push({
                                                _id: link.company_group._id,
                                                company_group_name: link.company_group.company_group_name
                                            });
                                        }
                                        break;
                                    default:
                                        console.log('link doesn\'t specify a company_group but rather a ${entity}');
                                }
                                if (companies_counter == companies_len && link_counter == link_len) {
                                    res.send(site);
                                }
                            });
                        } else if (companies_counter == companies_len) {
                            res.send(site);
                        }
                    });
            });
        } else {
            res.send(site);
        }
    }
};

exports.getSitesMap = function(req, res) {
    console.log(req.params.field);
    var site_len, site_counter;
    var field = req.params.field;
    async.waterfall([
        getSite
    ], function (err, result) {
        if (err) {
            res.send(err);
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
                            data.push({
                                'lat': loc.loc[0],
                                'lng': loc.loc[1],
                                'message': site.site_name,
                                'timestamp': loc.timestamp,
                                'type': site.site_type,
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