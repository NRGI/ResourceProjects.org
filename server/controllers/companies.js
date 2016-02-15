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
        //getContracts,
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
        //console.log(company);
        Link.find({company: company._id})
            .populate('company_group','_id company_group_name')
            .populate('commodity')
            .populate('contract')
            //.populate('concession', 'concession_name concession_country concession_type commodities')
            .deepPopulate('project project.proj_country.country project.proj_commodity.commodity ' +
            'concession concession.concession_country.country concession.concession_commodity.commodity')
            //.deepPopulate()
            .exec(function(err, links) {
                link_len = links.length;
                link_counter = 0;
                company.company_groups = {};
                company.commodities = {};
                company.projects = [];
                company.contracts = {};
                company.contracts = [];
                company.concessions = {};
                links.forEach(function(link) {
                    ++link_counter;
                    var entity = _.without(link.entities, 'company')[0]
                    switch (entity) {
                        case 'commodity':
                            if (!company.commodities.hasOwnProperty(link.commodity_code)) {
                                company.commodities[link.commodity.commodity_code] = link.commodity.commodity_name;
                            }
                            break;
                        case 'company_group':
                            if (!company.company_groups.hasOwnProperty(link.company_group.company_group_name)) {
                                company.company_groups[link.company_group.company_group_name] = {
                                    _id: link.company_group._id,
                                    company_group_name: link.company_group.company_group_name
                                };
                            }
                            break;
                        case 'concession':
                            if (!company.concessions.hasOwnProperty(link.concession._id)) {
                                company.concessions[link.concession._id] = {
                                    concession_name: link.concession.concession_name,
                                    concession_country: _.find(link.concession.concession_country.reverse()).country,
                                    concession_type: _.find(link.concession.concession_type.reverse()),
                                    concession_commodities: link.concession.concession_commodity,
                                    concession_status: link.concession.concession_status
                                };
                                company.concessions[link.concession._id+'kkk'] = {
                                    concession_name: link.concession.concession_name,
                                    concession_country: _.find(link.concession.concession_country.reverse().country),
                                    concession_type: _.find(link.concession.concession_type.reverse()),
                                    concession_commodities: link.concession.concession_commodity,
                                    concession_status: link.concession.concession_status
                                };
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
                            if (!_.contains(company.contracts, link.contract.contract_id)) {
                                company.contracts.push(link.contract.contract_id);
                            }
                            break;
                        case 'project':
                            company.projects.push(link);
                            break;

                        default:
                            console.log(entity, 'link skipped...');
                    }
                    if(link_counter == link_len) {
                        res.send(company);
                    }
                });
            });
    }
    //function getContracts(company, callback) {
    //    company.contract_pull = {};
    //    //company.contracts.forEach(function(contract) {
    //    //    request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract + '/metadata', function (err, res, body) {
    //    //        company.contract_pull[contract] = {
    //    //            //contract_name: body.name,
    //    //            //contract_country: body.country,
    //    //            //contract_commodity: body.resource
    //    //        };
    //    //        //    if (!err && res.statusCode == 200) {
    //    //        //        //console.log(body); // Show the HTML for the Google homepage.
    //    //        //        company.contract_pull[contract] = {
    //    //        //            //contract_name: body.name,
    //    //        //            //contract_country: body.country,
    //    //        //            //contract_commodity: body.resource
    //    //        //        };
    //    //        //    }
    //    //    });
    //    //});
    //    _.each(company.contracts, function(contract) {
    //        request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract + '/metadata', function (err, res, body) {
    //            company.contract_pull[contract] = {
    //                //contract_name: body.name,
    //                //contract_country: body.country,
    //                //contract_commodity: body.resource
    //            };
    //        //    if (!err && res.statusCode == 200) {
    //        //        //console.log(body); // Show the HTML for the Google homepage.
    //        //        company.contract_pull[contract] = {
    //        //            //contract_name: body.name,
    //        //            //contract_country: body.country,
    //        //            //contract_commodity: body.resource
    //        //        };
    //        //    }
    //        });
    //    });
    //    if(company) {
    //        callback(null, company);
    //    } else {
    //        callback(err);
    //    }
    //    //console.log(company.contract_pull);
    //    //callback(null, company);
    //}
};