var Concession 		= require('mongoose').model('Concession'),
    //Country 		= require('mongoose').model('Country'),
    //Source 			= require('mongoose').model('Source'),
    //Alias 			= require('mongoose').model('Alias'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Link            = require('mongoose').model('Link'),
    //Company 		= require('mongoose').model('Company'),
    //Commodity 		= require('mongoose').model('Commodity'),
    //Project 		= require('mongoose').model('Project'),
    //Contract 		= require('mongoose').model('Contract'),
    async           = require('async'),
    _               = require("underscore");

exports.getConcessions = function(req, res) {
    var concession_len, link_len, concession_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        concessionCount,
        getConcessionSet,
        getConcessionLinks
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
    var link_counter, link_len,concession_counter, concession_len;

    async.waterfall([
        getConcession,
        getTransfers,
        getConcessionLinks,
        getCompanyGroup,
        getProjectLocation
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
    function getTransfers(concession, callback) {
        concession.transfers = [];
        Transfer.find({transfer_concession: concession._id})
            .populate('transfer_country')
            .populate('transfer_company', '_id company_name')
            .exec(function(err, transfers) {
                _.each(transfers, function(transfer) {
                    concession.transfers.push(transfer);
                });
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
                concession.companies = [];
                concession.contracts = [];
                if(link_len>0) {
                    //concession.concessions = {};
                    links.forEach(function (link) {
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
                                    concession.companies.push({
                                        _id: link.company._id,
                                        company_name: link.company.company_name
                                    });
                                }
                                break;
                            case 'contract':
                                if (!_.contains(concession.contracts, link.contract.contract_id)) {
                                    concession.contracts.push(link.contract.contract_id);
                                }
                                break;
                            case 'project':
                                concession.projects.push(link.project);
                                break;

                            default:
                                console.log(entity, 'link skipped...');
                        }
                        if (link_counter == link_len) {

                            callback(null, concession);
                            //res.send(concession);
                        }
                    });
                } else{
                    callback(null, concession);
                }
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
    function getCompanyGroup(concession, callback) {
        concession_len = concession.companies.length;
        concession_counter = 0;
        if(concession_len>0) {
            concession.companies.forEach(function (company) {
                Link.find({company: company._id})
                    .populate('company_group', '_id company_group_name')
                    .exec(function (err, links) {
                        ++concession_counter;
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
                                        console.log(entity, 'link skipped...');
                                }
                            });
                        if (concession_counter == concession_len && link_counter == link_len) {
                            callback(null, concession);
                        }
                    });
            });
        } else {
            callback(null, concession);
        }
    }
    function getProjectLocation(concession,callback) {
        var project_counter = 0;
        concession.location = [];
        var project_len = concession.projects.length;
        if(project_len>0) {
            concession.projects.forEach(function (project) {
                ++project_counter;
                project.proj_coordinates.forEach(function (loc) {
                    concession.location.push({
                        'lat': loc.loc[0],
                        'lng': loc.loc[1],
                        'message': "<a href =\'/project/" + project._id + "\'>" + project.proj_name + "</a><br>" + project.proj_name
                    });
                    if (project_counter == project_len) {
                        res.send(concession);
                    }
                })
            });
        } else{
            res.send(concession);
        }
    }
};
exports.createConcession = function(req, res, next) {
    var concessionData = req.body;
    Concession.create(concessionData, function(err, concession) {
        if(err){
            res.status(400);
            err = new Error('Error');
            return res.send({reason:err.toString()})
        } else{
            res.send();
        }
    });

};
exports.updateConcession = function(req, res) {
    var concessionUpdates = req.body;
    Concession.findOne({_id:req.body._id}).exec(function(err, concession) {
        if(err) {
            res.status(400);
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
        concession.concession_name= concessionUpdates.concession_name;
        //concession.concession_aliases= concessionUpdates.concession_aliases;
        //concession.concession_established_source= concessionUpdates.concession_established_source;
        concession.description= concessionUpdates.description;
        //concession.concession_country= concessionUpdates.concession_country;
        //concession.concession_status= concessionUpdates.concession_status;
        //concession.concession_type= concessionUpdates.concession_type;
        //concession.concession_commodity= concessionUpdates.concession_commodity;
        //concession.oo_concession_id= concessionUpdates.oo_concession_id;
        //concession.oo_url_api= concessionUpdates.oo_url_api;
        //concession.oo_url_wiki= concessionUpdates.oo_url_wiki;
        //concession.oo_source_date= concessionUpdates.oo_source_date;
        //concession.oo_details= concessionUpdates.oo_details;
        concession.save(function(err) {
            if(err) {
                err = new Error('Error');
                return res.send({reason: err.toString()});
            } else{
                res.send();
            }
        })
    });
};
exports.deleteConcession = function(req, res) {
    Concession.remove({_id: req.params.id}, function(err) {
        if(!err) {
            res.send();
        }else{
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
    });
};