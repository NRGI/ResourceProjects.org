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
    Contract.findOne({_id:req.params.id}).exec(function(err, contract) {
        res.send(contract);
    });
};

