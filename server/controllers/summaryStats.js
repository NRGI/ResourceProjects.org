var Project 		= require('mongoose').model('Project'),
    Country 		= require('mongoose').model('Country'),
    Source	 		= require('mongoose').model('Source'),
    Link 	        = require('mongoose').model('Link'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getSummaryStats = function(req, res) {
    var project_len, project_counter,link_len,link_counter,source_types=[],source_type;
    var none, context, payment, verified;
    async.waterfall([
        getProjectSet,
        getVerified
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
    function getProjectSet(callback) {
        Project.find({})
            .deepPopulate('proj_established_source.source_type_id')
            .exec(function (err, projects) {
                project_counter=0;
                project_len = projects.length;
                if (project_len > 0) {
                    projects.forEach(function (project) {
                        Link.find({project: project._id})
                            .deepPopulate('source.source_type_id')
                            .exec(function (err, links) {
                                ++project_counter;
                                source_types[project_counter-1] = {p: false, c: false};
                                if (project.proj_established_source != null) {
                                    if (project.proj_established_source.source_type_id.source_type_authority === 'authoritative') {
                                        source_types[project_counter-1].c = true;
                                    } else if (project.proj_established_source.source_type_id.source_type_authority === 'non-authoritative') {
                                        source_types[project_counter-1].c = true;
                                    } else if (project.proj_established_source.source_type_id.source_type_authority === 'disclosure') {
                                        source_types[project_counter-1].p = true;
                                    }
                                }
                                link_len = links.length;
                                link_counter = 0;
                                if(links.length>0) {
                                    links.forEach(function (link) {
                                        ++link_counter;
                                        if (!source_types[project_counter-1].p || !source_types[project_counter-1].c) {
                                            if (link.source != null) {
                                                if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                                    source_types[project_counter-1].c = true;
                                                } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                                    source_types[project_counter-1].c = true;
                                                } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                                    source_types[project_counter-1].p = true;
                                                }
                                            }
                                        }
                                        if (project_counter == project_len && link_counter == link_len) {
                                            callback(null, source_types);
                                        }
                                    });
                                }

                            });
                    });
                } else {
                    callback(null, {data: projects});
                }
            });
    }
    function getVerified (source_types, callback) {
        project_len = source_types.length;
        project_counter = 0;
        none = 0,context = 0,payment = 0, verified =0;
        _.each(source_types, function(source_type) {
            ++project_counter;
            if (!source_type.c && !source_type.p) {
                ++none;
            } else if (source_type.c && !source_type.p) {
                ++context;
            } else if (!source_type.c && source_type.p) {
                ++payment;
            } else if (source_type.c && source_type.p) {
                ++verified;
            }
            if (project_counter === project_len) {
                callback(null, {source_type:source_types,none: none,context:context,payment:payment,verified:verified});
            }
        });
    }
};
exports.getSumOfPayments = function(req, res) {
    var transfers_len, transfer_counter,usd,bbl,gbp;
    async.waterfall([
        getPayments
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
    function getPayments(callback) {
        transfer_counter = 0;usd=0;bbl=0;gbp=0;
        Transfer.find({})
            .exec(function (err, transfers) {
                transfers_len = transfers.length;
                if(transfers_len>0) {
                    transfers.forEach(function (transfer) {
                        ++transfer_counter;
                        if(transfer.transfer_unit=="USD"){
                            usd+=transfer.transfer_value;
                        }
                        if(transfer.transfer_unit=="BBL"){
                            bbl+=transfer.transfer_value;
                        }
                        if(transfer.transfer_unit=="GBP"){
                            gbp+=transfer.transfer_value;
                        }
                        if(transfer_counter == transfers_len){
                            callback(null, {usd:usd,gbp:gbp,bbl:bbl})
                        }
                    });
                }
            });
    }
};