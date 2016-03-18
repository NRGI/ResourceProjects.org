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
    var contract_len, link_len, contract_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        contractCount,
        getContractSet,
        getContractRCData,
        getCommodity,
        getContractLinks
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
        contract_len = contracts.length;
        contract_counter = 0;
        if(contract_len>0) {
            _.each(contracts, function (contract) {
                contract.rc_info=[];
                contract.commodities=[];
                request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract.contract_id + '/metadata', function (err, res, body) {
                    ++contract_counter;
                    var body = JSON.parse(body);
                    contract.rc_info.push({
                        contract_name: body.name,
                        contract_country: body.country,
                        contract_commodity: body.resource,
                        contract_type: body.contract_type
                    });
                    if(body.resource!=undefined){
                        var commodity =body.resource;
                        commodity.map(function(name){return contract.commodities.push(name);});
                    }
                    if (contract_counter == contract_len) {
                        callback(null, contract_count, contracts);
                    }
                });
            });
        } else{
            callback(null, contract_count, contracts);
        }
    }
    function getCommodity(contract_count, contracts, callback) {
        contract_len = contracts.length;
        contract_counter = 0;
        contracts.forEach(function (contract) {
            ++contract_counter;
            contract.commodity=[];
            if(contract.commodities.length>0) {
                contract.commodities.forEach(function (commodity_name) {
                    if (commodity_name != undefined) {
                        Commodity.find({commodity_name: commodity_name})
                            .exec(function (err, commodity) {
                                commodity.map(function (name) {
                                    return contract.commodity.push({
                                        commodity_name: commodity_name,
                                        _id: name._id,
                                        commodity_id: name.commodity_id
                                    });
                                });
                                if (contract_counter == contract_len) {
                                    callback(null, contract_count, contracts);
                                }
                            });
                    }
                })
            }else if(contract_counter == contract_len) {callback(null, contract_count, contracts);}
        })
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
                    if(link_len>0) {
                        links.forEach(function (link) {
                            ++link_counter;
                            var entity = _.without(link.entities, 'contract')[0]
                            switch (entity) {
                                case 'project':
                                    c.projects += 1;
                                    break;
                                default:
                                //console.log(entity, 'link skipped...');
                            } if (contract_counter == contract_len && link_counter == link_len) {
                                res.send({data: contracts, count: contract_count});
                            }

                        });
                    } else if (contract_counter == contract_len) {
                        res.send({data: contracts, count: contract_count});
                    }
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
        getCompanyGroup,
        getCommodity,
        getProjectLocation
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
            contract.rc_info = [];
            contract.commodities=[];
            var body = JSON.parse(body);
            contract.rc_info = {
                contract_name: body.name,
                contract_country: body.country,
                contract_commodity: body.resource,
                contract_type: body.contract_type
            };
            if (body.resource != undefined) {
                var commodity = body.resource;
                commodity.map(function (name) {
                    return contract.commodities.push(name);
                });
            }
            callback(null, contract);
        });
    }
    function getContractLinks(contract, callback) {
        contract.projects = [];
        contract.companies = [];
        contract.concessions = [];
        contract.sources = {};
        Link.find({contract: contract._id})
            .populate('company')
            .populate('commodity')
            .deepPopulate('project project.proj_country.country project.proj_commodity.commodity ' +
            'concession concession.concession_country.country concession.concession_commodity.commodity source.source_type_id')
            .exec(function (err, links) {
                link_len = links.length;
                link_counter = 0;
                if (link_len > 0) {
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'contract')[0];
                        if(link.source!=undefined) {
                            if (!contract.sources[link.source._id]) {
                                contract.sources[link.source._id] = link.source;
                            }
                        }
                        switch (entity) {
                            //case 'commodity':
                            //    if (!contract.commodities.hasOwnProperty(link.commodity_code)) {
                            //        contract.commodities.push({
                            //            _id: link.commodity._id,
                            //            commodity_code: link.commodity.commodity_code,
                            //            commodity_name: link.commodity.commodity_name
                            //        });
                            //    }
                            //    break;
                            case 'concession':
                                if (!contract.concessions.hasOwnProperty(link.concession._id)) {
                                    contract.concessions.push({
                                        _id: link.concession._id,
                                        concession_name: link.concession.concession_name,
                                        concession_country: _.find(link.concession.concession_country.reverse()).country,
                                        concession_type: _.find(link.concession.concession_type.reverse()),
                                        concession_commodities: link.concession.concession_commodity,
                                        concession_status: link.concession.concession_status
                                    });
                                }
                                break;
                            case 'company':
                                if (!contract.companies.hasOwnProperty(link.company._id)) {
                                    contract.companies.push({
                                        _id: link.company._id,
                                        company_name: link.company.company_name
                                    });
                                }
                                break;
                            case 'project':
                                contract.projects.push(link.project);
                                break;

                            default:
                                console.log(entity, 'link skipped...');
                        }
                        if (link_counter == link_len) {
                            callback(null, contract);
                        }
                    });
                } else {
                    callback(null, contract);
                }
            });
    }
    function getCompanyGroup(contract, callback) {
        var project_len = contract.companies.length;
        var project_counter = 0;
        if(project_len>0) {
            contract.companies.forEach(function (company) {
                Link.find({company: company._id})
                    .populate('company_group', '_id company_group_name')
                    .exec(function (err, links) {
                        if (links.length > 0) {
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
                                if (project_counter == project_len && link_counter == link_len) {
                                    callback(null, contract);
                                }
                            });
                        } else {
                            callback(null, contract);
                        }
                    });
            });
        } else {
            callback(null, contract);
        }
    }
    function getCommodity(contract, callback) {
        var commodity_len = contract.commodities.length;
        var commodity_counter = 0;
        contract.commodity=[];
        if(commodity_len>0) {
            contract.commodities.forEach(function (commodity_name) {
                if (commodity_name != undefined) {
                    Commodity.find({commodity_name: commodity_name})
                        .exec(function (err, commodity) {
                            ++commodity_counter;
                            commodity.map(function (name) {
                                return contract.commodity.push({
                                    commodity_name: commodity_name,
                                    _id: name._id,
                                    commodity_id: name.commodity_id
                                });
                            });
                            if (commodity_counter == commodity_len) {
                                callback(null, contract);
                            }
                        });
                }
            })
        } else{
            callback(null, contract);
        }
    }
    function getProjectLocation(contract,callback) {
        var project_counter = 0;
        contract.location = [];
        var project_len = contract.projects.length;
        if(project_len>0) {
            contract.projects.forEach(function (project) {
                ++project_counter;
                project.proj_coordinates.forEach(function (loc) {
                    contract.location.push({
                        'lat': loc.loc[0],
                        'lng': loc.loc[1],
                        'message':  project.proj_name
                    });
                    if (project_counter == project_len) {
                        res.send(contract);
                    }
                })
            });
        } else{
            res.send(contract);
        }
    }

};

