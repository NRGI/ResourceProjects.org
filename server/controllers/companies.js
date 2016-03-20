var Company 		= require('mongoose').model('Company'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getCompanies = function(req, res) {
    var company_len, link_len, company_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        companyCount,
        getCompanySet,
        getCompanyLinks,
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });

    function companyCount(callback) {
        Company.find({}).count().exec(function(err, company_count) {
            if(company_count) {
                callback(null, company_count);
            } else {
                callback(err);
            }
        });
    }
    function getCompanySet(company_count, callback) {
        Company.find(req.query)
            .sort({
                company_name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .populate('country_of_incorporation.country', '_id iso2 name')
            .populate('company_aliases', ' _id alias')
            .lean()
            .exec(function(err, companies) {
                if(companies) {
                    callback(null, company_count, companies);
                } else {
                    callback(err);
                }
            });
    }
    function getCompanyLinks(company_count, companies, callback) {
        company_len = companies.length;
        company_counter = 0;
        companies.forEach(function (c) {
            Link.find({company: c._id, $or:[ {entities:'company_group'}, {entities:'project'} ] })
                .populate('company_group','_id company_group_name')
                .populate('project')
                .exec(function(err, links) {
                    ++company_counter;
                    link_len = links.length;
                    link_counter = 0;
                    c.company_groups = [];
                    c.projects = 0;
                    links.forEach(function(link) {
                        ++link_counter;

                        var entity = _.without(link.entities, 'company')[0]
                        switch (entity) {
                            case 'company_group':
                                c.company_groups.push({
                                    _id: link.company_group._id,
                                    company_group_name: link.company_group.company_group_name
                                });
                                break;
                            //
                            case 'project':
                                c.projects += 1;
                                break;
                            //
                            default:
                                console.log(entity, 'link skipped...');
                        }

                    });
                    if(company_counter == company_len && link_counter == link_len) {
                        res.send({data:companies, count:company_count});
                    }
                });
        });
    }
};
exports.getCompanyByID = function(req, res) {
    var link_counter, link_len;

    async.waterfall([
        getCompany,
        getCompanyLinks,
        // getContracts,
        // getProjectLocation
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });
    function getCompany(callback) {
        Company.findOne({_id:req.params.id})
            .populate('company_aliases', ' _id alias')
            .populate('company_group','_id company_group_name')
            .populate('country.country')
            .lean()
            .exec(function(err, company) {
                if(company) {
                    callback(null, company);
                } else {
                    callback(err);
                }
            });
    }
    function getCompanyLinks(company, callback) {
        company.company_groups = [];
        company.commodities = [];
        company.projects = [];
        company.contracts_link = [];
        company.production = [];
        company.transfers = [];
        company.sites = [];
        company.site_coordinates = {sites: [], fields: []};
        company.concessions = [];
        company.sources = {};
        Link.find({company: company._id})
            .populate('company_group','_id company_group_name')
            .populate('commodity')
            .populate('contract')
            .deepPopulate('project site.site_country.country site.site_commodity.commodity project.proj_country.country project.proj_commodity.commodity transfer.transfer_company transfer.transfer_country production.production_commodity concession concession.concession_country.country concession.concession_commodity.commodity source.source_type_id')
            .exec(function(err, links) {
                link_len = links.length;
                if(link_len>0) {
                    link_counter = 0;
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'company')[0];
                        if(link.source!=undefined) {
                            if (!company.sources[link.source._id]) {
                                company.sources[link.source._id] = link.source;
                            }
                        }
                        switch (entity) {
                            case 'site':
                                company.sites.push({
                                    _id: link.site._id,
                                    field: link.site.field,
                                    site_name: link.site.site_name,
                                    site_type: link.site.site_type,
                                    site_status: link.site.site_status,
                                    site_commodity: link.site.site_commodity
                                });
                                if (link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        company.site_coordinates.fields.push({
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
                                        company.site_coordinates.sites.push({
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
                            case 'commodity':
                                if (!company.commodities.hasOwnProperty(link.commodity_code)) {
                                    company.commodities.push({
                                        _id: link.commodity._id,
                                        commodity_name: link.commodity.commodity_name,
                                        commodity_id: link.commodity.commodity_id
                                    });
                                }
                                break;
                            case 'company_group':
                                if (!company.company_groups.hasOwnProperty(link.company_group.company_group_name)) {
                                    company.company_groups.push({
                                        _id: link.company_group._id,
                                        company_group_name: link.company_group.company_group_name
                                    });
                                }
                                break;
                            case 'concession':
                                if (!company.concessions.hasOwnProperty(link.concession._id)) {
                                    company.concessions.push({
                                        _id: link.concession._id,
                                        concession_name: link.concession.concession_name,
                                        concession_country: _.find(link.concession.concession_country.reverse()).country,
                                        concession_type: _.find(link.concession.concession_type.reverse()),
                                        concession_commodities: link.concession.concession_commodity,
                                        concession_status: link.concession.concession_status
                                    });
                                }
                                break;
                            case 'contract':
                                company.contracts_link.push(link.contract);
                                // if (!_.contains(company.contracts_link, link.contract.contract_id)) {
                                //     company.contracts_link.push(link.contract);
                                // }
                                break;
                            case 'project':
                                company.projects.push({
                                    _id: link.project._id,
                                    proj_name: link.project.proj_name,
                                    proj_id: link.project.proj_id,
                                    proj_country: link.project.proj_country,
                                    proj_type: link.project.proj_type,
                                    proj_commodity: link.project.proj_commodity,
                                    proj_status: link.project.proj_status
                                });
                                break;
                            case 'transfer':
                                company.transfers.push({
                                    _id: link.transfer._id,
                                    transfer_year: link.transfer.transfer_year,
                                    transfer_company: {
                                        company_name: link.transfer.transfer_company.company_name,
                                        _id:link.transfer.transfer_company._id},
                                    transfer_country: {
                                        name: link.transfer.transfer_country.name,
                                        iso2: link.transfer.transfer_country.iso2},
                                    transfer_type: link.transfer.transfer_type,
                                    transfer_unit: link.transfer.transfer_unit,
                                    transfer_value: link.transfer.transfer_value,
                                    transfer_level: link.transfer.transfer_level,
                                    transfer_audit_type: link.transfer.transfer_audit_type});
                                break;
                            case 'production':
                                company.production.push({
                                    _id: link.production._id,
                                    production_year: link.production.production_year,
                                    production_volume: link.production.production_volume,
                                    production_unit: link.production.production_unit,
                                    production_commodity: {
                                        _id: link.production.production_commodity._id,
                                        commodity_name: link.production.production_commodity.commodity_name,
                                        commodity_id: link.production.production_commodity.commodity_id},
                                    production_price: link.production.production_price,
                                    production_price_unit: link.production.production_price_unit,
                                    production_level: link.production.production_level});
                                break;
                            default:
                                console.log(entity, 'link skipped...');
                        }
                        if (link_counter == link_len) {
                            // callback(null, company);
                            res.send(company);
                        }
                    });
                } else{
                    // callback(null, company);
                    res.send(company);
                }
            });
    }
    function getTransfers(company, callback) {
        company.transfers = [];
        Transfer.find({transfer_company: company._id})
            .populate('transfer_country')
            .populate('transfer_company', '_id company_name')
            .populate('transfer_project', '_id proj_name')
            .exec(function(err, transfers) {
                _.each(transfers, function(transfer) {
                    company.transfers.push(transfer);
                });
                if(company) {
                    callback(null, company);
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
    function getProjectLocation(company,callback) {
        var project_counter = 0;
        company.location = [];
        var project_len = company.projects.length;
        if(project_len>0) {
            company.projects.forEach(function (project) {
                ++project_counter;
                project.proj_coordinates.forEach(function (loc) {
                    company.location.push({
                        'lat': loc.loc[0],
                        'lng': loc.loc[1],
                        'message': "<a href =\'/project/" + project._id + "\'>" + project.proj_name + "</a><br>" + project.proj_name
                    });
                    if (project_counter == project_len) {
                        res.send(company);
                    }
                })
            });
        } else{
            res.send(company);
        }
    }
};
exports.createCompany = function(req, res, next) {
    var companyData = req.body;
    Company.create(companyData, function(err, company) {
        if(err){
            res.status(400);
            err = new Error('Error');
            return res.send({reason:err.toString()})
        } else {
            res.send();
        }
    });
};
exports.updateCompany = function(req, res) {
    var companyUpdates = req.body;
    Company.findOne({_id:req.body._id}).exec(function(err, company) {
        if(err) {
            res.status(400);
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
        company.company_name= companyUpdates.company_name;
        company.company_aliases= companyUpdates.company_aliases;
        company.company_established_source= companyUpdates.company_established_source;
        company.country_of_incorporation= companyUpdates.country_of_incorporation;
        company.countries_of_operation= companyUpdates.countries_of_operation;
        company.description= companyUpdates.description;
        company.save(function(err) {
            if(err) {
                err = new Error('Error');
                return res.send({reason: err.toString()});
            } else {
                res.send();
            }
        })
    });
};
exports.deleteCompany = function(req, res) {
    Company.remove({_id: req.params.id}, function(err) {
        if(!err) {
            res.send();
        } else{
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
    });
};