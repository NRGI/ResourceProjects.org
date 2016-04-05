var Company 		= require('mongoose').model('Company'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production      = require('mongoose').model('Production'),
    Commodity 	    = require('mongoose').model('Commodity'),
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
        getTransfersCount
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
        if (company_len>0) {
            companies.forEach(function (company) {
                Link.find({company: company._id})
                    .populate('company_group','_id company_group_name')
                    .populate('project site')
                    .deepPopulate('site.site_commodity.commodity project.proj_commodity.commodity')
                    .exec(function(err, links) {
                        ++company_counter;
                        link_len = links.length;
                        link_counter = 0;
                        if(link_len>0) {
                            var projects = [];
                            company.company_groups = [];
                            company.company_commodity = [];
                            company.transfers_query = [company._id];
                            company.project_count = 0;
                            company.site_count = 0;
                            company.concession_count = 0;
                            company.contract_count = 0;
                            company.field_count = 0;
                            links.forEach(function(link) {
                                ++link_counter;

                                var entity = _.without(link.entities, 'company')[0]
                                switch (entity) {
                                    case 'company_group':
                                        company.company_groups.push({
                                            _id: link.company_group._id,
                                            company_group_name: link.company_group.company_group_name
                                        });
                                        break;
                                    case 'project':
                                        projects.push(link.project);
                                        projects = _.uniq(projects, function (a) {
                                            return a._id;
                                        });
                                        company.project_count = projects.length;
                                        if (link.project.proj_commodity.length>0) {
                                            if (_.where(company.company_commodity, {_id:_.last(link.project.proj_commodity)._id}).length<1) {
                                                company.company_commodity.push({
                                                    _id: _.last(link.project.proj_commodity).commodity._id,
                                                    commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                        if (!_.contains(company.transfers_query, link.project)) {
                                            company.transfers_query.push(link.project);
                                        }
                                        break;
                                    case 'site':
                                        if (link.site.site_commodity.length>0) {
                                            if (_.where(company.company_commodity, {_id:_.last(link.site.site_commodity)._id}).length<1) {
                                                company.company_commodity.push({
                                                    _id: _.last(link.site.site_commodity)._id,
                                                    commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                        if (!_.contains(company.transfers_query, link.site._id)) {
                                            company.transfers_query.push(link.site._id);
                                        }
                                        if (link.site.field) {
                                            company.field_count += 1;
                                        } else {
                                            company.site_count += 1;
                                        }
                                        break;
                                    case 'concession':
                                        company.concession_count += 1;
                                        break;
                                    case 'contract':
                                        company.contract_count += 1;
                                        break;
                                    default:
                                        console.log(entity, 'link skipped...');
                                }

                            });
                            if(company_counter == company_len && link_counter == link_len) {
                                callback(null, company_count, companies);
                            }
                        } else {
                            if(company_counter == company_len && link_counter == link_len) {
                                callback(null, company_count, companies);
                            }
                        }
                    });
            });
        } else {
            callback(null, company_count, companies);
        }
    }
    function getTransfersCount(company_count, companies, callback) {
        company_len = companies.length;
        company_counter = 0;
        _.each(companies, function(company) {
            Transfer.find({$or: [
                    {project:{$in: company.transfers_query}},
                    {site:{$in: company.transfers_query}},
                    {concession:{$in: company.transfers_query}}]})
                .count()
                .exec(function (err, transfer_count) {
                    ++company_counter;
                    company.transfer_count = transfer_count;
                    if (company_counter === company_len) {
                        res.send({data:companies, count:company_count});
                    }
                });

        });
    }
};

exports.getCompanyByID = function(req, res) {
    var link_counter, link_len, production_counter, production_len;

    async.waterfall([
        getCompany,
        getCompanyLinks,
        getContracts,
        getContractCommodity
        //TODO finish deeply linked projects and sites
        //TODO get commodity data through stuff linked to concessions
        //TODO get commodity data through stuff linked to contract
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
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
        company.proj_coordinates = [];
        company.sites = [];
        company.contracts_link = [];
        company.concessions = [];
        company.company_commodity = [];
        Link.find({company: company._id})
            .populate('company_group','_id company_group_name')
            .populate('commodity contract')
            .deepPopulate('project.proj_country.country project.proj_commodity.commodity site.site_commodity.commodity site.site_country.country concession.concession_country.country concession.concession_commodity.commodity')
            .exec(function(err, links) {
                link_len = links.length;
                link_counter = 0;
                if(link_len>0) {
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'company')[0];
                        switch (entity) {
                            case 'site':
                                company.sites.push({
                                    _id: link.site._id,
                                    field: link.site.field,
                                    site_name: link.site.site_name,
                                    site_status: link.site.site_status,
                                    site_country: link.site.site_country,
                                    site_commodity:link.site.site_commodity
                                });
                                if (link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        company.proj_coordinates.push({
                                            'lat': loc.loc[0],
                                            'lng': loc.loc[1],
                                            'message': link.site.site_name,
                                            'timestamp': loc.timestamp,
                                            'type': 'field',
                                            'id': link.site._id
                                        });
                                    });
                                    company.proj_coordinates = _.uniq(company.proj_coordinates, function (a) {
                                        return a.id;
                                    });
                                } else if (!link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        company.proj_coordinates.push({
                                            'lat': loc.loc[0],
                                            'lng': loc.loc[1],
                                            'message': link.site.site_name,
                                            'timestamp': loc.timestamp,
                                            'type': 'site',
                                            'id': link.site._id
                                        });
                                    });
                                    company.proj_coordinates = _.uniq(company.proj_coordinates, function (a) {
                                        return a.id;
                                    });
                                }
                                if (link.site.site_commodity.length>0) {
                                    if (_.where(company.company_commodity, {_id:_.last(link.site.site_commodity)._id}).length<1) {
                                        company.company_commodity.push({
                                            _id: _.last(link.site.site_commodity)._id,
                                            commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                        });
                                    }
                                }
                                break;
                            case 'project':
                                link.project.proj_coordinates.forEach(function (loc) {
                                    company.proj_coordinates.push({
                                        'lat': loc.loc[0],
                                        'lng': loc.loc[1],
                                        'message': link.project.proj_name,
                                        'timestamp': loc.timestamp,
                                        'type': 'project',
                                        'id': link.project.proj_id
                                    });
                                });
                                company.proj_coordinates = _.uniq(company.proj_coordinates, function (a) {
                                    return a.id;
                                });
                                if (link.project.proj_commodity.length>0) {
                                    if (_.where(company.company_commodity, {_id: _.last(link.project.proj_commodity).commodity._id}).length<1) {
                                        company.company_commodity.push({
                                            _id: _.last(link.project.proj_commodity).commodity._id,
                                            commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                        });
                                    }
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
                                        concession_country: _.first(link.concession.concession_country).country,
                                        concession_commodities: link.concession.concession_commodity,
                                        concession_status: link.concession.concession_status
                                    });
                                }
                                if (link.concession.concession_commodity.length>0) {
                                    if (_.where(company.company_commodity, {_id: _.last(link.concession.concession_commodity).commodity._id}).length<1) {
                                        company.company_commodity.push({
                                            _id: _.last(link.concession.concession_commodity).commodity._id,
                                            commodity_name: _.last(link.concession.concession_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.concession.concession_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.concession.concession_commodity).commodity.commodity_id
                                        });
                                    }

                                }
                                break;
                            case 'contract':
                                //TODO Add handling for OO and simple URL
                                if (!_.contains(company.contracts_link, link.contract.contract_id)) {
                                    company.contracts_link.push({_id:link.contract.contract_id});
                                }
                                break;
                            default:
                                console.log(entity, 'link skipped...');
                        }
                        if (link_counter == link_len) {
                            callback(null, company);
                        }
                    });
                } else{
                    callback(null, company);
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