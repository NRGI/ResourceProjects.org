var Project 		= require('mongoose').model('Project'),
    Country 		= require('mongoose').model('Country'),
    Source	 		= require('mongoose').model('Source'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getCompanyTable = function(req, res){
    var link_counter, link_len, companies_len, companies_counter;

    async.waterfall([
        getProjectLinks,
        getCompanyGroup
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getProjectLinks(callback) {
        var type = req.params.type;
        var query='';
        if(type=='project') { query = {project:req.params.id, entities:"company"}
        }
        if(type=='site'||type=='field') { query = {site:req.params.id, entities:"company"}
        }
        if(type=='concession') { query = {concession:req.params.id, entities:"company"}
        }
        if(type=='contract') { query = {contract:req.params.id, entities:"company"}
        }
        Link.find(query)
            .populate('company')
            .deepPopulate('company_group')
            .exec(function(err, links) {
                if(links) {
                    var companies ={};
                    companies.companies=[];
                    link_len = links.length;
                    link_counter = 0;
                    _.each(links,function(link){
                        ++link_counter;
                        companies.companies.push({
                            company_name:link.company.company_name,
                            _id:link.company._id,
                            company_groups:[]
                        });
                        companies.companies = _.uniq(companies.companies, function (a) {
                            return a._id;
                        });
                        if(link_len==link_counter){
                            callback(null, companies);
                        }

                    })
                } else {
                    callback(err);
                }
            });
    }
    function getCompanyGroup(companies, callback) {
        companies_len = companies.companies.length;
        companies_counter = 0;
        if (companies_len > 0) {
            companies.companies.forEach(function (company) {
                Link.find({company: company._id, entities: 'company_group'})
                    .populate('company_group', '_id company_group_name')
                    .exec(function (err, links) {
                        ++companies_counter;
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links,function(link){
                            ++link_counter;
                            company.company_groups.push(link.company_group);
                        })
                        if(link_len==link_counter&&companies_counter == companies_len){
                            callback(null, companies);
                        }

                    });
            });
        } else {
            callback(null, companies);
        }
    }
};
exports.getProjectTable = function(req, res){
    var link_counter, link_len, companies_len, companies_counter;

    async.waterfall([
        getLinkedProjects,
        getCompanyCount
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinkedProjects(callback) {
        var type = req.params.type;
        var queries=[];
        _.each(req.query._id,function(company) {
            if(company.length>1) {
                company = JSON.parse(company);
            }
            if(type=='concession') { queries.push({concession:company.id, entities:"project"})
            }if(type=='company') { queries.push({company:company.id, entities:"project"})
            }if(type=='contract') { queries.push({contract:company.id, entities:"project"})
            }if(type=='commodity') { queries.push({commodity:company.id, entities:"project"})
            }
            if(type=='group') { queries.push({company: company.id, entities: "project"});
            }
        });
        async.eachOfSeries(queries, function (query) {
            Link.find(query)
                .deepPopulate('project.proj_country.country project.proj_commodity.commodity')
                .exec(function (err, links) {
                    if (links) {
                        var projects = {};
                        projects.projects = [];
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            projects.projects.push({
                                proj_name: link.project.proj_name,
                                proj_country: link.project.proj_country,
                                proj_commodity: link.project.proj_commodity,
                                proj_status: link.project.proj_status,
                                _id: link.project._id,
                                companies: 0
                            });
                            if (link_len == link_counter) {
                                projects.projects = _.uniq(projects.projects, function (a) {
                                    return a._id;
                                });
                                callback(null, projects);
                            }
                        })
                    } else {
                        callback(err);
                    }
                });
        })
    }
    function getCompanyCount(projects, callback) {
        companies_len = projects.projects.length;
        companies_counter = 0;
        if (companies_len > 0) {
            projects.projects.forEach(function (project) {
                Link.find({project: project._id, entities: 'company'})
                    .populate('company', '_id company_name')
                    .exec(function (err, links) {
                        ++companies_counter;
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links,function(link){
                            ++link_counter;
                            project.companies=+1;
                        });
                        if(link_len==link_counter&&companies_counter == companies_len){
                            callback(null, projects);
                        }

                    });
            });
        } else {
            callback(null, projects);
        }
    }
};
exports.getProductionTable = function(req, res){
    var link_counter, link_len, companies_len, companies_counter;
    var type = req.params.type;
    var id=req.params.id;
    //_.each(req.query._id,function(company) {
    //    if(company.length>1) {
    //        company = JSON.parse(company);
    //    }
    //    if(type=='concession') { queries.push({concession:company.id, entities:"project"})
    //    }if(type=='company') { queries.push({company:company.id, entities:"project"})
    //    }if(type=='contract') { queries.push({contract:company.id, entities:"project"})
    //    }if(type=='commodity') { queries.push({commodity:company.id, entities:"project"})
    //    }
    //    if(type=='group') { queries.push({project: company.id, entities: "site"});
    //    }
    //});
    async.waterfall([
        getLinkSite,
        getProduction
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinkSite(callback) {
        var projects = {};
        projects.sites =[];
        Link.find({project:req.params.id, entities:"site"})
            .populate('site')
            .exec(function (err, links) {
                if (links) {
                    link_len = links.length;
                    link_counter = 0;
                    _.each(links, function (link) {
                        ++link_counter;
                        projects.sites[link_counter - 1] = {};
                        projects.sites[link_counter - 1] = {
                            site: link.site._id
                        };
                        if (link_len == link_counter) {
                            callback(null, projects);
                        }
                    })
                } else {
                    projects.sites[0] ={site: ''};
                    callback(err);
                }
            });
    }
    function getProduction(projects, callback) {
        project_len = projects.sites.length;
        project_counter = 0;
        var production = [];var query='';
        projects.production = [];
        _.each(projects.sites, function (site) {
            if(site.site=='') {
                query = {$or: [{project: req.params.id}]};
            } else{
                query = {$or: [{project: req.params.id}, {site: site.site}]};
            }
            Production.find(query)
                .populate('production_commodity')
                .exec(function (err, production) {
                    ++project_counter;
                    production_counter = 0;
                    production_len = production.length;
                    if (production_len > 0) {
                        production.forEach(function (prod) {
                            ++production_counter;
                            if (!production.hasOwnProperty(prod._id)) {
                                production.push({
                                    _id: prod._id,
                                    production_year: prod.production_year,
                                    production_volume: prod.production_volume,
                                    production_unit: prod.production_unit,
                                    production_commodity: {
                                        _id: prod.production_commodity._id,
                                        commodity_name: prod.production_commodity.commodity_name,
                                        commodity_id: prod.production_commodity.commodity_id
                                    },
                                    production_price: prod.production_price,
                                    production_price_unit: prod.production_price_unit,
                                    production_level: prod.production_level
                                    // proj_site:{name:project.proj_name,_id:project.proj_id,type:'project'}
                                });

                            }
                            if (production_counter === production_len && project_counter === project_len) {
                                production = _.uniq(production, function (a) {
                                    return a._id;
                                });
                                projects.production=production;
                                callback(null, projects);
                            }
                        })
                    }else{
                        if(project_counter === project_len){

                            callback(null, projects);
                        }
                    }
                })
        })
    }
};
exports.getTransferTable = function(req, res){
    var link_counter, link_len, companies_len, companies_counter;
    var type = req.params.type;
    var id=req.params.id;
    //_.each(req.query._id,function(company) {
    //    if(company.length>1) {
    //        company = JSON.parse(company);
    //    }
    //    if(type=='concession') { queries.push({concession:company.id, entities:"project"})
    //    }if(type=='company') { queries.push({company:company.id, entities:"project"})
    //    }if(type=='contract') { queries.push({contract:company.id, entities:"project"})
    //    }if(type=='commodity') { queries.push({commodity:company.id, entities:"project"})
    //    }
    //    if(type=='group') { queries.push({project: company.id, entities: "site"});
    //    }
    //});
    async.waterfall([
        getLinkSite,
        getProduction
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinkSite(callback) {
        var projects = {};
        projects.sites =[];
        Link.find({project:req.params.id, entities:"site"})
            .populate('site')
            .exec(function (err, links) {
                if (links.length>0) {
                    link_len = links.length;
                    link_counter = 0;
                    _.each(links, function (link) {
                        ++link_counter;
                        projects.sites[link_counter-1]={};
                        projects.sites[link_counter-1]={
                            site: link.site._id
                        };
                        if (link_len == link_counter) {
                            callback(null, projects);
                        }
                    })
                } else {
                    projects.sites[0] ={site: ''};
                    callback(null, projects);

                }
            });
    }
    function getProduction(projects, callback) {
        project_len = projects.sites.length;
        project_counter = 0;
        var project_transfers = [];var query='';
        projects.transfers = [];
        _.each(projects.sites, function (site) {
            if(site.site=='') {
                query = {$or: [{project: req.params.id}]};
            } else{
                query = {$or: [{project: req.params.id}, {site: site.site}]};
            }
            Transfer.find(query)
                .populate('company country')
                .exec(function (err, transfers) {
                    ++project_counter;
                    transfers_counter = 0;
                    transfers_len = transfers.length;
                    if (transfers_len > 0) {
                        transfers.forEach(function (transfer) {
                            ++transfers_counter;
                            if (!project_transfers.hasOwnProperty(transfer._id)) {
                                project_transfers.push({
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
                                    _.last(project_transfers).company = {_id: transfer.company._id, company_name: transfer.company.company_name};
                                }
                            }
                            if (transfers_counter === transfers_len && project_counter === project_len) {
                                project_transfers = _.uniq(project_transfers, function (a) {
                                    return a._id;
                                });
                                projects.transfers=project_transfers;
                                callback(null, projects);
                            }
                        })
                    } else{
                        if(project_counter === project_len){
                            callback(null, projects);
                        }
                    }
                })
        })
    }
};
exports.getSourceTable = function(req, res){
    var link_counter, link_len, companies_len, companies_counter;
    var type = req.params.type;
    var queries=[];
    var id=req.params.id;
    //_.each(req.query._id,function(company) {
    //    if(company.length>1) {
    //        company = JSON.parse(company);
    //    }

    //    if(type=='group') { queries.push({company: company.id});
    //    }
    //});
    async.waterfall([
        getLinkSite
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinkSite(callback) {
        var project={};
        project.sources = {};
        if(type=='concession') { queries={concession:req.params.id}
        }if(type=='company') { queries={company:req.params.id}
        }if(type=='contract') { queries={contract:req.params.id}
        }if(type=='commodity') { queries={commodity:req.params.id}
        }if(type=='project') { queries={project:req.params.id}
        }if(type=='group') { queries={company_group:req.params.id}
        }
        Link.find(queries)
            .populate('source')
            .deepPopulate('source.source_type_id')
            .exec(function (err, links) {
                if(links.length>0) {
                link_len = links.length;
                link_counter = 0;
                    links.forEach(function (link) {
                        ++link_counter;
                        if (links) {
                            if (!project.sources[link.source._id]) {
                                project.sources[link.source._id] = link.source;
                            }
                        }
                        if (link_counter == link_len) {
                            callback(null, project);
                        }
                    });
                }else {
                    callback(err);
                }
            });
    }
};