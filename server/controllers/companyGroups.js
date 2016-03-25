var CompanyGroup 		= require('mongoose').model('CompanyGroup'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Project 	    = require('mongoose').model('Project'),
    Commodity 	    = require('mongoose').model('Commodity'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');
//.populate('comments.author', 'firstName lastName role')
// Transfer.find({$or: [
//     {project:{$in: project.transfers_query}},
//     {site:{$in: project.transfers_query}},
//     {company:{$in: project.transfers_query}},
//     {country:{$in: project.transfers_query}},
//     {concession:{$in: project.transfers_query}}]})
// Production.find({$or: [
//     {project:{$in: project.transfers_query}},
//     {site:{$in: project.transfers_query}},
//     {country:{$in: project.transfers_query}},
//     {concession:{$in: project.transfers_query}}]})
exports.getCompanyGroups = function(req, res) {
    var companyGroup_len, link_len, companyGroup_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        companyGroupCount,
        getCompanyGroupSet,
        getCompanyGroupLinks,
        getLinkedCompanyProjects
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });

    function companyGroupCount(callback) {
        CompanyGroup.find({}).count().exec(function(err, companyGroup_count) {
            if(companyGroup_count) {
                callback(null, companyGroup_count);
            } else {
                callback(err);
            }
        });
    }
    function getCompanyGroupSet(companyGroup_count, callback) {
        CompanyGroup.find(req.query)
            .sort({
                company_group_name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(function(err, companyGroups) {
                if(companyGroups) {
                    callback(null, companyGroup_count, companyGroups);
                } else {
                    callback(err);
                }
            });
    }
    function getCompanyGroupLinks(companyGroup_count, companyGroups, callback) {
        companyGroup_len = companyGroups.length;
        companyGroup_counter = 0;
        companyGroups.forEach(function (group) {
            Link.find({company_group: group._id})
                .populate('company')
                .populate('project')
                .exec(function(err, links) {
                    ++companyGroup_counter;
                    link_len = links.length;
                    link_counter = 0;
                    group.company_count = 0;
                    group.companies = {};
                    links.forEach(function(link) {
                        ++link_counter;

                        var entity = _.without(link.entities, 'company_group')[0];
                        switch (entity) {
                            case 'company':
                                group.companies={company: link.company._id};
                                group.company_count += 1;
                                break;
                            default:
                                console.log(entity, 'link skipped...');
                        }
                    });
                    if(companyGroup_counter == companyGroup_len && link_counter == link_len) {
                        callback(null, companyGroup_count, companyGroups);
                    }
                });
        });
    }
    function getLinkedCompanyProjects (companyGroup_count, companyGroups, callback){
        companyGroup_len = companyGroups.length;
        companyGroup_counter = 0;
        if(companyGroup_len>0) {
            async.forEach(companyGroups, function (group) {
                if(Object.keys(group.companies).length != 0) {
                    Link.find({entities: 'project',$or: [group.companies]})
                        .count()
                        .exec(function (err, proj_count) {
                            ++companyGroup_counter;
                            group.project_count = 0;
                            group.project_count = proj_count;
                            if (companyGroup_counter == companyGroup_len) {
                                res.send({data: companyGroups, count: companyGroup_count});
                            }
                        });
                }else{
                    ++companyGroup_counter;
                }
                if(Object.keys(group.companies).length == 0 && companyGroup_counter == companyGroup_len) {
                    res.send({data: companyGroups, count: companyGroup_count});
                }
                });
        } else {
            res.send({data:companyGroups, count:companyGroup_count});
        }
    }
};

exports.getCompanyGroupByID = function(req, res) {
    var link_counter, link_len, company_counter, company_len;

    async.waterfall([
        getCompanyGroup,
        getCompanyGroupLinks,
        getProjectCompany,
        getTransfers,
        getContracts,
        getCommodity,
        getProjectLocation
    ], function (err, result) {
        if (err) {
            res.send(err);
        }
    });

    function getCompanyGroup(callback) {
        CompanyGroup.findOne({_id:req.params.id})
            .populate('company_group_aliases', '_id alias')
            .populate('company','_id company_name')
            .lean()
            .exec(function(err, companyGroup) {
                if(companyGroup) {
                    callback(null, companyGroup);
                } else {
                    callback(err);
                }
            });
    }
    function getCompanyGroupLinks(companyGroup, callback) {
        companyGroup.companies = [];
        companyGroup.commodities = [];
        companyGroup.concessions = [];
        companyGroup.sources = {};
        Link.find({company_group: companyGroup._id})
            .populate('company','_id company_name')
            .populate('commodity')
            .populate('contract')
            .deepPopulate('source.source_type_id')
            .exec(function(err, links) {
                link_len = links.length;
                if(link_len>0) {
                    link_counter = 0;
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'company_group')[0];
                        if(link.source!=undefined) {
                            if (!companyGroup.sources[link.source._id]) {
                                companyGroup.sources[link.source._id] = link.source;
                            }
                        }
                        switch (entity) {
                            case 'commodity':
                                if (!companyGroup.commodities.hasOwnProperty(link.commodity_code)) {
                                    companyGroup.commodities.push({
                                        _id: link.commodity._id,
                                        commodity_code: link.commodity.commodity_code,
                                        commodity_name: link.commodity.commodity_name,
                                        commodity_id: link.commodity.commodity_id
                                    })
                                }
                                break;
                            case 'company':
                                if (!companyGroup.companies.hasOwnProperty(link.company.company_name)) {
                                    companyGroup.companies.push({
                                        _id: link.company._id,
                                        company_name: link.company.company_name
                                    });
                                }
                                break;
                            default:
                                console.log(entity, 'link skipped...');
                        }
                        if (link_counter == link_len) {
                            callback(null, companyGroup);
                        }
                    });
                } else{
                    callback(null, companyGroup);
                }
            });
    }
    function getProjectCompany(companyGroup,callback) {
        var c_counter = 0;
        companyGroup.projects = [];
        companyGroup.concessions = [];
        companyGroup.contracts_link = [];
        var c_len = companyGroup.companies.length;
        if(c_len>0) {
            companyGroup.companies.forEach(function (company) {
                Link.find({company: company._id})
                    .populate('project')
                    .populate('contract')
                    .deepPopulate('project project.proj_country.country project.proj_commodity.commodity ' +
                        'concession concession.concession_country.country concession.concession_commodity.commodity')
                    .exec(function(err, links) {
                        link_len = links.length;
                        ++c_counter;
                        link_counter = 0;
                        links.forEach(function(link) {
                            ++link_counter;
                            var entity = _.without(link.entities, 'company')[0]
                            switch (entity) {
                                case 'project':
                                    companyGroup.projects.push(link.project);
                                    break;
                                case 'contract':
                                    if (!_.contains(companyGroup.contracts_link, link.contract.contract_id)) {
                                        companyGroup.contracts_link.push({_id:link.contract.contract_id});
                                    }
                                    break;
                                case 'concession':
                                    if (!companyGroup.concessions.hasOwnProperty(link.concession._id)) {
                                        companyGroup.concessions.push({
                                            _id:link.concession._id,
                                            concession_name: link.concession.concession_name,
                                            concession_country: _.find(link.concession.concession_country.reverse()).country,
                                            concession_type: _.find(link.concession.concession_type.reverse()),
                                            concession_commodities: link.concession.concession_commodity,
                                            concession_status: link.concession.concession_status
                                        });
                                    }
                                    break;
                                default:
                            }
                            if(c_counter == c_len && link_counter == link_len) {
                                callback(null, companyGroup);
                            }
                        });

                    });
            });
        } else{
            callback(null, companyGroup);
        }
    }
    //function getTransfers(companyGroup, callback) {
    //    companyGroup.transfers = [];
    //    company_counter = 0;
    //    company_len = companyGroup.companies.length;
    //    var transfer_counter = 0;var transfer_len;
    //    if(company_len>0) {
    //        companyGroup.companies.forEach(function (company) {
    //            ++company_counter;
    //            Transfer.find({transfer_company: company._id})
    //                .populate('transfer_country')
    //                .populate('transfer_company', '_id company_name')
    //                .exec(function (err, transfers) {
    //                    transfer_len = transfers.length;
    //                    _.each(transfers, function (transfer) {
    //                        ++transfer_counter;
    //                        companyGroup.transfers.push(transfer);
    //                        if (company_counter == company_len && transfer_len==transfer_counter) {
    //                            callback(null, companyGroup);
    //                        }
    //                    });
    //                });
    //        });
    //    } else{
    //        callback(null, companyGroup);
    //    }
    //}
    function getContracts(companyGroup, callback) {
        companyGroup.contracts = [];
        var contract_counter = 0;
        var contract_len = companyGroup.contracts_link.length;
        if(contract_len>0) {
            _.each(companyGroup.contracts_link, function (contract) {
                request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract._id + '/metadata', function (err, res, body) {
                    var body = JSON.parse(body);
                    ++contract_counter;
                    companyGroup.contracts.push({
                        _id: contract._id,
                        contract_name: body.name,
                        contract_country: body.country,
                        contract_commodity: body.resource
                    });
                    if (contract_counter == contract_len) {
                        callback(null, companyGroup);
                    }
                });

            });
        } else{
            callback(null, companyGroup);
        }
    }
    function getCommodity(companyGroup, callback) {
        var contract_len = companyGroup.contracts.length;
        var contract_counter = 0;
        if(contract_len>0) {
            companyGroup.contracts.forEach(function (contract) {
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
                                        callback(null, companyGroup);
                                    }
                                });
                        }
                    })
                }
            })
        } else{
            callback(null, companyGroup);
        }
    }
    function getTransfers(companyGroup, callback) {
        companyGroup.transfers = [];
        company_counter = 0;
        company_len = companyGroup.companies.length;
        var transfer_counter = 0;var transfer_len;
        if(company_len>0) {
            companyGroup.companies.forEach(function (company) {
                ++company_counter;
                Transfer.find({company: company._id})
                    .populate('country')
                    .populate('company', '_id company_name')
                    .exec(function (err, transfers) {
                        transfer_len = transfers.length;
                        _.each(transfers, function (transfer) {
                            ++transfer_counter;
                            companyGroup.transfers.push(transfer);
                            if (company_counter == company_len && transfer_len==transfer_counter) {
                                callback(null, companyGroup);
                            }
                        });
                    });
            });
        } else{
            callback(null, companyGroup);
        }
    }
    function getProjectLocation(companyGroup,callback) {
        var project_counter = 0;
        companyGroup.location = [];
        var project_len = companyGroup.projects.length;
        if(companyGroup.projects.length>0) {
            companyGroup.projects.forEach(function (project) {
                ++project_counter;
                project.proj_coordinates.forEach(function (loc) {
                    companyGroup.location.push({
                        'lat': loc.loc[0],
                        'lng': loc.loc[1],
                        'message': project.proj_name,
                        'timestamp': loc.timestamp,
                        'type': 'project',
                        'id': project.proj_id
                        //'message': "<a href =\'/project/" + project.proj_id + "\'>" + project.proj_name + "</a><br>" + project.proj_name
                    });
                    if (project_counter == project_len) {
                        res.send(companyGroup);
                    }
                })
            });
        } else{
            res.send(companyGroup);
        }
    }
};

exports.createCompanyGroup = function(req, res, next) {
    var companyGroupData = req.body;
    CompanyGroup.create(companyGroupData, function(err, companyGroup) {
        if(err){
            res.status(400);
            err = new Error('Error');
            return res.send({reason:err.toString()})
        } else{
            res.send();
        }
    });
};

exports.updateCompanyGroup = function(req, res) {
    var companyGroupUpdates = req.body;
    CompanyGroup.findOne({_id:req.body._id}).exec(function(err, companyGroup) {
        if(err) {
            res.status(400);
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
        companyGroup.company_group_name= companyGroupUpdates.company_group_name;
        companyGroup.commodity_aliases= companyGroupUpdates.commodity_aliases;
        companyGroup.company_group_record_established= companyGroupUpdates.company_group_record_established;
        companyGroup.description= companyGroupUpdates.description;
        companyGroup.open_corporates_group_id= companyGroupUpdates.open_corporates_group_id;
        companyGroup.save(function(err) {
            if(err) {
                err = new Error('Error');
                return res.send({reason: err.toString()});
            } else {
                res.send();
            }
        })
    });
};

exports.deleteCompanyGroup = function(req, res) {
    CompanyGroup.remove({_id: req.params.id}, function(err) {
        if(!err) {
            res.send();
        }else{
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
    });
};