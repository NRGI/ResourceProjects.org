var Company 		= require('mongoose').model('Company'),
    //CompanyGroup 	= require('mongoose').model('CompanyGroup'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    //Country			= require('mongoose').model('Country'),
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
            Link.find({company: c._id})
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
                                //console.log(entity, 'link skipped...');
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
        getTransfers,
        getCompanyLinks,
        getContracts,
        getProjectLocation
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
    function getCompanyLinks(company, callback) {
        company.company_groups = [];
        company.commodities = [];
        company.projects = [];
        company.contracts_link = [];
        company.concessions = [];
        Link.find({company: company._id})
            .populate('company_group','_id company_group_name')
            .populate('commodity')
            .populate('contract')
            .deepPopulate('project project.proj_country.country project.proj_commodity.commodity ' +
            'concession concession.concession_country.country concession.concession_commodity.commodity')
            .exec(function(err, links) {
                link_len = links.length;
                if(link_len>0) {
                    link_counter = 0;
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'company')[0]
                        switch (entity) {
                            case 'commodity':
                                if (!company.commodities.hasOwnProperty(link.commodity_code)) {
                                    company.commodities.push({
                                        _id: link.commodity._id,
                                        commodity_name: link.commodity.commodity_name
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
                                    //company.concessions[link.concession._id+'kkk'] = {
                                    //    concession_name: link.concession.concession_name,
                                    //    concession_country: _.find(link.concession.concession_country.reverse().country),
                                    //    concession_type: _.find(link.concession.concession_type.reverse()),
                                    //    concession_commodities: link.concession.concession_commodity,
                                    //    concession_status: link.concession.concession_status
                                    //};
                                }
                                break;
                            case 'contract':
                                //if (!company.contracts.hasOwnProperty(link.contract.contract_id)) {
                                //    request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + link.contract.contract_id + '/metadata', function (err, res, body) {
                                //        if (!err && res.statusCode == 200) {
                                //            company.contracts[link.contract.contract_id] = {
                                //                contract_name: body.name,
                                //                contract_country: body.country,
                                //                contract_commodity: body.resource
                                //            };
                                //        }
                                //    });
                                //}
                                if (!_.contains(company.contracts_link, link.contract.contract_id)) {
                                    company.contracts_link.push({_id:link.contract.contract_id});
                                }
                                break;
                            case 'project':
                                company.projects.push(link.project);
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
            res.status(400)
            return res.send({reason:err.toString()})
        }
    });
    res.send();
};
exports.updateCompany = function(req, res) {
    var companyUpdates = req.body;
    Company.findOne({_id:req.body._id}).exec(function(err, company) {
        if(err) {
            res.status(400);
            return res.send({ reason: err.toString() });
        }
        company._id=companyUpdates._id;
        company.company_name= companyUpdates.company_name;
        company.company_aliases= companyUpdates.company_aliases;
        company.company_established_source= companyUpdates.company_established_source;
        company.country_of_incorporation= companyUpdates.country_of_incorporation;
        company.countries_of_operation= companyUpdates.countries_of_operation;
        company.description= companyUpdates.description;
        company.save(function(err) {
            if(err)
                return res.send({ reason: err.toString() });
        })
    });
    res.send();
};

exports.deleteCompany = function(req, res) {

    Company.remove({_id: req.params.id}, function(err) {
        if(!err) {
            res.send();
        }else{
            return res.send({ reason: err.toString() });
        }
    });
    res.send();
};