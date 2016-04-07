var Project 		= require('mongoose').model('Project'),
    Country 		= require('mongoose').model('Country'),
    Source	 		= require('mongoose').model('Source'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    Commodity 	    = require('mongoose').model('Commodity'),
    Site 	        = require('mongoose').model('Site'),
    Concession 	    = require('mongoose').model('Concession'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getCompanyTable = function(req, res){
    var link_counter, link_len, companies_len, companies_counter;
    var type = req.params.type;
    var query='';
    if(type=='project') { query = {project:req.params.id, entities:"company"}}
    if(type=='site'||type=='field') { query = {site:req.params.id, entities:"company"}}
    if(type=='concession') { query = {concession:req.params.id, entities:"company"}}
    if(type=='contract') { query = {contract:req.params.id, entities:"company"}}
    if(type=='commodity') { query = {commodity:req.params.id}}
    var models = [
        {name:'Site',field:{'site_commodity.commodity':req.params.id},params:'site'},
        {name:'Concession',field:{'concession_commodity.commodity':req.params.id},params:'concession'},
        {name:'Project',field:{'proj_commodity.commodity':req.params.id},params:'project'}
    ];
    var companies = {};
    companies.companies = [];companies.query=[];
    var models_len,models_counter=0,counter=0;
    async.waterfall([
        getProjectLinks,
        getCommodityLinks,
        getCommodityCompany,
        getCompanyGroup
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getProjectLinks(callback) {
        if(type!='commodity') {
            Link.find(query)
                .populate('company')
                .deepPopulate('company_group')
                .exec(function (err, links) {
                    if (links) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            companies.companies.push({
                                company_name: link.company.company_name,
                                _id: link.company._id,
                                company_groups: []
                            });
                            companies.companies = _.uniq(companies.companies, function (a) {
                                return a._id;
                            });
                            if (link_len == link_counter) {
                                callback(null, companies);
                            }

                        })
                    } else {
                        callback(err);
                    }
                });
        } else{
            callback(null, companies);
        }
    }
    function getCommodityLinks(companies,callback) {
        if(type=='commodity') {
            models_counter=0;
            companies.query=[];
            models_len = models.length;
            _.each(models, function(model) {
                var name = require('mongoose').model(model.name);
                var $field = model.field;
                name.find($field).exec(function (err, responce) {
                    models_counter++;
                    _.each(responce, function(re) {
                        counter++;
                        if(model.params=='project'){companies.query.push({project:re._id,entities:'company'})}
                        if(model.params=='concession'){companies.query.push({concession:re._id,entities:'company'})}
                        if(model.params=='site'){companies.query.push({site:re._id,entities:'company'})}
                    });
                    if(models_counter==models_len){
                        callback(null, companies);
                    }
                });
            });
        }else {
            callback(null, companies);
        }
    }
    function getCommodityCompany(companies, callback) {
        if(type=='commodity') {
            companies_len = companies.query.length;
            companies_counter = 0;
            if (companies_len > 0) {
                companies.query.forEach(function (query) {
                    Link.find({$or: [query]})
                        .populate('company company_group')
                        .exec(function (err, links) {
                            ++companies_counter;
                            link_len = links.length;
                            link_counter = 0;
                            _.each(links, function (link) {
                                ++link_counter;
                                companies.companies.push({
                                    company_name: link.company.company_name,
                                    _id: link.company._id,
                                    company_groups: []
                                });
                                companies.companies = _.uniq(companies.companies, function (a) {
                                    return a._id;
                                });
                            });
                            if (link_len == link_counter && companies_counter == companies_len) {
                                callback(null, companies);
                            }
                        });
                });
            } else {
                callback(null, companies);
            }
        } else {
            callback(null, companies);
        }
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
                        });
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
    var type = req.params.type;
    var query={};
    var projects = {};
    projects.projects = [];
    if(type=='concession') { query={concession:req.params.id, entities:"project"}}
    if(type=='company') { query={company:req.params.id, entities:"project"}}
    if(type=='contract') { query={contract:req.params.id, entities:"project"}}
    if(type=='commodity') { query={'proj_commodity.commodity':req.params.id}}
    if(type=='group') { query={company: req.params.id, entities: "project"}}
    async.waterfall([
        getLinkedProjects,
        getCommodityProjects,
        getCompanyCount
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinkedProjects(callback) {
        if(type!='commodity') {
            Link.find(query)
                .deepPopulate('project.proj_country.country project.proj_commodity.commodity')
                .exec(function (err, links) {
                    if (links) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            projects.projects.push({
                                proj_id: link.project.proj_id,
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
        } else{
            projects.projects = [];
            callback(null, projects);
        }
    }
    function getCommodityProjects(projects, callback) {
        if(type=='commodity') {
            Project.find(query)
                .populate('commodity country')
                .deepPopulate('proj_commodity.commodity proj_country.country')
                .exec(function (err, proj) {
                    link_len = proj.length;
                    link_counter = 0;
                    if(link_len>0) {
                        _.each(proj, function (project) {
                            ++link_counter;
                            projects.projects.push({
                                proj_id: project.proj_id,
                                proj_name: project.proj_name,
                                proj_country: project.proj_country,
                                proj_commodity: project.proj_commodity,
                                proj_status: project.proj_status,
                                _id: project._id,
                                companies: 0
                            });
                            if (link_len == link_counter) {
                                projects.projects = _.uniq(projects.projects, function (a) {
                                    return a._id;
                                });
                                callback(null, projects);
                            }
                        })
                    }else{
                        callback(null, projects);
                    }
                });
        } else{
            callback(null, projects);
        }
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
    var link_counter, link_len, queries,production_counter,production_len;
    var type = req.params.type;
    var projects = {};
    projects.production_query =[];
    if(type=='concession') { queries={concession:req.params.id}; projects.production_query = [req.params.id];}
    if(type=='company') { queries={company:req.params.id};projects.production_query = [req.params.id];}
    if(type=='contract') { queries={contract:req.params.id};projects.production_query = [req.params.id];}
    if(type=='project') {  queries={project:req.params.id};projects.production_query = [req.params.id];}
    if(type=='site') {  queries={site:req.params.id};projects.production_query = [req.params.id];}
    if(type=='commodity') {  queries={commodity:req.params.id};projects.production_query = [req.params.id];}
    async.waterfall([
        getLinks,
        getProduction
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinks(callback) {
        Link.find(queries)
            .populate('site project concession company')
            .exec(function (err, links) {
                if (links) {
                    link_len = links.length;
                    link_counter = 0;
                    _.each(links, function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, type)[0];
                        switch (entity) {
                            case 'project':
                                if (link.project._id != undefined) {
                                    if (!_.contains(projects.production_query, link.project._id)) {
                                        projects.production_query.push(link.project._id);
                                    }
                                }
                                break;
                            case 'site':
                                if (link.site._id != undefined) {
                                    if (!_.contains(projects.production_query, link.site._id)) {
                                        projects.production_query.push(link.site._id);
                                    }
                                }
                                break;

                            case 'concession':
                                if (link.concession._id != undefined) {
                                    if (!_.contains(projects.production_query, link.concession._id)) {
                                        projects.production_query.push(link.concession._id);
                                    }
                                }
                                break;
                            case 'company':
                                if (link.company._id != undefined) {
                                    if (!_.contains(projects.production_query, link.company._id)) {
                                        projects.production_query.push(link.company._id);
                                    }
                                }
                                break;
                        }
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
        var productions = [];var query='';
        projects.production = [];
        if(type=='concession'){ query={$or: [{project:{$in: projects.production_query}},{site:{$in: projects.production_query}}]}}
        if(type=='company') {query={$or: [{project: {$in: projects.production_query}},{site: {$in: projects.production_query}},{concession: {$in: projects.production_query}}]}}
        if(type=='contract') { query={$or: [{project:{$in: projects.production_query}},{site:{$in: projects.production_query}},{concession:{$in: projects.production_query}}]}}
        if(type=='commodity') { query={$or: [{project:{$in: projects.production_query}},{site:{$in: projects.production_query}},{concession:{$in: projects.production_query}}]}}
        if(type=='project'||type=='site') {  query={$or: [{project:{$in: projects.production_query}},{site:{$in: projects.production_query}}]}}
        Production.find(query)
                .populate('production_commodity')
                .exec(function (err, production) {
                production_counter = 0;
                production_len = production.length;
                if (production_len > 0) {
                    production.forEach(function (prod) {
                        ++production_counter;
                        if (!productions.hasOwnProperty(prod._id)) {
                            productions.push({
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
                        if (production_counter === production_len) {
                            productions= _.uniq(productions, function (a) {
                                return a._id;
                            });
                            projects.production = productions;
                            callback(null, projects);
                        }
                    })
                } else {
                    if (production_counter === production_len) {
                        callback(null, projects);
                    }
                }
            })
    }
};
exports.getTransferTable = function(req, res){
    var link_counter, link_len, queries, company={},transfers_counter,transfers_len,type = req.params.type,projects = {};
    projects.transfers_query =[];
    if(type=='concession') { queries={concession:req.params.id}; projects.transfers_query = [req.params.id];}
    if(type=='company') { queries={company:req.params.id};projects.transfers_query = [req.params.id];}
    if(type=='contract') { queries={contract:req.params.id};projects.transfers_query = [req.params.id];}
    if(type=='project') {  queries={project:req.params.id};projects.transfers_query = [req.params.id];}
    if(type=='site') {  queries={site:req.params.id};projects.transfers_query = [req.params.id];}
    if(type=='commodity') {  queries={commodity:req.params.id};projects.transfers_query = [req.params.id];}
    async.waterfall([
        getLinks,
        getTransfers
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinks(callback) {
        Link.find(queries)
            .populate('site project')
            .exec(function (err, links) {
                link_len = links.length;
                link_counter = 0;
                if (link_len>0) {
                    _.each(links, function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, type)[0];
                        switch (entity) {
                            case 'project':
                                if (link.project._id != undefined) {
                                    if (!_.contains(projects.transfers_query, link.project._id)) {
                                        projects.transfers_query.push(link.project._id);
                                    }
                                }
                                break;
                            case 'site':
                                if (link.site._id != undefined) {
                                    if (!_.contains(projects.transfers_query, link.site._id)) {
                                        projects.transfers_query.push(link.site._id);
                                    }
                                }
                                break;

                            case 'concession':
                                if (link.concession._id != undefined) {
                                    if (!_.contains(projects.transfers_query, link.concession._id)) {
                                        projects.transfers_query.push(link.concession._id);
                                    }
                                }
                                break;
                            case 'company':
                                if (link.company._id != undefined) {
                                    if (!_.contains(projects.transfers_query, link.company._id)) {
                                        projects.transfers_query.push(link.company._id);
                                    }
                                }
                                break;
                        }
                        if (link_len == link_counter) {
                            callback(null, projects);
                        }
                    })
                } else {
                    callback(null, projects);
                }
            });
    }
    function getTransfers(projects, callback) {
        var project_transfers = [];var query='';
        projects.transfers = [];
        if(type=='concession'){ query={$or: [{project:{$in: projects.transfers_query}},{site:{$in: projects.transfers_query}}]}}
        if(type=='company') {query={$or: [{project: {$in: projects.transfers_query}},{site: {$in: projects.transfers_query}},{concession: {$in: projects.transfers_query}}]}}
        if(type=='contract') { query={$or: [{project:{$in: projects.transfers_query}},{site:{$in: projects.transfers_query}},{concession:{$in: projects.transfers_query}}]}}
        if(type=='commodity') { query={$or: [{project:{$in: projects.transfers_query}},{site:{$in: projects.transfers_query}},{concession:{$in: projects.transfers_query}}]}}
        if(type=='project'||type=='site') {  query={$or: [{project:{$in: projects.transfers_query}},{site:{$in: projects.transfers_query}}]}}
        if(projects.transfers_query!=null) {
            Transfer.find(query)
                .populate('company country')
                .exec(function (err, transfers) {
                    transfers_counter = 0;
                    transfers_len = transfers.length;
                    if (transfers_len > 0) {
                        transfers.forEach(function (transfer) {
                            ++transfers_counter;
                            if (!project_transfers.hasOwnProperty(transfer._id)) {
                                project_transfers.push({
                                    _id: transfer._id,
                                    transfer_year: transfer.transfer_year,
                                    //country: {
                                    //    name: transfer.country.name,
                                    //    iso2: transfer.country.iso2},
                                    transfer_type: transfer.transfer_type,
                                    transfer_unit: transfer.transfer_unit,
                                    transfer_value: transfer.transfer_value,
                                    transfer_level: transfer.transfer_level,
                                    transfer_audit_type: transfer.transfer_audit_type
                                    // proj_site:{name:project.proj_name,_id:project.proj_id,type:'project'}
                                });
                            }
                            if (transfer.company !== null) {
                                _.last(project_transfers).company = {
                                    _id: transfer.company._id,
                                    company_name: transfer.company.company_name
                                };
                            }
                            if (transfers_counter === transfers_len) {
                                project_transfers = _.uniq(project_transfers, function (a) {
                                    return a._id;
                                });
                                projects.transfers = project_transfers;
                                callback(null, projects);
                            }
                        })
                    } else {
                        if (transfers_counter === transfers_len) {
                            callback(null, projects);
                        }
                    }
                });
        }
    }
};
exports.getSiteFieldTable = function(req, res){
    var link_counter, link_len,site_counter,site_len;
    var site ={};
    site.sites=[];
    var type = req.params.type;
    var query='';
    if(type=='company') { query = {company:req.params.id, entities:"site"}
    }
    if(type=='concession') { query = {concession:req.params.id, entities:"site"}
    }
    if(type=='contract') { query = {contract:req.params.id, entities:"site"}
    }
    if(type=='commodity') { query = {'site_commodity.commodity':req.params.id}
    }
    async.waterfall([
        getLinks,
        getSites,
        getCompanyCount
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinks(callback) {
        if(type!='commodity') {
            Link.find(query)
                .populate('site commodity country')
                .deepPopulate('site.site_country.country site.site_commodity.commodity')
                .exec(function (err, links) {
                    if (links) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            site.sites.push({
                                _id: link.site._id,
                                field: link.site.field,
                                site_name: link.site.site_name,
                                site_status: link.site.site_status,
                                site_country: link.site.site_country,
                                site_commodity: link.site.site_commodity
                            });

                            if (link_len == link_counter) {
                                site.sites = _.uniq(site.sites, function (a) {
                                    return a._id;
                                });
                                callback(null, site);
                            }

                        })
                    } else {
                        callback(err);
                    }
                });
        } else {
            site.sites=[];
            callback(null, site);
        }
    }

    function getSites(site, callback) {
        if(type=='commodity') {
            Site.find(query)
                .populate('contract commodity country site_country.country site_commodity.commodity')
                .exec(function (err, sites) {
                    site_counter = 0;
                    site_len = sites.length;
                    if(site_len>0) {
                        sites.forEach(function (s) {
                            ++site_counter;
                            site.sites.push({
                                _id: s._id,
                                field: s.field,
                                site_name: s.site_name,
                                site_status: s.site_status,
                                site_country: s.site_country,
                                site_commodity: s.site_commodity,
                                companies:0
                            });
                            if (site_counter === site_len) {
                                site.sites = _.uniq(site.sites, function (a) {
                                    return a._id;
                                });
                                callback(null, site);
                            }
                        });
                    }else {
                        callback(null, site);
                    }
                });
        }else {
            callback(null, site);
        }
    }
    function getCompanyCount(sites, callback) {
        if (type == 'commodity') {
            site_len = sites.sites.length;
            site_counter = 0;
            if (site_len > 0) {
                sites.sites.forEach(function (site) {
                    Link.find({site: site._id, entities: 'company'})
                        .populate('company', '_id company_name')
                        .exec(function (err, links) {
                            ++site_counter;
                            link_len = links.length;
                            link_counter = 0;
                            _.each(links, function (link) {
                                ++link_counter;
                                site.companies = +1;
                            });
                            if (link_len == link_counter && site_counter == site_len) {
                                callback(null, sites);
                            }

                        });
                });
            } else {
                callback(null, sites);
            }
        } else {
            callback(null, sites);
        }
    }
};
exports.getContractTable = function(req, res){
    var link_counter, link_len;

    async.waterfall([
        getLinks,
        getContracts,
        getContractCommodity
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinks(callback) {
        var company ={};
        company.contracts_link=[];
        var type = req.params.type;
        var query='';
        if(type=='company') { query = {company:req.params.id, entities:"contract"}
        }
        if(type=='concession') { query = {concession:req.params.id, entities:"site"}
        }
        if(type=='commodity') { query = {commodity:req.params.id, entities:"site"}
        }
        Link.find(query)
            .populate('contract commodity country')
            .deepPopulate('site.site_country.country site.site_commodity.commodity')
            .exec(function(err, links) {
                if(links) {
                    link_len = links.length;
                    link_counter = 0;
                    _.each(links,function(link){
                        ++link_counter;
                        company.contracts_link.push({_id:link.contract.contract_id});
                        if(link_len==link_counter){
                            company.contracts_link = _.uniq(company.contracts_link, function (a) {
                                return a._id;
                            });
                            callback(null, company);
                        }

                    })
                } else {
                    callback(err);
                }
            });
    }

    function getContracts(company, callback) {
        company.contracts = [];
        var contract_counter = 0;
        var contract_len = company.contracts_link.length;
        if(contract_len>0) {
            _.each(company.contracts_link, function (contract) {
                request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract._id + '/metadata', function (err, res, body) {
                    var body = JSON.parse(body);
                    ++contract_counter;
                    company.contracts.push({
                        _id: contract._id,
                        contract_name: body.name,
                        contract_country: body.country,
                        contract_commodity: body.resource
                    });

                    if (contract_counter == contract_len) {
                        callback(null, company);
                    }
                });
            });
        } else{
            callback(null, company);
        }
    }
    function getContractCommodity(company, callback) {
        var contract_len = company.contracts.length;
        var contract_counter = 0;
        if(contract_len>0) {
            company.contracts.forEach(function (contract) {
                contract.commodity=[];
                var commodity_len = contract.contract_commodity.length;
                if(commodity_len>0) {
                    contract.contract_commodity.forEach(function (commodity_name) {
                        if (commodity_name != undefined) {
                            Commodity.find({commodity_name: commodity_name})
                                .exec(function (err, commodity) {
                                    ++contract_counter;
                                    commodity.map(function (name) {
                                        return contract.commodity.push({
                                            commodity_name: commodity_name,
                                            _id: name._id,
                                            commodity_id: name.commodity_id
                                        });
                                    });
                                    if (contract_counter == contract_len) {
                                        callback(null, company);
                                    }
                                });
                        }
                    })
                }
            })
        } else{
            callback(null, company);
        }
    }
};
exports.getConcessionTable = function(req, res){
    var link_counter, link_len,concession_len,concession_counter;
    var type = req.params.type;
    var query = '';
    if (type == 'company') {
        query = {company: req.params.id, entities: "concession"}
    }
    if (type == 'commodity') {
        query = {'concession_commodity.commodity': req.params.id}
    }
    async.waterfall([
        getLinks,
        getConcessions,
        getProjectCount
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinks(callback) {
        var company = {};
        company.concessions = [];
        if (type != 'commodity') {
            Link.find(query)
                .populate('concession commodity country')
                .deepPopulate('concession.concession_commodity.commodity concession.concession_country.country ')
                .exec(function (err, links) {
                    if (links) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            company.concessions.push({
                                _id: link.concession._id,
                                concession_name: link.concession.concession_name,
                                concession_country: _.first(link.concession.concession_country).country,
                                concession_commodities: link.concession.concession_commodity,
                                concession_status: link.concession.concession_status
                            });
                            if (link_len == link_counter) {
                                company.concessions = _.uniq(company.concessions, function (a) {
                                    return a._id;
                                });
                                callback(null, company);
                            }

                        })
                    } else {
                        callback(err);
                    }
                });
        } else{
            callback(null, company);
        }

    }
    function getConcessions(company,callback) {
        if (type == 'commodity') {
            Concession.find(query)
                .populate('commodity country')
                .deepPopulate('concession_commodity.commodity concession_country.country')
                .exec(function (err, concessions) {
                    concession_len = concessions.length;
                    concession_counter = 0;
                    if(concession_len>0) {
                        _.each(concessions, function (concession) {
                            ++concession_counter;
                            company.concessions.push({
                                _id: concession._id,
                                concession_name: concession.concession_name,
                                concession_country: _.first(concession.concession_country).country,
                                concession_commodities: concession.concession_commodity,
                                concession_status: concession.concession_status,
                                projects: 0
                            });
                            if (concession_len == concession_counter) {
                                company.concessions = _.uniq(company.concessions, function (a) {
                                    return a._id;
                                });
                                callback(null, company);
                            }
                        });
                    } else{
                        callback(null, company);
                    }
                });
        } else{
            callback(null, company);
        }
    }
    function getProjectCount(company,callback) {
        var type = req.params.type;
        if (type == 'commodity') {
            concession_len =company.concessions.length;
            concession_counter=0;
            if(concession_len>0) {
                _.each(company.concessions, function (concession) {
                    Link.find({concession: concession._id, entities: 'project'})
                        .populate('project')
                        .exec(function (err, links) {
                            concession_counter++;
                            links = _.uniq(links, function (a) {
                                return a.project._id;
                            });
                            concession.projects = links.length;
                            if (concession_len == concession_counter) {
                                callback(null, company);
                            }
                        });
                })
            }else{
                callback(null, company);
            }
        }else{
            callback(null, company);
        }
    }
};
exports.getSourceTable = function(req, res){
    var link_counter, link_len;
    var type = req.params.type;
    var queries=[];
    var project={};
    project.sources = [];
    if(type=='concession') { queries={concession:req.params.id}
    }if(type=='company') { queries={company:req.params.id}
    }if(type=='contract') { queries={contract:req.params.id}
    }if(type=='commodity') { queries={commodity:req.params.id}
    }if(type=='project') { queries={project:req.params.id}
    }if(type=='group') { queries={company_group:req.params.id}
    }
    var models = [
        {name:'Site',field:{'site_commodity.commodity':req.params.id},params:'site'},
        {name:'Concession',field:{'concession_commodity.commodity':req.params.id},params:'concession'},
        {name:'Project',field:{'proj_commodity.commodity':req.params.id},params:'project'}
    ];
    project.query=[];
    var models_len,models_counter=0,counter=0;
    async.waterfall([
        getLinkSite,
        getCommodityLinks,
        getCommoditySource
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinkSite(callback) {
        if(type!='commodity') {
            Link.find(queries)
                .populate('source')
                .deepPopulate('source.source_type_id')
                .exec(function (err, links) {
                    if (links.length > 0) {
                        link_len = links.length;
                        link_counter = 0;
                        links.forEach(function (link) {
                            ++link_counter;
                            if (links) {
                                project.sources.push(link.source);
                            }
                            if (link_counter == link_len) {
                                project.sources = _.uniq(project.sources, function (a) {
                                    return a._id;
                                });
                                callback(null, project);
                            }
                        });
                    } else {
                        callback(null, project);
                    }
                });
        } else{
            callback(null, project);
        }
    }
    function getCommodityLinks(project,callback) {
        if(type=='commodity') {
            models_counter=0;
            project.query=[];
            models_len = models.length;
            _.each(models, function(model) {
                var name = require('mongoose').model(model.name);
                var $field = model.field;
                name.find($field).exec(function (err, responce) {
                    models_counter++;
                    _.each(responce, function(re) {
                        counter++;
                        if(model.params=='project'){project.query.push({project:re._id})}
                        if(model.params=='concession'){project.query.push({concession:re._id})}
                        if(model.params=='site'){project.query.push({site:re._id})}
                    });
                    if(models_counter==models_len){
                        callback(null, project);
                    }
                });
            });
        }else {
            callback(null, project);
        }
    }
    function getCommoditySource(project, callback) {
        if(type=='commodity') {
            companies_len = project.query.length;
            companies_counter = 0;
            if (companies_len > 0) {
                project.query.forEach(function (query) {
                    Link.find({$or: [query]})
                        .populate('source')
                        .deepPopulate('source.source_type_id')
                        .exec(function (err, links) {
                            ++companies_counter;
                            link_len = links.length;
                            link_counter = 0;
                            if(link_len>0) {
                                _.each(links, function (link) {
                                    ++link_counter;
                                    project.sources.push(link.source);
                                });
                            } else{
                                ++link_counter;
                            }
                            if (link_len == link_counter && companies_counter == companies_len) {
                                project.sources = _.uniq(project.sources, function (a) {
                                    return a._id;
                                });
                                callback(null, project);
                            }
                        });
                });
            } else {
                callback(null, project);
            }
        } else {
            callback(null, project);
        }
    }
};