var CompanyGroup 		= require('mongoose').model('CompanyGroup'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    Project 	    = require('mongoose').model('Project'),
    Commodity 	    = require('mongoose').model('Commodity'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

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
        } else{
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
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
        CompanyGroup.find({})
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
                group.project_count = 0;
                if(Object.keys(group.companies).length != 0) {
                    Link.find({entities: 'project',$or: [group.companies]})
                        .populate('project')
                        .exec(function (err, proj_count) {
                            proj_count = _.map(_.groupBy(proj_count,function(doc){
                                if(doc.project!=undefined && doc.project._id!=undefined )
                                return doc.project._id;
                            }),function(grouped){
                                return grouped[0];
                            });
                            ++companyGroup_counter;
                            group.project_count = proj_count.length;
                            if (companyGroup_counter == companyGroup_len) {
                                callback(null, {data: companyGroups, count: companyGroup_count});
                            }
                        });
                }else{
                    ++companyGroup_counter;
                }
                if(Object.keys(group.companies).length == 0 && companyGroup_counter == companyGroup_len) {
                    callback(null, {data: companyGroups, count: companyGroup_count});
                }
                });
        } else {
            callback(null, {data:companyGroups, count:companyGroup_count});
        }
    }
};

exports.getCompanyGroupID = function(req, res) {

    async.waterfall([
        getCompanyGroup
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

    function getCompanyGroup(callback) {
        CompanyGroup.findOne({_id: req.params.id})
            .populate('company_group_aliases', '_id alias')
            .populate('company', '_id company_name')
            .lean()
            .exec(function (err, companyGroup) {
                if (companyGroup) {
                    callback(null, companyGroup);
                } else {
                    callback(null, companyGroup);
                }
            });
    }
}

exports.getCompanyGroupByID = function(req, res) {
    var companyGroup={}, link_counter, link_len, company_counter, company_len;

    async.waterfall([
        getCompanyGroupLinks,
        getCompanyLinks
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
    function getCompanyGroupLinks(callback) {
        companyGroup.companies = [];
        companyGroup.commodities = [];
        Link.find({company_group: req.params.id})
            .populate('company','_id company_name')
            .populate('commodity')
            .exec(function(err, links) {
                link_len = links.length;
                if(link_len>0) {
                    link_counter = 0;
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'company_group')[0];
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
    function getCompanyLinks(companyGroup,callback) {
        company_counter = 0;
        company_len = companyGroup.companies.length;
        if(company_len>0) {
            companyGroup.companies.forEach(function (company) {
                Link.find({company: company._id})
                    .populate('contract')
                    .deepPopulate('concession.concession_country.country concession.concession_commodity.commodity site.site_country.country site.site_commodity.commodity project.proj_country.country project.proj_commodity.commodity source.source_type_id')
                    .exec(function(err, links) {
                        link_len = links.length;
                        ++company_counter;
                        link_counter = 0;
                        if (link_len>0) {
                            links.forEach(function(link) {
                                ++link_counter;
                                var entity = _.without(link.entities, 'company')[0];
                                switch (entity) {
                                    case 'site':
                                        if (link.site.site_commodity.length>0) {
                                            if (_.where(companyGroup.commodities, {_id:_.last(link.site.site_commodity)._id}).length<1) {
                                                companyGroup.commodities.push({
                                                    _id: _.last(link.site.site_commodity)._id,
                                                    commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                        break;
                                    case 'project':
                                        if (link.project && link.project.proj_commodity.length>0) {
                                            if (_.where(companyGroup.commodities, {_id: _.last(link.project.proj_commodity).commodity._id}).length<1) {
                                                companyGroup.commodities.push({
                                                    _id: _.last(link.project.proj_commodity).commodity._id,
                                                    commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                        break;
                                    case 'concession':
                                        if (link.concession.concession_commodity.length>0) {
                                            if (_.where(companyGroup.commodities, {_id: _.last(link.concession.concession_commodity).commodity._id}).length<1) {
                                                companyGroup.commodities.push({
                                                    _id: _.last(link.concession.concession_commodity).commodity._id,
                                                    commodity_name: _.last(link.concession.concession_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.concession.concession_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.concession.concession_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                        break;
                                    default:
                                }
                                if(company_counter == company_len && link_counter == link_len) {
                                    callback(null, companyGroup);
                                }
                            });
                        } else {
                            if(company_counter == company_len && link_counter == link_len) {
                                callback(null, companyGroup);
                            }
                        }
                    });
            });
        } else{
            callback(null, companyGroup);
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