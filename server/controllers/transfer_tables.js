var Project 		= require('mongoose').model('Project'),
    Country 		= require('mongoose').model('Country'),
    Source	 		= require('mongoose').model('Source'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    Commodity 	    = require('mongoose').model('Commodity'),
    Contract 	    = require('mongoose').model('Contract'),
    Site 	        = require('mongoose').model('Site'),
    Concession 	    = require('mongoose').model('Concession'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getTransferTable = function(req, res){
    var link_counter, link_len, queries,query, company={},transfers_counter,transfers_len,companies_len,companies_counter,type = req.params.type,projects = {};
    projects.transfers_query =[];
    if(type=='concession') { queries={concession:req.params.id}; projects.transfers_query = [req.params.id];}
    if(type=='company') { queries={company:req.params.id};projects.transfers_query = [req.params.id];}
    if(type=='contract') { queries={contract:req.params.id};projects.transfers_query = [req.params.id];}
    if(type=='project') {  queries={project:req.params.id};projects.transfers_query = [req.params.id];}
    if(type=='site') {  queries={site:req.params.id};projects.transfers_query = [req.params.id];}
    if(type=='group') { query={company_group: req.params.id, entities: "company"};projects.transfers_query = [req.params.id];}
    if(type=='source_type') {  query={source_type_id:req.params.id};}
    var models = [
        {name:'Site',field:{'site_country.country':req.params.id},params:'site'},
        {name:'Company',field:{'countries_of_operation.country':req.params.id},params:'country'},
        {name:'Company',field:{'country_of_incorporation.country':req.params.id},params:'country'},
        {name:'Concession',field:{'concession_country.country':req.params.id},params:'concession'},
        {name:'Concession',field:{'concession_country.country':req.params.id},params:'concession'},
        {name:'Project',field:{'proj_country.country':req.params.id},params:'project'}
    ];
    var models_len,models_counter=0,counter=0;
    async.waterfall([
        getLinks,
        getGroupCompany,
        getGroupLinks,
        getCountryLinks,
        getSource,
        getTransfers
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinks(callback) {
        if(type!='group'&&type!='country') {
            Link.find(queries)
                .populate('site project concession company')
                .exec(function (err, links) {
                    link_len = links.length;
                    link_counter = 0;
                    if (link_len > 0) {
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
        }else {
            callback(null, projects);
        }
    }
    function getGroupCompany(projects,callback) {
        if(type=='group') {
            var companies =[];
            Link.find(query)
                .exec(function (err, links) {
                    if (links.length>0) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            if(link.company!=undefined) {
                                companies.push({_id: link.company});
                            }
                            if (link_len == link_counter) {
                                companies = _.map(_.groupBy(companies,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                callback(null, companies);
                            }
                        })
                    } else {
                        callback(null, companies);
                    }
                });
        } else{
            callback(null, projects);
        }
    }
    function getGroupLinks(companies,callback) {
        if(type=='group') {
            companies_len = companies.length;
            companies_counter = 0;
            if(companies_len>0){
                _.each(companies, function (c) {
                    if(c._id!=undefined){
                    query = {company: c._id};
                    projects.transfers_query.push(c._id);
                    Link.find(query)
                        .populate('site project concession company')
                        .exec(function (err, links) {
                            ++companies_counter;
                            link_len = links.length;
                            link_counter = 0;
                            if (link_len > 0) {
                                _.each(links, function (link) {
                                    ++link_counter;
                                    var entity = _.without(link.entities, 'company')[0];
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
                                    }
                                    if (link_len == link_counter && companies_len == companies_counter) {
                                        callback(null, projects);
                                    }
                                })
                            } else {
                                callback(null, projects);
                            }
                        });
                    }
                });
            }else {
                callback(null, projects);
            }
        }else {
            callback(null, projects);
        }
    }
    function getCountryLinks(projects,callback) {
        if(type=='country') {
            models_counter=0;
            models_len = models.length;
            _.each(models, function(model) {
                var name = require('mongoose').model(model.name);
                var $field = model.field;
                name.find($field).exec(function (err, responce) {
                    models_counter++;
                    _.each(responce, function(re) {
                        counter++;
                        projects.transfers_query.push(re._id);
                    });
                    if(models_counter==models_len){
                        callback(null, projects);
                    }
                });
            });
        }else {
            callback(null, projects);
        }
    }
    function getSource(projects,callback) {
        if(type=='source_type') {
            Source.find(query).exec(function(err,sources){
                if(sources.length>0){
                    _.each(sources, function(source) {
                        projects.transfers_query.push(source._id);
                    });
                    projects.transfers_query = _.map(_.groupBy(projects.transfers_query,function(doc){
                        return doc;
                    }),function(grouped){
                        return grouped[0];
                    });
                    callback(null, projects);
                }else {
                    callback(null, projects);
                }
            })
        }else {
            callback(null, projects);
        }
    }
    function getTransfers(projects, callback) {
        var project_transfers = [];
        var query = '';
        projects.transfers = [];
        if (type == 'concession') { query = {$or: [{project: {$in: projects.transfers_query}}, {site: {$in: projects.transfers_query}}]}}
        if (type == 'company') {query = {$or: [{project: {$in: projects.transfers_query}}, {site: {$in: projects.transfers_query}}, {concession: {$in: projects.transfers_query}}]}}
        if (type == 'contract') {query = {$or: [{project: {$in: projects.transfers_query}}, {site: {$in: projects.transfers_query}}, {concession: {$in: projects.transfers_query}}]}}
        if (type == 'commodity') {query = {$or: [{project: {$in: projects.transfers_query}}, {site: {$in: projects.transfers_query}}, {concession: {$in: projects.transfers_query}}]}}
        if (type == 'project' || type == 'site') {query = {$or: [{project: {$in: projects.transfers_query}}, {site: {$in: projects.transfers_query}}]}}
        if (type == 'group') {query = {$or: [{project:{$in: projects.transfers_query}}, {site:{$in: projects.transfers_query}},{company:{$in: projects.transfers_query}},{concession:{$in: projects.transfers_query}}]}}
        if (type=='country') { query = {$or: [{project:{$in: projects.transfers_query}}, {site:{$in: projects.transfers_query}},{country:{$in: projects.transfers_query}},{concession:{$in: projects.transfers_query}}]}}
        if(type=='source_type') { query = {$or: [{source:{$in: projects.transfers_query}}]}}
        if (projects.transfers_query != null) {
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
                            }
                            if (transfer.company !== null) {
                                _.last(project_transfers).company = {
                                    _id: transfer.company._id,
                                    company_name: transfer.company.company_name
                                };
                            }
                            if (transfers_counter === transfers_len) {
                                project_transfers = _.map(_.groupBy(project_transfers,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
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
        }else{
            callback(null, projects);
        }
    }
};