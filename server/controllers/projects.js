var Project 		= require('mongoose').model('Project'),
    Country 		= require('mongoose').model('Country'),
    Source	 		= require('mongoose').model('Source'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getProjects = function(req, res) {
    var project_len, link_len, project_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        projectCount,
        getProjectSet,
        getProjectLinks,
        getTransfersCount,
        getProductionCount,
        getVerified
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function projectCount(callback) {
        Project.find({}).count().exec(function(err, project_count) {
            if(project_count) {
                callback(null, project_count);
            } else {
                callback(err);
            }
        });
    }
    function getProjectSet(project_count, callback) {
        Project.find(req.query)
            .sort({
                proj_name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .populate('proj_country.country', '_id iso2 name')
            .populate('proj_commodity.commodity', ' _id commodity_name commodity_id commodity_type')
            .deepPopulate('proj_established_source.source_type_id')
            .lean()
            .exec(function(err, projects) {
                if(projects.length>0) {
                    //TODO clean up returned data if we see performance lags
                    callback(null, project_count, projects);
                } else {
                    res.send({data: projects, count: project_count});
                }
            });
    }
    function getProjectLinks(project_count, projects, callback) {
        project_len = projects.length;
        project_counter = 0;
        if(project_len>0) {
            projects.forEach(function (project) {
                project.transfers_query = [project._id];
                project.source_type = {p: false, c: false};
                if (project.proj_established_source.source_type_id.source_type_authority === 'authoritative') {
                    project.source_type.c = true;
                } else if (project.proj_established_source.source_type_id.source_type_authority === 'non-authoritative') {
                    project.source_type.c = true;
                } else if (project.proj_established_source.source_type_id.source_type_authority === 'disclosure') {
                    project.source_type.p = true;
                }
                Link.find({project: project._id})
                    // .populate('commodity', '_id commodity_name commodity_type commodity_id')
                    .populate('company')
                    .deepPopulate('source.source_type_id site.site_commodity.commodity concession.concession_commodity.commodity')
                    .exec(function (err, links) {
                        ++project_counter;
                        link_len = links.length;
                        link_counter = 0;
                        project.company_count = 0;
                        project.contract_count = 0;
                        project.site_count = 0;
                        project.field_count = 0;
                        project.concession_count = 0;
                        links.forEach(function (link) {
                            ++link_counter;
                            var entity = _.without(link.entities, 'project')[0];
                            if (!project.source_type.p || !project.source_type.c) {
                                if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                    project.source_type.c = true;
                                } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                    project.source_type.c = true;
                                } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                    project.source_type.p = true;
                                }
                            }
                            switch (entity) {
                                case 'company':
                                    project.company_count += 1;
                                    break;
                                case 'contract':
                                    project.contract_count += 1;
                                    break;
                                case 'site':
                                    if (link.site.site_commodity.length>0) {
                                        if (_.where(project.proj_commodity, {_id:_.last(link.site.site_commodity).commodity._id}).length<1) {
                                            project.proj_commodity.push({commodity: {
                                                _id: _.last(link.site.site_commodity).commodity._id,
                                                commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                                commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                                commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                            }
                                            });
                                        }
                                    }
                                    if (!_.contains(project.transfers_query, link.site)) {
                                        project.transfers_query.push(link.site);
                                    }
                                    if (link.site.field) {
                                        project.site_count += 1;
                                    } else if (!link.site.field) {
                                        project.field_count += 1;
                                    }
                                    break;
                                case 'concession':
                                    if (link.concession.concession_commodity.length>0) {
                                        if (_.where(project.proj_commodity, {_id:_.last(link.concession.concession_commodity).commodity._id}).length<1) {
                                            if(link.site!=undefined) {
                                                project.proj_commodity.push({
                                                    _id: _.last(link.site.site_commodity).commodity._id,
                                                    commodity_name: _.last(link.concession.concession_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.concession.concession_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.concession.concession_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                    }
                                    project.concession_count += 1;
                                    break;
                                default:
                                    console.log(entity, 'skipped...');
                            }
                        });
                        if (project_counter == project_len && link_counter == link_len) {
                            callback(null, project_count, projects);
                        }
                    });
            });
        } else{
            callback(null, project_count, projects);
        }
    }
    function getTransfersCount(project_count, projects, callback) {
        var transfer_counter, transfer_len;
        project_len = projects.length;
        project_counter = 0;
        _.each(projects, function(project) {
            if (!project.source_type.p || !project.source_type.c) {
                project.transfer_count = 0;
                Transfer.find({$or: [
                        {project:{$in: project.transfers_query}},
                        {site:{$in: project.transfers_query}}]})
                    .deepPopulate('source.source_type_id')
                    .exec(function (err, transfers) {
                        transfer_len = transfers.length;
                        transfer_counter = 0;
                        ++project_counter;
                        if (transfer_len>0) {
                            _.each(transfers, function (transfer) {
                                ++transfer_counter;
                                if (!project.source_type.p || !project.source_type.c) {
                                    if (transfer.source.source_type_id.source_type_authority === 'authoritative') {
                                        project.source_type.c = true;
                                    } else if (transfer.source.source_type_id.source_type_authority === 'non-authoritative') {
                                        project.source_type.c = true;
                                    } else if (transfer.source.source_type_id.source_type_authority === 'disclosure') {
                                        project.source_type.p = true;
                                    }
                                }
                                project.transfer_count += 1;
                                if (project_counter === project_len && transfer_counter === transfer_len) {
                                    callback(null, project_count, projects);
                                }
                            });
                        } else {
                            if (project_counter === project_len && transfer_counter === transfer_len) {
                                callback(null, project_count, projects);
                            }
                        }

                    });
            } else {
                Transfer.find({$or: [
                        {project:{$in: project.transfers_query}},
                        {site:{$in: project.transfers_query}}]})
                    .count()
                    .exec(function (err, transfer_count) {
                        ++project_counter;
                        project.transfer_count = transfer_count;
                        if (project_counter === project_len) {
                            callback(null, project_count, projects);
                        }
                    });
            }
        });
    }
    function getProductionCount(project_count, projects, callback) {
        var prod_counter, prod_len;
        project_len = projects.length;
        project_counter = 0;
        _.each(projects, function(project) {
            if (!project.source_type.p || !project.source_type.c) {
                project.production_count = 0;
                Production.find({$or: [
                        {project:{$in: project.transfers_query}},
                        {site:{$in: project.transfers_query}}]})
                    .deepPopulate('source.source_type_id')
                    .exec(function (err, production) {
                        prod_len = production.length;
                        prod_counter = 0;
                        ++project_counter;
                        if (prod_len>0) {
                            _.each(production, function (prod) {
                                ++prod_counter;
                                if (!project.source_type.p || !project.source_type.c) {
                                    if (prod.source.source_type_id.source_type_authority === 'authoritative') {
                                        project.source_type.c = true;
                                    } else if (prod.source.source_type_id.source_type_authority === 'non-authoritative') {
                                        project.source_type.c = true;
                                    } else if (prod.source.source_type_id.source_type_authority === 'disclosure') {
                                        project.source_type.p = true;
                                    }
                                }
                                project.production_count += 1;
                                if (project_counter === project_len && prod_counter === prod_len) {
                                    callback(null, project_count, projects);
                                }
                            });
                        } else {
                            if (project_counter === project_len && prod_counter === prod_len) {
                                callback(null, project_count, projects);
                            }
                        }

                    });
            } else {
                Production.find({$or: [
                        {project:{$in: project.transfers_query}},
                        {site:{$in: project.transfers_query}}]})
                    .count()
                    .exec(function (err, production_count) {
                        ++project_counter;
                        project.production_count = production_count;
                        if (project_counter === project_len) {
                            callback(null, project_count, projects);
                        }
                    });
            }
        });
    }
    function getVerified (project_count, projects, callback) {
        project_len = projects.length;
        project_counter = 0;
        _.each(projects, function(project) {
            ++project_counter;
            if (!project.source_type.c && !project.source_type.p) {
                project.verified = 'none';
            } else if (project.source_type.c && !project.source_type.p) {
                project.verified = 'context';
            } else if (!project.source_type.c && project.source_type.p) {
                project.verified = 'payment';
            } else if (project.source_type.c && project.source_type.p) {
                project.verified = 'verified';
            }
            if (project_counter === project_len) {
                callback(null, {data: projects, count: project_count});
            }
        });
    }
};

exports.getProjectByID = function(req, res) {
    var site_len, site_counter, link_counter, link_len, project_counter, project_len, companies_len, companies_counter, transfers_counter, transfers_len, production_counter, production_len;

    async.waterfall([
        getProject,
        getProjectLinks,
        getTransfers,
        getProduction,
        getProjectCoordinate,
        getCompanyGroup
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
	function getProject(callback) {
        Project.findOne({proj_id:req.params.id})
            .populate('proj_country.country')
            .populate('proj_aliases', '_id alias')
            .populate('proj_commodity.commodity')
            .lean()
            .exec(function(err, project) {
                if(project) {
                    callback(null, project);
                } else {
                    callback(err);
                }
            });
    }
    function getProjectLinks(project, callback) {
        project.companies = [];
        project.projects = [];
        project.concessions = [];
        project.contracts = [];
        project.sites = [];
        project.transfers_query = [project._id];
        project.source_type = {p: false, c: false};
        project.site_coordinates = {sites: [], fields: []};
        project.sources = {};
        Link.find({project: project._id})
            .populate('company contract concession site project')
            .deepPopulate('company_group source.source_type_id')
            .exec(function(err, links) {
                if(links.length>0) {
                    link_len = links.length;
                    link_counter = 0;
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'project')[0];
                        if (!project.source_type.p || !project.source_type.c) {
                            if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                project.source_type.c = true;
                            } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                project.source_type.c = true;
                            } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                project.source_type.p = true;
                            }
                        }
                        if (!project.sources[link.source._id]) {
                            //TODO clean up returned data if performance lags
                            project.sources[link.source._id] = link.source;
                        }
                        switch (entity) {
                            case 'site':
                                project.transfers_query.push(link.site._id);
                                project.sites.push({
                                    _id: link.site._id,
                                    field: link.site.field,
                                    site_name: link.site.site_name
                                });
                                if (link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        project.site_coordinates.fields.push({
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
                                        project.site_coordinates.sites.push({
                                            'lat': loc.loc[0],
                                            'lng': loc.loc[1],
                                            'message': link.site.site_name,
                                            'timestamp': loc.timestamp,
                                            'type': 'site',
                                            'id': link.site._id
                                        });
                                    });
                                }
                                break;
                            // case 'commodity':
                            //     if(link.commodity) {
                            //         if (project.commodities!=undefined) {
                            //             if (!project.commodities.hasOwnProperty(link.commodity_code)) {
                            //                 project.commodities.push({
                            //                     _id: link.commodity._id,
                            //                     commodity_name: link.commodity.commodity_name,
                            //                     commodity_id: link.commodity.commodity_id
                            //                 });
                            //             }
                            //         }
                            //     }
                            //     break;
                            case 'company':
                                if (!project.companies.hasOwnProperty(link.company._id)) {
                                    project.transfers_query.push(link.company._id);
                                    project.companies.push({
                                        _id: link.company._id,
                                        company_name: link.company.company_name
                                    });
                                }
                                break;
                            case 'concession':
                                project.transfers_query.push(link.concession._id);
                                project.concessions.push({
                                    _id: link.concession._id,
                                    concession_name: link.concession.concession_name
                                });
                                break;
                            case 'contract':
                                project.contracts.push(link.contract);
                                break;
                            default:
                                console.log('switch (entity) error');
                        }
                        if(link_counter == link_len) {
                            callback(null, project);
                        }
                    });
                }else {
                    callback(null, project);
                }
            });
    }
    function getTransfers(project, callback) {
        project.transfers = [];
        Transfer.find({$or: [
                {project:{$in: project.transfers_query}},
                {site:{$in: project.transfers_query}}]})
            .populate('company country')
            .deepPopulate('source.source_type_id')
            // .lean()
            .exec(function(err, transfers) {
                transfers_counter = 0;
                transfers_len = transfers.length;
                if (transfers_len>0) {
                    transfers.forEach(function (transfer) {
                        if (!project.sources[transfer.source._id]) {
                            //TODO clean up returned data if performance lags
                            project.sources[transfer.source._id] = transfer.source;
                        }
                        ++transfers_counter;
                        project.transfers.push({
                            _id: transfer._id,
                            transfer_year: transfer.transfer_year,
                            country: {
                                name: transfer.country.name,
                                iso2: transfer.country.iso2},
                            transfer_type: transfer.transfer_type,
                            transfer_unit: transfer.transfer_unit,
                            transfer_value: transfer.transfer_value,
                            transfer_level: transfer.transfer_level,
                            transfer_audit_type: transfer.transfer_audit_type
                            // proj_site:{name:project.proj_name,_id:project.proj_id,type:'project'}
                        });
                        if (transfer.company!==null) {
                            _.last(project.transfers).company = {_id: transfer.company._id, company_name: transfer.company.company_name};
                        }
                        if (transfers_counter===transfers_len) {
                            callback(null, project);
                        }
                    });
                } else {
                    callback(null, project);
                }
            });
    }
    function getProduction(project, callback) {
        project.production = [];
        Production.find({$or: [
                {project:{$in: project.transfers_query}},
                {site:{$in: project.transfers_query}}]})
            .populate('production_commodity')
            .deepPopulate('source.source_type_id')
            // .lean()
            .exec(function(err, production) {
                production_counter = 0;
                production_len = production.length;
                if (production_len>0) {
                    production.forEach(function (prod) {
                        if (!project.sources[prod.source._id]) {
                            //TODO clean up returned data if performance lags
                            project.sources[prod.source._id] = prod.source;
                        }
                        ++production_counter;
                        project.production.push({
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
                            production_level: prod.production_level
                            // proj_site:{name:project.proj_name,_id:project.proj_id,type:'project'}
                        });
                        if (production_counter===production_len) {
                            callback(null, project);
                        }
                    });
                } else {
                    callback(null, project);
                }
            });
    }
    function getProjectCoordinate(project, callback) {
        project.coordinates = [];
        if (project.site_coordinates.sites.length>0) {
            project.site_coordinates.sites.forEach(function (site_loc) {
                project.coordinates.push(site_loc);
            })
        }
        if (project.site_coordinates.fields.length>0) {
            project.site_coordinates.fields.forEach(function (field_loc) {
                project.coordinates.push(field_loc);
            })
        }
        project_counter = 0;
        project_len = project.proj_coordinates.length;
        if(project_len>0) {
            project.proj_coordinates.forEach(function (loc) {
                ++project_counter;
                project.coordinates.push({
                    'lat': loc.loc[0],
                    'lng': loc.loc[1],
                    'message': project.proj_name,
                    'timestamp': loc.timestamp,
                    'type': 'project',
                    'id': project.proj_id
                });
                if (project_counter == project_len) {
                    callback(null, project);
                }
            });
        } else {
            callback(null, project);
        }
    }
    function getCompanyGroup(project, callback) {
        companies_len = project.companies.length;
        companies_counter = 0;
        if (companies_len > 0) {
            project.companies.forEach(function (company) {
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
                                if (!project.sources[link.source._id]) {
                                    //TODO clean up returned data if performance lags
                                    project.sources[link.source._id] = link.source;
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
                                    callback(null, project);;
                                }
                            });
                        } else if (companies_counter == companies_len) {
                            callback(null, project);
                        }
                    });
            });
        } else {
            callback(null, project);
        }
    }
};

exports.getProjectsMap = function(req, res) {
    var project_len, project_counter, coord_counter, coord_len;
    async.waterfall([
        projectCount,
        getProjectSet,
        getProjectLinks,
        getProjectCoordinate
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result)
        }
    });

    function projectCount(callback) {
        Project.find({}).count().exec(function(err, project_count) {
            if(project_count) {
                callback(null, project_count);
            } else {
                callback(null, 0);
            }
        });
    }
    function getProjectSet(project_count, callback) {
        Project.find({})
            .lean()
            .exec(function(err, projects) {
                if(projects.length>0) {
                    //TODO clean up returned data if we see performance lags
                    callback(null, project_count, projects);
                } else {
                    callback(null, project_count, []);
                }
            });
    }
    function getProjectLinks(project_count, projects, callback) {
        project_len = projects.length;
        project_counter = 0;
        if(project_len>0) {
            projects.forEach(function (project) {
                project.coordinates = [];
                project.site_coordinates = {sites: [], fields: []};
                project.transfers_query = [project._id];
                Link.find({project: project._id, entities: 'site'})
                    .populate('site')
                    .exec(function (err, links) {
                        ++project_counter;
                        link_len = links.length;
                        link_counter = 0;
                        links.forEach(function (link) {
                            ++link_counter;
                            var entity = _.without(link.entities, 'project')[0];
                            switch (entity) {
                                case 'site':
                                    if (!_.contains(project.transfers_query, link.site)) {
                                        project.transfers_query.push(link.site);
                                    }
                                    if (link.site.field && link.site.site_coordinates.length>0) {
                                        link.site.site_coordinates.forEach(function (loc) {
                                            project.site_coordinates.fields.push({
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
                                            project.site_coordinates.sites.push({
                                                'lat': loc.loc[0],
                                                'lng': loc.loc[1],
                                                'message': link.site.site_name,
                                                'timestamp': loc.timestamp,
                                                'type': 'site',
                                                'id': link.site._id
                                            });
                                        });
                                    }
                                    break;
                                default:
                                    console.log(entity, 'skipped...');
                            }
                        });
                        if (project_counter == project_len && link_counter == link_len) {
                            callback(null, project_count, projects);
                        }
                    });
            });
        } else{
            callback(null, project_count, projects);
        }
    }
    function getProjectCoordinate(project_count, projects, callback) {
        project_counter = 0;
        project_len = projects.length;
        if (project_len>0) {
            _.each(projects, function(project) {
                ++project_counter;
                coord_counter = 0;
                coord_len = project.proj_coordinates.length;
                if (project.site_coordinates.sites.length>0) {
                    project.site_coordinates.sites.forEach(function (site_loc) {
                        project.coordinates.push(site_loc);
                    })
                }
                if (project.site_coordinates.fields.length>0) {
                    project.site_coordinates.fields.forEach(function (field_loc) {
                        project.coordinates.push(field_loc);
                    })
                }
                if(coord_len>0) {
                    _.each(project.proj_coordinates, function (loc) {
                        ++project_counter;
                        project.coordinates.push({
                            'lat': loc.loc[0],
                            'lng': loc.loc[1],
                            'message': project.proj_name,
                            'timestamp': loc.timestamp,
                            'type': 'project',
                            'id': project.proj_id
                        });
                        if (coord_counter == coord_len && project_counter == project_len) {
                            callback(null, {count: project_count, data: projects});
                        }
                    });

                } else {
                    if (coord_counter == coord_len && project_counter == project_len) {
                        callback(null, {count: project_count, data: projects});
                    }
                }

            });
        } else {
            callback(null, {count: project_count, data: projects});
        }
    }

};

exports.createProject = function(req, res, next) {
	var projectData = req.body;
	Project.create(projectData, function(err, project) {
		if(err){
			err = new Error('Error');
			res.status(400);
			return res.send({reason:err.toString()})
		} else{
			res.send();
		}
	});
};

exports.updateProject = function(req, res) {
	var projectUpdates = req.body;
	Project.findOne({_id:req.body._id}).exec(function(err, project) {
		if(err) {
			err = new Error('Error');
			res.status(400);
			return res.send({ reason: err.toString() });
		}
		project.proj_name= projectUpdates.proj_name;
		//project.proj_aliases= projectUpdates.proj_aliases;
		//project.proj_established_source= projectUpdates.proj_established_source;
		//project.proj_country= projectUpdates.proj_country;
		//project.proj_type= projectUpdates.proj_type;
		////project.proj_commodity= projectUpdates.proj_commodity;
		//project.proj_site_name= projectUpdates.proj_site_name;
		//project.proj_address= projectUpdates.proj_address;
		//project.proj_coordinates= projectUpdates.proj_coordinates;
		//project.proj_status= projectUpdates.proj_status;
		//project.description= projectUpdates.description;
		project.save(function(err) {
			if(err) {
				err = new Error('Error');
				return res.send({reason: err.toString()});
			} else{
				res.send();
			}
		})
	});
};

exports.deleteProject = function(req, res) {
    Project.remove({_id: req.params.id}, function(err) {
        if(!err) {
            res.send();
        }else{
            return res.send({ reason: err.toString() });
        }
    });
};