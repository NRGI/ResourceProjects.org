var Contract 		= require('mongoose').model('Contract'),
    Country 		= require('mongoose').model('Country'),
    Source 			= require('mongoose').model('Source'),
    Link 	        = require('mongoose').model('Link'),
    Company 		= require('mongoose').model('Company'),
    Commodity 		= require('mongoose').model('Commodity'),
    Project 		= require('mongoose').model('Project'),
    Transfer 		= require('mongoose').model('Transfer'),
    Production 		= require('mongoose').model('Production'),
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
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function contractCount(callback) {
        Contract.find({}).count().exec(function(err, contract_count) {
            if(contract_count) {
                callback(null, contract_count);
            } else {
                return res.send(err);
            }
        });
    }
    function getContractSet(contract_count, callback) {
        Contract.find({})
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
                    return res.send({data:[],error:err});
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
                    console.log(body)
                    ++contract_counter;
                    var body = JSON.parse(body);
                    contract.rc_info.push({
                        contract_name: body.name,
                        contract_country: body.country,
                        contract_commodity: body.resource,
                        contract_type: body.contract_type,
                        open_contracting_id: body.open_contracting_id
                    });
                    if(body.resource!=undefined){
                        var commodity = body.resource;
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
        if(contract_len>0) {
            contracts.forEach(function (contract) {
                ++contract_counter;
                contract.commodity = [];
                if (contract.commodities.length > 0) {
                    contract.commodities.forEach(function (commodity_name) {
                        if (commodity_name != undefined) {
                            Commodity.find({commodity_name: commodity_name})
                                .exec(function (err, commodity) {
                                    commodity.map(function (name) {
                                        return contract.commodity.push({
                                            commodity_name: commodity_name,
                                            commodity_type: name.commodity_type,
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
                } else if (contract_counter == contract_len) {
                    callback(null, contract_count, contracts);
                }
            })
        } else{
            callback(null, contract_count, contracts);
        }
    }
    function getContractLinks(contract_count, contracts, callback) {
        contract_len = contracts.length;
        contract_counter = 0;

        if(contract_len>0) {
            contracts.forEach(function (c) {
                Link.find({contract: c._id, $or: [{entities: 'site'}, {entities: 'project'}]})
                    .exec(function (err, links) {
                        ++contract_counter;
                        link_len = links.length;
                        link_counter = 0;
                        c.projects = 0;
                        c.sites = 0;
                        c.fields = 0;
                        if (link_len > 0) {
                            links.forEach(function (link) {
                                ++link_counter;
                                var entity = _.without(link.entities, 'contract')[0]
                                switch (entity) {
                                    case 'project':
                                        c.projects += 1;
                                        break;
                                    case 'site':
                                        if (link.field) {
                                            c.fields += 1;
                                        } else {
                                            c.sites += 1;
                                        }
                                        break;
                                    default:
                                        console.log(entity, 'link skipped...');
                                }
                                if (contract_counter == contract_len && link_counter == link_len) {
                                    callback(null, {data: contracts, count: contract_count});
                                }

                            });
                        } else if (contract_counter == contract_len) {
                            callback(null, {data: contracts, count: contract_count});
                        }
                    });
            });
        }else{
            callback(null, contract_count, contracts);
        }
    }
};

exports.getContractByID = function(req, res) {
    var link_counter, link_len;

    async.waterfall([
        getContract,
        getContractRCData,
        getCommodity,
        getContractLinks
        //TODO finish deeply linked projects and sites
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });

    function getContract(callback) {
        Contract.findOne({contract_id: req.params.id})
            .lean()
            .exec(function(err, contract) {
                if(contract) {
                    callback(null, contract);
                } else {
                    return res.send({data:[],error:err});
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
                contract_type: body.contract_type,
                open_contracting_id: body.open_contracting_id
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
                                    commodity_id: name.commodity_id,
                                    commodity_type: name.commodity_type
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
    function getContractLinks(contract, callback) {
        contract.concessions = [];
        contract.location=[];
        Link.find({contract: contract._id})
            .populate('company')
            .populate('site')
            .deepPopulate('project.proj_country.country project.proj_commodity.commodity concession.concession_country.country concession.concession_commodity.commodity source.source_type_id site.site_country.country site.site_commodity.commodity')
            .exec(function (err, links) {
                link_len = links.length;
                link_counter = 0;
                if (link_len > 0) {
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'contract')[0];
                        switch (entity) {
                            case 'site':
                                if (link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        if(loc && loc.loc) {
                                            contract.location.push({
                                                'lat': loc.loc[0],
                                                'lng': loc.loc[1],
                                                'message': link.site.site_name,
                                                'timestamp': loc.timestamp,
                                                'type': 'field',
                                                'id': link.site._id
                                            });
                                        }
                                    });
                                } else if (!link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        if(loc && loc.loc) {
                                            contract.location.push({
                                                'lat': loc.loc[0],
                                                'lng': loc.loc[1],
                                                'message': link.site.site_name,
                                                'timestamp': loc.timestamp,
                                                'type': 'site',
                                                'id': link.site._id
                                            });
                                        }
                                    });
                                }
                                break;
                            case 'concession':
                                if (!contract.concessions.hasOwnProperty(link.concession._id)) {
                                    contract.concessions.push({
                                        _id: link.concession._id,
                                        concession_name: link.concession.concession_name,
                                        concession_country: _.find(link.concession.concession_country.reverse()).country,
                                        concession_type: _.find(link.concession.concession_type.reverse()),
                                        concession_commodities: link.concession.concession_commodity,
                                        concession_status: link.concession.concession_status,
                                        concession_polygon: link.concession.concession_polygon
                                    });
                                }
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
};

