var Contract 		= require('mongoose').model('Contract'),
    Country 		= require('mongoose').model('Country'),
    Source 			= require('mongoose').model('Source'),
    Alias 			= require('mongoose').model('Alias'),
    Link 	        = require('mongoose').model('Link'),
    Company 		= require('mongoose').model('Company'),
    Commodity 		= require('mongoose').model('Commodity'),
    Project 		= require('mongoose').model('Project'),
    async           = require('async'),
    _               = require('underscore'),
    request         = require('request');

exports.getContracts = function(req, res) {
    var concession_len, link_len, concession_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        contractCount,
        getContractSet,
        getContractRCData,
        getContractLinks,
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });
    function contractCount(callback) {
        Contract.find({}).count().exec(function(err, contract_count) {
            if(contract_count) {
                callback(null, contract_count);
            } else {
                callback(err);
            }
        });
    }

    function getContractSet(contract_count, callback) {
        Contract.find(req.query)
            .sort({
                contract_id: 'asc'
            })
            .skip(skip * limit)
            .limit(limit)
            .lean()
            .exec(function(err, contracts) {
                if(contracts) {
                    callback(null, contract_count, contracts);
                } else {
                    callback(err);
                }
            });
    }
    function getContractRCData(contract_count, contracts, callback) {
        _.each(contracts, function(contract) {

            //request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract.contract_id + '/metadata', function (err, res, body) {
            //    if (!err && res.statusCode == 200) {
            //        contract.rc_info = {
            //            contract_name: body.name,
            //            contract_country: body.country,
            //            contract_commodity: body.resource
            //        }
            //    }
            //});
        });
        if(contracts) {
            callback(null, contract_count, contracts);
        } else {
            callback(err);
        }

    }
    function getContractLinks(contract_count, contracts, callback) {
        contract_len = contracts.length;
        contract_counter = 0;

        contracts.forEach(function (c) {
            Link.find({contract: c._id})
                .exec(function(err, links) {
                    ++contract_counter;
                    link_len = links.length;
                    link_counter = 0;
                    c.projects = 0;
                    links.forEach(function(link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'contract')[0]
                        switch (entity) {
                            case 'project':
                                c.projects += 1;
                                break;
                            default:
                            //console.log(entity, 'link skipped...');
                        }
                        if(contract_counter == contract_len && link_counter == link_len) {
                            res.send({data:contracts, count:contract_count});
                        }
                    });

                });

        });
    }
};
exports.getContractByID = function(req, res) {
    var link_counter, link_len;

    async.waterfall([
        getContract,
        getContractRCData,
        getContractLinks,
        //getTransfers,
        //getCompanyLinks,
        //getContracts,
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });

    function getContract(callback) {
        Contract.findOne({_id: req.params.id})
            //.populate('company_aliases', ' _id alias')
            //.populate('company_group','_id company_group_name')
            //.populate('country.country')
            .lean()
            .exec(function(err, contract) {
                if(contract) {
                    callback(null, contract);
                } else {
                    callback(err);
                }
            });
    }
    function getContractRCData(contract, callback) {
        request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract.contract_id + '/metadata', function (err, res, body) {
            contract.rc_info = {
                contract_name: body.name,
                contract_country: body.country,
                contract_commodity: body.resource
            }
        });
        if(contract) {
            callback(null, contract);
        } else {
            callback(err);
        }
    }
    function getContractLinks(contract, callback) {
        //console.log(company);
        Link.find({contract: contract._id})
            //.populate('company_group','_id company_group_name')
            //.populate('commodity')
            .populate('company')
            //.populate('concession', 'concession_name concession_country concession_type commodities')
            .deepPopulate('project project.proj_country.country project.proj_commodity.commodity ' +
            'concession concession.concession_country.country concession.concession_commodity.commodity')
            .exec(function(err, links) {
                link_len = links.length;
                link_counter = 0;
                //contract.company_groups = {};
                //contract.commodities = {};
                contract.projects = [];
                contract.companies = {};
                //contract.concessions = {};
                links.forEach(function(link) {
                    ++link_counter;
                    var entity = _.without(link.entities, 'contract')[0]
                    switch (entity) {
                        //case 'commodity':
                        //    if (!company.commodities.hasOwnProperty(link.commodity_code)) {
                        //        company.commodities[link.commodity.commodity_code] = link.commodity.commodity_name;
                        //    }
                        //    break;
                        //case 'company_group':
                        //    if (!company.company_groups.hasOwnProperty(link.company_group.company_group_name)) {
                        //        company.company_groups[link.company_group.company_group_name] = {
                        //            _id: link.company_group._id,
                        //            company_group_name: link.company_group.company_group_name
                        //        };
                        //    }
                        //    break;
                        //case 'concession':
                        //    if (!company.concessions.hasOwnProperty(link.concession._id)) {
                        //        company.concessions[link.concession._id] = {
                        //            concession_name: link.concession.concession_name,
                        //            concession_country: _.find(link.concession.concession_country.reverse()).country,
                        //            concession_type: _.find(link.concession.concession_type.reverse()),
                        //            concession_commodities: link.concession.concession_commodity,
                        //            concession_status: link.concession.concession_status
                        //        };
                        //        company.concessions[link.concession._id+'kkk'] = {
                        //            concession_name: link.concession.concession_name,
                        //            concession_country: _.find(link.concession.concession_country.reverse().country),
                        //            concession_type: _.find(link.concession.concession_type.reverse()),
                        //            concession_commodities: link.concession.concession_commodity,
                        //            concession_status: link.concession.concession_status
                        //        };
                        //    }
                        //    break;
                        case 'company':
                            if (!contract.companies.hasOwnProperty(link.company._id)) {
                                contract.companies[link.company._id] = {
                                    company_name: link.company.company_name,
                                    //company_group_id: link.company_group.company_group_name,
                                    //company_group_name: link.company_group.company_group_name
                                };
                            }
                            break;
                        case 'project':
                            contract.projects.push(link);
                            break;

                        default:
                            console.log(entity, 'link skipped...');
                    }
                    if(link_counter == link_len) {
                        res.send(contract);
                    }
                });
            });
    }

};

