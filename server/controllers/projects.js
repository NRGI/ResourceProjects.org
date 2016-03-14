var Project 		= require('mongoose').model('Project'),
    Country 		= require('mongoose').model('Country'),
    Source	 		= require('mongoose').model('Source'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request'),
    encrypt 		= require('../utilities/encryption');

exports.getProjects = function(req, res) {
    var project_len, link_len, project_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        projectCount,
        getProjectSet,
        getProjectLinks
    ], function (err, result) {
        if (err) {
            res.send(err);
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
            //.populate('proj_aliases', ' _id alias')
            .lean()
            .exec(function(err, projects) {
                if(projects.length>0) {
                    callback(null, project_count, projects);
                } else {
                    //callback(err);
                    res.send({data: projects, count: project_count});
                }
            });
    }

    function getProjectLinks(project_count, projects, callback) {
        project_len = projects.length;
        project_counter = 0;
        if(project_len>0) {
            projects.forEach(function (c) {
                Link.find({project: c._id})
                    .populate('commodity', '_id commodity_name')
                    .populate('company')
                    .exec(function (err, links) {
                        ++project_counter;
                        link_len = links.length;
                        link_counter = 0;
                        c.proj_commodity = [];
                        c.companies = 0;
                        links.forEach(function (link) {
                            ++link_counter;
                            var entity = _.without(link.entities, 'project')[0];
                            switch (entity) {
                                case 'commodity':
                                    c.proj_commodity.push({
                                        _id: link.commodity._id,
                                        commodity_name: link.commodity.commodity_name
                                    });
                                    break;
                                //
                                case 'company':
                                    c.companies += 1;
                                    break;
                                //
                                default:
                                //console.log('error');
                            }
                        });
                        if (project_counter == project_len && link_counter == link_len) {
                            res.send({data: projects, count: project_count});
                        }
                    });
            });
        } else{
            res.send({data: projects, count: project_count});
        }
    }
};

exports.getProjectByID = function(req, res) {
    var link_counter, link_len,project_counter, project_len;

    async.waterfall([
        getProject,
        //getTransfers,
        getProductions,
        getProjectLinks,
        getProjectCoordinate,
        getCompanyGroup
    ], function (err, result) {
        if (err) {
            res.send(err);
        }


    });

    function getProject(callback) {
        Project.findOne({_id:req.params.id})
            .populate('proj_country.country')
            .populate('proj_aliases', ' _id alias')
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
    //function getTransfers(project, callback) {
    //    project.transfers = [];
    //    Transfer.find({transfer_project: project._id})
    //        .populate('transfer_country')
    //        .populate('transfer_company', '_id company_name')
    //        .exec(function(err, transfers) {
    //            console.log(transfers);
    //            _.each(transfers, function(transfer) {
    //                project.transfers.push(transfer);
    //            });
    //            if(project) {
    //                callback(null, project);
    //            } else {
    //                callback(err);
    //            }
    //        });
    //}
    function getProductions(project, callback) {
        project.productions = [];
        Production.find({production_project: project._id})
            .populate('production_commodity')
            .exec(function(err, productions) {
                _.each(productions, function(productions) {
                    project.productions.push(productions);
                });
                if(project) {
                    callback(null, project);
                } else {
                    callback(err);
                }
            });
    }
    function getProjectLinks(project, callback) {
        project.companies = [];
        project.commodities = [];
        project.transfers = [];
        project.projects = [];
        project.concessions = [];
        project.contracts = [];
        Link.find({project: project._id})
            .populate('commodity')
            .populate('company')
            .populate('contract')
            .populate('concession')
            //.populate('transfer')
            .deepPopulate('company_group transfer.transfer_company transfer.transfer_country')
            //.deepPopulate('company company.company_group')
            .exec(function(err, links) {
                if(links.length>0) {
                    link_len = links.length;
                    link_counter = 0;
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'project')[0];
                        switch (entity) {
                            case 'commodity':
                                if (!project.commodities.hasOwnProperty(link.commodity_code)) {
                                    project.commodities.push({
                                        _id: link.commodity._id,
                                        commodity_name:link.commodity.commodity_name});
                                }
                                break;
                            case 'company':
                                if (!project.companies.hasOwnProperty(link.company._id)) {
                                    project.companies.push({
                                        _id: link.company._id,
                                        company_name: link.company.company_name
                                    });
                                }
                                break;
                            case 'concession':
                                project.concessions.push({
                                    _id: link.concession._id,
                                    concession_name: link.concession.concession_name
                                });
                                break;
                            case 'concession':
                                project.concessions.push({
                                    _id: link.concession._id,
                                    concession_name: link.concession.concession_name
                                });
                                break;
                            case 'contract':
                                project.contracts.push(link);
                                break;
                            case 'transfer':
                                project.transfers.push(link);
                                break;
                            default:
                                console.log('error');
                        }
                        if(link_counter == link_len) {
                            callback(null, project);
                        }
                    });
                }
            });
    }

    function getProjectCoordinate(project, callback) {
        project.coordinates = [];
        project_counter = 0;
        project_len = project.proj_coordinates.length;
        if(project_len>0) {
            project.proj_coordinates.forEach(function (loc) {
                ++project_counter;
                project.coordinates.push({
                    'lat': loc.loc[0],
                    'lng': loc.loc[1],
                    'message': project.proj_name,
                    'timestamp': loc.timestamp
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
        project_len = project.companies.length;
        project_counter = 0;
        project.companies.forEach(function(company) {
            Link.find({company: company._id})
                .populate('company_group', '_id company_group_name')
                .exec(function (err, links) {
                    ++project_counter;
                    link_len = links.length;
                    link_counter = 0;
                    company.company_groups = [];
                    links.forEach(function (link) {
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
                                console.log('error');
                        }
                        if(project_counter == project_len && link_counter == link_len) {
                            res.send(project);
                        }
                    });
                });
        });
    }

};

exports.getProjectsMap = function(req, res) {
    var project_len, project_counter;
    async.waterfall([
        getProject
    ], function (err, result) {
        if (err) {
            res.send(err);
        }

    });

    function getProject(callback) {
        Project.find(req.query)
            .lean()
            .exec(function(err, projects) {
                project_len = projects.length;
                project_counter = 0;
                var data = [];
                if(projects) {
                    projects.forEach(function (project) {
                        ++project_counter;
                        project.proj_coordinates.forEach(function (loc) {
                            data.push({
                                'lat':loc.loc[0],
                                'lng':loc.loc[1],
                                'message':"<a href =\'/project/"+ project._id +"\'>"+project.proj_name+"</a><br>"+project.proj_name
                            })
                        })
                    });
                    if(project_counter == project_len) {
                        res.send({data:data});}
                } else {
                    callback(err);
                }
            });
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
    console.log(projectUpdates);
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