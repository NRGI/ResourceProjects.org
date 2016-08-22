var Company 		= require('mongoose').model('Company'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production      = require('mongoose').model('Production'),
    Commodity 	    = require('mongoose').model('Commodity'),
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
        getTransfersCount
    ], function (err, result) {
        if (err) {
            res.send(err);
        }else{
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });

    function companyCount(callback) {
        Company.find({}).count().exec(function(err, company_count) {
            if(company_count) {
                callback(null, company_count);
            } else {
                return res.send(err);
            }
        });
    }
    function getCompanySet(company_count, callback) {
        Company.find({})
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
                    return res.send(err);
                }
            });
    }
    function getCompanyLinks(company_count, companies, callback) {
        company_len = companies.length;
        company_counter = 0;
        if (company_len>0) {
            companies.forEach(function (company) {
                Link.find({company: company._id})
                    .populate('company_group','_id company_group_name')
                    .populate('project site')
                    .deepPopulate('site.site_commodity.commodity project.proj_commodity.commodity')
                    .exec(function(err, links) {
                        ++company_counter;
                        link_len = links.length;
                        link_counter = 0;
                        if(link_len>0) {
                            var projects = [];
                            company.company_groups = [];
                            company.company_commodity = [];
                            company.transfers_query = [company._id];
                            company.project_count = 0;
                            company.site_count = 0;
                            company.concession_count = 0;
                            company.contract_count = 0;
                            company.field_count = 0;
                            links.forEach(function(link) {
                                ++link_counter;

                                var entity = _.without(link.entities, 'company')[0]
                                switch (entity) {
                                    case 'company_group':
                                        company.company_groups.push({
                                            _id: link.company_group._id,
                                            company_group_name: link.company_group.company_group_name
                                        });
                                        break;
                                    case 'project':
                                        projects.push(link.project);
                                        projects = _.map(_.groupBy(projects,function(doc){
                                            return doc._id;
                                        }),function(grouped){
                                            return grouped[0];
                                        });
                                        company.project_count = projects.length;

                                        if(link.project!=null){
                                        if (link.project.proj_commodity.length>0) {
                                            if (_.where(company.company_commodity, {_id:_.last(link.project.proj_commodity)._id}).length<1) {
                                                company.company_commodity.push({
                                                    _id: _.last(link.project.proj_commodity).commodity._id,
                                                    commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                        if (!_.contains(company.transfers_query, link.project)) {
                                            company.transfers_query.push(link.project._id);
                                        }}
                                        break;
                                    case 'site':
                                        if (link.site.site_commodity.length>0) {
                                            if (_.where(company.company_commodity, {_id:_.last(link.site.site_commodity)._id}).length<1) {
                                                company.company_commodity.push({
                                                    _id: _.last(link.site.site_commodity)._id,
                                                    commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                        if (!_.contains(company.transfers_query, link.site._id)) {
                                            company.transfers_query.push(link.site._id);
                                        }
                                        if (link.site.field) {
                                            company.field_count += 1;
                                        } else {
                                            company.site_count += 1;
                                        }
                                        break;
                                    case 'concession':
                                        company.concession_count += 1;
                                        break;
                                    case 'contract':
                                        company.contract_count += 1;
                                        break;
                                    default:
                                        console.log(entity, 'link skipped...');
                                }

                            });
                            if(company_counter == company_len && link_counter == link_len) {
                                callback(null, company_count, companies);
                            }
                        } else {
                            if(company_counter == company_len && link_counter == link_len) {
                                callback(null, company_count, companies);
                            }
                        }
                    });
            });
        } else {
            callback(null, company_count, companies);
        }
    }
    function getTransfersCount(company_count, companies, callback) {
        company_len = companies.length;
        company_counter = 0;
        if (company_len>0) {
            _.each(companies, function (company) {
                Transfer.find({company: {$in: company.transfers_query}})
                    .count()
                    .exec(function (err, transfer_count) {
                        ++company_counter;
                        company.transfer_count = transfer_count;
                        if (company_counter === company_len) {
                            callback(null, {data: companies, count: company_count});
                        }
                    });

            });
        } else {
            callback(null, company_count, companies);
        }
    }
};

exports.getCompanyID = function(req, res) {

    async.waterfall([
        getCompany
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
};

exports.getCompanyByID = function(req, res) {
    var company={},link_counter, link_len;

    async.waterfall([
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
    function getCompanyLinks(callback) {
        company.company_groups = [];
        company.company_commodity = [];
        Link.find({company: req.params.id})
            .populate('company_group', '_id company_group_name')
            .populate('commodity concession')
            .deepPopulate('project.proj_country.country project.proj_commodity.commodity site.site_commodity.commodity site.site_country.country concession.concession_country.country concession.concession_commodity.commodity')
            .exec(function (err, links) {
                link_len = links.length;
                link_counter = 0;
                if (link_len > 0) {
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'company')[0];
                        switch (entity) {
                            case 'site':
                                if (link.site.site_commodity.length > 0) {
                                    if (_.where(company.company_commodity, {_id: _.last(link.site.site_commodity)._id}).length < 1) {
                                        company.company_commodity.push({
                                            _id: _.last(link.site.site_commodity)._id,
                                            commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                        });
                                    }
                                }
                                break;
                            case 'project':
                                if (link.project && link.project.proj_commodity.length > 0) {
                                    if (_.where(company.company_commodity, {_id: _.last(link.project.proj_commodity).commodity._id}).length < 1) {
                                        company.company_commodity.push({
                                            _id: _.last(link.project.proj_commodity).commodity._id,
                                            commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                        });
                                    }
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
                                if (link.concession.concession_commodity.length > 0) {
                                    if (_.where(company.company_commodity, {_id: _.last(link.concession.concession_commodity).commodity._id}).length < 1) {
                                        company.company_commodity.push({
                                            _id: _.last(link.concession.concession_commodity).commodity._id,
                                            commodity_name: _.last(link.concession.concession_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.concession.concession_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.concession.concession_commodity).commodity.commodity_id
                                        });
                                    }

                                }
                                break;
                            default:
                                console.log(entity, 'link skipped...');
                        }
                        if (link_counter == link_len) {
                            callback(null, company);
                        }
                    });
                } else {
                    callback(null, company);
                }
            });
    }
}

exports.createCompany = function(req, res, next) {
    var companyData = req.body;
    Company.create(companyData, function(err, company) {
        if(err){
            res.status(400);
            err = new Error('Error');
            return res.send({reason:err.toString()})
        } else {
            res.send();
        }
    });
};

exports.updateCompany = function(req, res) {
    var companyUpdates = req.body;
    Company.findOne({_id:req.body._id}).exec(function(err, company) {
        if(err) {
            res.status(400);
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
        company.company_name= companyUpdates.company_name;
        company.company_aliases= companyUpdates.company_aliases;
        company.company_established_source= companyUpdates.company_established_source;
        company.country_of_incorporation= companyUpdates.country_of_incorporation;
        company.countries_of_operation= companyUpdates.countries_of_operation;
        company.description= companyUpdates.description;
        company.save(function(err) {
            if(err) {
                err = new Error('Error');
                return res.send({reason: err.toString()});
            } else {
                res.send();
            }
        })
    });
};

exports.deleteCompany = function(req, res) {
    Company.remove({_id: req.params.id}, function(err) {
        if(!err) {
            res.send();
        } else{
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
    });
};