var Concession 		= require('mongoose').model('Concession'),
    Country 		= require('mongoose').model('Country'),
    Source 			= require('mongoose').model('Source'),
    Alias 			= require('mongoose').model('Alias'),
    Link            = require('mongoose').model('Link'),
    Company 		= require('mongoose').model('Company'),
    Commodity 		= require('mongoose').model('Commodity'),
    Project 		= require('mongoose').model('Project'),
    Contract 		= require('mongoose').model('Contract'),
    async           = require('async'),
    _               = require("underscore"),
    encrypt 	= require('../utilities/encryption');


exports.getConcessions = function(req, res) {
    var concession_len, link_len, concession_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        concessionCount,
        getConcessionSet,
        getConcessionLinks,
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });
    function concessionCount(callback) {
        Concession.find({}).count().exec(function(err, concession_count) {
            if(concession_count) {
                callback(null, concession_count);
            } else {
                callback(err);
            }
        });
    }
    function getConcessionSet(concession_count, callback) {
        Concession.find(req.query)
            .sort({
                concession_name: 'asc'
            })
            .skip(skip * limit)
            .limit(limit)
            .populate('concession_country.country', '_id iso2 name')
            .populate('concession_commodity.commodity')
            .lean()
            .exec(function(err, concessions) {
                if(concessions) {
                    callback(null, concession_count, concessions);
                } else {
                    callback(err);
                }
            });
    }

    function getConcessionLinks(concession_count, concessions, callback) {
        concession_len = concessions.length;
        concession_counter = 0;

        concessions.forEach(function (c) {
            Link.find({concession: c._id})
                .populate('company_group','_id company_group_name')
                .populate('project')
                .exec(function(err, links) {
                    ++concession_counter;
                    link_len = links.length;
                    link_counter = 0;
                    c.projects = 0;
                    links.forEach(function(link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'concession')[0]
                        switch (entity) {
                            case 'project':
                                c.projects += 1;
                                break;
                            default:
                            console.log(entity, 'link skipped...');
                        }
                        if(concession_counter == concession_len && link_counter == link_len) {
                            res.send({data:concessions, count:concession_count});
                        }
                    });

                });
        });
    }
};

exports.getConcessionByID = function(req, res) {
    var link_counter, link_len;

    async.waterfall([
        getConcession,
        getConcessionLinks,
        //getContracts,
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });

    function getConcession(callback) {
        Concession.findOne({_id:req.params.id})
            .populate('concession_aliases', ' _id alias')
            .populate('concession_country.country')
            .populate('concession_commodity.commodity')
            .lean()
            .exec(function(err, concession) {
                if(concession) {
                    callback(null, concession);
                } else {
                    callback(err);
                }
            });
    }
    function getConcessionLinks(concession, callback) {
        Link.find({concession: concession._id})
            .populate('commodity')
            .populate('contract')
            .populate('company')
            //.populate('concession', 'concession_name concession_country concession_type commodities')
            .deepPopulate('project project.proj_country.country project.proj_commodity.commodity')
            //.deepPopulate()
            .exec(function(err, links) {
                link_len = links.length;
                link_counter = 0;
                concession.commodities = {};
                concession.projects = [];
                concession.companies = {};
                concession.contracts = [];
                //concession.concessions = {};
                links.forEach(function(link) {
                    ++link_counter;
                    var entity = _.without(link.entities, 'concession')[0]
                    switch (entity) {
                        case 'commodity':
                            if (!concession.commodities.hasOwnProperty(link.commodity_code)) {
                                concession.commodities[link.commodity.commodity_code] = link.commodity.commodity_name;
                            }
                            break;
                        case 'company':
                            if (!concession.companies.hasOwnProperty(link.company._id)) {
                                concession.companies[link.company._id] = {
                                    company_name: link.company.company_name,
                                    //company_group_id: link.company_group.company_group_name,
                                    //company_group_name: link.company_group.company_group_name
                                };
                            }
                            break;
                        //case 'concession':
                        //    //console.log(link.concession);
                        //    if (!company.concessions.hasOwnProperty(link.concession._id)) {
                        //        //console.log(_.find(link.concession.concession_country.reverse()).country);
                        //        company.concessions[link.concession._id] = {
                        //            concession_name: link.concession.concession_name,
                        //            concession_country: _.find(link.concession.concession_country.reverse()).country,
                        //            concession_type: _.find(link.concession.concession_type.reverse()),
                        //            //    concession_commodity: link.concession,
                        //            concession_status: _.find(link.concession.concession_status.reverse())
                        //        };
                        //        company.concessions[link.concession._id+'kkk'] = {
                        //            concession_name: link.concession.concession_name,
                        //            concession_country: _.find(link.concession.concession_country.reverse().country),
                        //            concession_type: _.find(link.concession.concession_type.reverse()),
                        //            concession_commodities: link.concession.concession_commodity,
                        //            concession_status: link.concession.concession_status
                        //            //
                        //            //
                        //            //
                        //            //    link.concession.commodity_name
                        //        };
                        //    }
                        //    break;
                        case 'contract':
                            if (!_.contains(concession.contracts, link.contract.contract_id)) {
                                concession.contracts.push(link.contract.contract_id);
                            }
                            break;
                        case 'project':
                            concession.projects.push(link);
                            break;

                        default:
                            console.log(entity, 'link skipped...');
                    }
                    if(link_counter == link_len) {
                        res.send(concession);
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

//exports.getConcessionByID = function(req, res) {
//    var country=[];var project=[];var source=[];var alias=[];var companies=[];var contracts=[];var commodities=[];var concessions=[];
//    Commodity.find(req.query).exec(function(err, collection) {
//        commodities = collection;
//    });
//    Company.find(req.query).exec(function(err, collection) {
//        companies = collection;
//    });
//    Alias.find(req.query).exec(function(err, collection) {
//        alias = collection;
//    });
//    Source.find(req.query).exec(function(err, collection) {
//        source = collection;
//    });
//    Country.find(req.query).exec(function(err, collection) {
//        country = collection;
//    });
//    Project.find(req.query).exec(function(err, collection) {
//        project = collection;
//    });
//    Contract.find(req.query).exec(function(err, collection) {
//        contracts = collection;
//    });
//    Concession.findOne({_id:req.params.id}).exec(function(err, collection) {
//        setTimeout(function() {
//            if (collection != null || collection != undefined) {
//                concessions = collection;
//                if (collection.concession_status.length != 0) {
//                    source.forEach(function (source_item) {
//                        if (source_item._id.toString() == collection.concession_status[0].source.toString()) {
//                            concessions.concession_status[0] = {
//                                source: collection.concession_status[0].source,
//                                date: source_item.source_date,
//                                string: collection.concession_status[0].string
//                            };
//                        }
//                    })
//                }
//                if (collection.concession_aliases.length != 0) {
//                    collection.concession_aliases.forEach(function (aliases, i) {
//                        alias.forEach(function (alias_item) {
//                            if (alias_item._id.toString() == aliases.toString()) {
//                                concessions.concession_aliases[i] = {
//                                    _id: aliases,
//                                    name: alias_item.alias
//                                };
//                            }
//
//                        })
//                    })
//                }
//                if (collection.contracts.length != 0) {
//                    collection.contracts.forEach(function (contract, i) {
//                        contracts.forEach(function (contract_item) {
//                            if (contract_item._id.toString() == contract.toString()) {
//                                concessions.contracts[i] = {
//                                    _id: contract,
//                                    name: contract_item.contract_id
//                                };
//                            }
//
//                        })
//                    })
//                }
//                if (collection.commodities.length != 0) {
//                    collection.commodities.forEach(function (commodity, i) {
//                        commodities.forEach(function (commodity_item) {
//                            if (commodity_item._id.toString() == commodity.toString()) {
//                                concessions.commodities[i] = {
//                                    _id: commodity,
//                                    name: commodity_item.commodity_name
//                                };
//                            }
//
//                        })
//                    })
//                }
//                //if (collection.companies.length != 0) {
//                //	collection.companies.forEach(function (company, i) {
//                //		companies.forEach(function (company_item) {
//                //			if (company_item._id.toString() == company.toString()) {
//                //				concessions.companies[i] = {
//                //					_id: company,
//                //					name: company_item.company_name
//                //				};
//                //			}
//                //
//                //		})
//                //	})
//                //}
//                country.forEach(function (country_item) {
//                    if (collection.concession_country.length != 0) {
//                        if (collection.concession_country[0].string != undefined) {
//                            if (country_item._id == collection.concession_country[0].string.toString()) {
//                                concessions.concession_country[0] = {
//                                    source: collection.concession_country[0].source,
//                                    string: collection.concession_country[0].string,
//                                    _id: country_item._id,
//                                    name: country_item.name,
//                                    iso2: country_item.iso2
//                                };
//                            }
//                        }
//                    }
//                });
//                res.send(concessions);
//            } else {
//                res.send(collection);
//            }
//        },100);
//        //res.send(concession);
//    });
//};