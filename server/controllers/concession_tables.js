var Project 		= require('mongoose').model('Project'),
    Country 		= require('mongoose').model('Country'),
    Source	 		= require('mongoose').model('Source'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    Commodity 	    = require('mongoose').model('Commodity'),
    Contract 	    = require('mongoose').model('Contract'),
    Site 	        = require('mongoose').model('Site'),
    Concession 	    = require('mongoose').model('Concession'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');


exports.getConcessionTable = function(req, res){
    var link_counter, link_len,concession_len,concession_counter,companies_len,companies_counter;
    var type = req.params.type;
    var query = '';
    var company = {};
    company.concessions = [];
    if (type == 'company') {query = {company: req.params.id, entities: "concession"}}
    if (type == 'commodity') {query = {'concession_commodity.commodity': req.params.id}}
    if (type == 'country') {query = {'concession_country.country': req.params.id}}
    if(type=='group') { query={company_group: req.params.id, entities: "company"}}
    async.waterfall([
        getLinks,
        getConcessions,
        getCountryConcessions,
        getProjectCount,
        getGroupLinkedCompanies,
        getGroupLinkedConcessions
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinks(callback) {
        if (type != 'commodity'&&type != 'group'&&type!='country') {
            Link.find(query)
                .populate('concession commodity country')
                .deepPopulate('concession.concession_commodity.commodity concession.concession_country.country ')
                .exec(function (err, links) {
                    if (links) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            company.concessions.push({
                                _id: link.concession._id,
                                concession_name: link.concession.concession_name,
                                concession_country: _.first(link.concession.concession_country).country,
                                concession_commodities: link.concession.concession_commodity,
                                concession_status: link.concession.concession_status
                            });
                            if (link_len == link_counter) {
                                company.concessions = _.uniq(company.concessions, function (a) {
                                    return a._id;
                                });
                                callback(null, company);
                            }

                        })
                    } else {
                        callback(err);
                    }
                });
        } else{
            callback(null, company);
        }

    }
    function getConcessions(company,callback) {
        if (type == 'commodity') {
            Concession.find(query)
                .populate('commodity country')
                .deepPopulate('concession_commodity.commodity concession_country.country')
                .exec(function (err, concessions) {
                    concession_len = concessions.length;
                    concession_counter = 0;
                    if(concession_len>0) {
                        _.each(concessions, function (concession) {
                            ++concession_counter;
                            company.concessions.push({
                                _id: concession._id,
                                concession_name: concession.concession_name,
                                concession_country: _.first(concession.concession_country).country,
                                concession_commodities: concession.concession_commodity,
                                concession_status: concession.concession_status,
                                projects: 0
                            });
                            if (concession_len == concession_counter) {
                                company.concessions = _.uniq(company.concessions, function (a) {
                                    return a._id;
                                });
                                callback(null, company);
                            }
                        });
                    } else{
                        callback(null, company);
                    }
                });
        } else{
            callback(null, company);
        }
    }
    function getCountryConcessions(company, callback) {
        if(type=='country') {
            concession_counter = 0;
            company.concessions = [];
            Concession.find(query)
                .populate('concession_country.country')
                .populate('concession_commodity.commodity')
                .exec(function (err, concessions) {
                    if (concessions.length > 0) {
                        concession_len = concessions.length;
                        _.each(concessions, function (concession) {
                            ++concession_counter;
                            company.concessions.push({
                                _id: concession._id,
                                concession_name: concession.concession_name,
                                concession_country: _.find(concession.concession_country.reverse()).country,
                                concession_type: _.find(concession.concession_type.reverse()),
                                concession_commodities: concession.concession_commodity,
                                concession_status: concession.concession_status,
                                projects: 0
                            });
                            if (concession_counter == concession_len) {
                                callback(null, company);
                            }

                        });
                    } else {
                        callback(null, company);
                    }
                });
        } else{
            callback(null, company);
        }
    }
    function getProjectCount(company,callback) {
        if (type == 'commodity'||type=='country') {
            concession_len =company.concessions.length;
            concession_counter=0;
            if(concession_len>0) {
                _.each(company.concessions, function (concession) {
                    Link.find({concession: concession._id, entities: 'project'})
                        .populate('project')
                        .exec(function (err, links) {
                            concession_counter++;
                            links = _.uniq(links, function (a) {
                                return a.project._id;
                            });
                            concession.projects = links.length;
                            if (concession_len == concession_counter) {
                                callback(null, company);
                            }
                        });
                })
            }else{
                callback(null, company);
            }
        }else{
            callback(null, company);
        }
    }

    function getGroupLinkedCompanies(company,callback) {
        var companies =[];
        if(type=='group') {
            Link.find(query)
                .exec(function (err, links) {
                    if (links) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            if(link.company!=undefined) {
                                companies.push({_id: link.company});
                            }
                            if (link_len == link_counter) {
                                companies = _.uniq(companies, function (a) {
                                    return a._id;
                                });
                                callback(null, companies);
                            }
                        })
                    } else {
                        callback(null, companies);
                    }
                });
        } else{
            callback(null, company);
        }
    }
    function getGroupLinkedConcessions(companies,callback) {
        if(type=='group') {
            if(companies.length>0) {
                company.concessions=[];
                companies_len = companies.length;
                companies_counter = 0;
                _.each(companies, function (c) {
                    if(c._id!=undefined){
                        query = {company: c._id, entities: "concession"};
                        Link.find(query)
                            .populate('concession commodity country')
                            .deepPopulate('concession.concession_commodity.commodity concession.concession_country.country ')
                            .exec(function (err, links) {
                                ++companies_counter;
                                if (links.length>0) {
                                    link_len = links.length;
                                    link_counter = 0;
                                    link_len = links.length;
                                    link_counter = 0;
                                    _.each(links, function (link) {
                                        ++link_counter;
                                        company.concessions.push({
                                            _id: link.concession._id,
                                            concession_name: link.concession.concession_name,
                                            concession_country: _.first(link.concession.concession_country).country,
                                            concession_commodities: link.concession.concession_commodity,
                                            concession_status: link.concession.concession_status
                                        });
                                        if (link_len == link_counter) {
                                            company.concessions = _.uniq(company.concessions, function (a) {
                                                return a._id;
                                            });
                                            callback(null, company);
                                        }
                                    })
                                } else {
                                    callback(null, company);
                                }
                            });
                    }
                })
            } else{
                callback(null, company);
            }
        } else{
            callback(null, company);
        }
    }
};