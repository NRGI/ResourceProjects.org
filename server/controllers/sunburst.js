var Source	 		= require('mongoose').model('Source'),
    Transfer 	    = require('mongoose').model('Transfer'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getPayments = function(req, res) {
    var sunburst_new = [],count=[], counter = 0,sunburst=[], payments_filter={};
    var company = req.query.company;
    if(company){
        req.query.company=company;
    }else {
        req.query.company = {$exists: true, $nin: [null]};
    }
    req.query.transfer_level={ $nin: [ 'country' ] };
    req.query.project={ $exists: true, $nin: [ null ]};
    async.waterfall([
        getAllPayment,
        getPayment
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
    function getAllPayment(callback) {
        Transfer.find({'transfer_level':{ $nin: [ 'country' ] },'company':{ $exists: true,$nin: [ null ]}})
            .populate('country company')
            .exec(function (err, transfers) {
                payments_filter.year_selector=_.countBy(transfers, "transfer_year");
                payments_filter.currency_selector=_.countBy(transfers, "transfer_unit");
                payments_filter.type_selector=_.countBy(transfers, "transfer_type");
                payments_filter.company_selector=_.groupBy(transfers, function (doc) {return doc.company._id;});
                callback(null, payments_filter);
            })
    }
    function getPayment(payments_filter,callback) {
        Transfer.find(req.query)
            .populate('country', '_id iso2 name')
            .populate('company', ' _id company_name')
            .populate('project', ' _id proj_name proj_id')
            .populate('site', ' _id site_name field')
            .populate('source', '_id source_name source_url source_date source_type_id')
            .exec(function (err, transfers) {
                var transfers_counter = 0;
                var proj_site = {}, project_transfers = [];
                var transfers_len = transfers.length;
                if (transfers_len > 0) {
                    transfers.forEach(function (transfer) {
                        proj_site = {};
                        if (transfer.project != undefined) {
                            proj_site = {
                                name: transfer.project.proj_name,
                                _id: transfer.project.proj_id,
                                type: 'project'
                            }
                        }
                        if (transfer.site != undefined) {
                            if (transfer.site.field) {
                                proj_site = {name: transfer.site.site_name, _id: transfer.site._id, type: 'field'}
                            }
                            if (!transfer.site.field) {
                                proj_site = {name: transfer.site.site_name, _id: transfer.site._id, type: 'site'}
                            }
                        }
                        ++transfers_counter;
                        if (!project_transfers.hasOwnProperty(transfer._id)) {
                            if (transfer.transfer_level != 'country') {
                                project_transfers.push({
                                    _id: transfer._id,
                                    transfer_year: transfer.transfer_year,
                                    country: {
                                        name: transfer.country.name,
                                        iso2: transfer.country.iso2
                                    },
                                    transfer_type: transfer.transfer_type,
                                    transfer_unit: transfer.transfer_unit,
                                    transfer_value: transfer.transfer_value,
                                    transfer_level: transfer.transfer_level,
                                    transfer_gov_entity: transfer.transfer_gov_entity,
                                    source: transfer.source,
                                    proj_site: proj_site
                                });
                            }
                        }
                        if (transfer.company && transfer.company != undefined && _.last(project_transfers)) {
                            _.last(project_transfers).company = {
                                _id: transfer.company._id,
                                company_name: transfer.company.company_name
                            };
                        }
                        if (transfers_counter === transfers_len) {
                            project_transfers = _.map(_.groupBy(project_transfers, function (doc) {
                                return doc._id;
                            }), function (grouped) {
                                return grouped[0];
                            });
                            transfers = project_transfers;

                            var value = 0;
                            var groups;
                            var transfers_value = 0;
                            var currency_value=[];
                            _.map(_.groupBy(transfers, function (doc) {
                                return doc.transfer_unit;
                            }), function (grouped) {
                                value=0;
                                transfers_value=0;
                                _.each(grouped, function (group) {
                                    value = value + parseInt(group.transfer_value)
                                })
                                if (value > 0) {
                                    transfers_value = (value / 1000000).toFixed(1)
                                }
                                currency_value.push({
                                    currency:grouped[0].transfer_unit,
                                    total_value:transfers_value
                                });
                                return currency_value;
                            });
                            _.each(transfers, function (transfer) {
                                value = value + transfer.transfer_value
                            })
                            if (value > 0) {
                                transfers_value = (value / 1000000).toFixed(1)
                            }
                            sunburst_new.push({
                                name: '<b>Payment to</b><br>Payments<br>' + transfers_value + ' Million',
                                children: [],
                                size: parseInt(value),
                                total_value: transfers_value
                            });
                            if (transfers.length) {
                                _.map(_.groupBy(transfers, function (doc) {
                                    return doc.country.iso2;
                                }), function (grouped) {
                                    value = 0;
                                    transfers_value = 0;

                                    groups = _.map(_.groupBy(grouped, function (doc) {
                                        if (doc.project != undefined) {
                                            return doc.project._id;
                                        }
                                    }), function (grouped_) {
                                        return grouped_[0];
                                    });
                                    _.each(groups, function (group) {
                                        value = value + parseInt(group.transfer_value)
                                    })
                                    if (value > 0) {
                                        transfers_value = (value / 1000000).toFixed(1)
                                    }
                                    sunburst_new[0].children.push({
                                        name: '<b>Payment to</b><br>' + grouped[0].country.name + '<br>' + transfers_value + ' Million',
                                        children: [],
                                        size: parseInt(value)
                                    });
                                    _.each(groups, function (transfer, key) {
                                        if (transfer.proj_site != undefined) {
                                            transfers_value = (transfer.transfer_value / 1000000).toFixed(1)
                                            sunburst_new[0].children[counter].children.push({
                                                name: '<b>Payment to</b><br>' + transfer.proj_site.name + '<br>' + transfers_value + ' Million',
                                                'size': parseInt(transfer.transfer_value)
                                            })
                                        }
                                    })
                                    ++counter;
                                    return sunburst_new;
                                });
                                sunburst = sunburst_new;

                                callback(null, {
                                    data: sunburst,
                                    total: currency_value,
                                    filters: payments_filter,
                                    transfers: transfers
                                })
                            } else {
                                callback(null, {data: '', total: '', filters: payments_filter, transfers: ''})
                            }
                        }
                    });
                } else {
                    callback(null, {data: '', total: '', filters: payments_filter, transfers: ''})

                }
            });
    }
};
exports.getPaymentsByGov = function(req, res) {
    var sunburst_new = [],count=[], counter = 0,sunburst=[], payments_filter={};
    var company = req.query.company;
    if(company){
        req.query.company=company;
    }else {
        req.query.company = {$exists: true, $nin: [null]};
    }
    req.query.transfer_level= 'country';
    req.query.transfer_gov_entity={ $exists: true, $nin: [ null ]};
    async.waterfall([
        getAllPayment,
        getPayment
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
    function getAllPayment(callback) {
        Transfer.find({'transfer_level':'country','company':{ $exists: true,$nin: [ null ]}})
            .populate('country company')
            .exec(function (err, transfers) {
                payments_filter.year_selector=_.countBy(transfers, "transfer_year");
                payments_filter.currency_selector=_.countBy(transfers, "transfer_unit");
                payments_filter.type_selector=_.countBy(transfers, "transfer_type");
                payments_filter.company_selector=_.groupBy(transfers, function (doc) {return doc.company._id;});
                callback(null, payments_filter);
            })
    }
    function getPayment(payments_filter,callback) {
        Transfer.find(req.query)
            .populate('country', '_id iso2 name')
            .populate('company', ' _id company_name')
            .populate('project', ' _id proj_name proj_id')
            .populate('site', ' _id site_name field')
            .populate('source', '_id source_name source_url source_date source_type_id')
            .exec(function (err, transfers) {
                var transfers_counter = 0;
                var proj_site = {}, project_transfers = [];
                var transfers_len = transfers.length;
                if (transfers_len > 0) {
                    transfers.forEach(function (transfer) {
                        proj_site = {};
                        if (transfer.project != undefined) {
                            proj_site = {
                                name: transfer.project.proj_name,
                                _id: transfer.project.proj_id,
                                type: 'project'
                            }
                        }
                        if (transfer.site != undefined) {
                            if (transfer.site.field) {
                                proj_site = {name: transfer.site.site_name, _id: transfer.site._id, type: 'field'}
                            }
                            if (!transfer.site.field) {
                                proj_site = {name: transfer.site.site_name, _id: transfer.site._id, type: 'site'}
                            }
                        }
                        ++transfers_counter;
                        if (!project_transfers.hasOwnProperty(transfer._id)) {
                            if (transfer.transfer_level == 'country') {
                                project_transfers.push({
                                    _id: transfer._id,
                                    transfer_year: transfer.transfer_year,
                                    country: {
                                        name: transfer.country.name,
                                        iso2: transfer.country.iso2
                                    },
                                    transfer_type: transfer.transfer_type,
                                    transfer_unit: transfer.transfer_unit,
                                    transfer_value: transfer.transfer_value,
                                    transfer_level: transfer.transfer_level,
                                    transfer_gov_entity: transfer.transfer_gov_entity,
                                    source: transfer.source,
                                    proj_site: proj_site
                                });
                            }
                        }
                        if (transfer.company && transfer.company != undefined && _.last(project_transfers)) {
                            _.last(project_transfers).company = {
                                _id: transfer.company._id,
                                company_name: transfer.company.company_name
                            };
                        }
                        if (transfers_counter === transfers_len) {
                            project_transfers = _.map(_.groupBy(project_transfers, function (doc) {
                                return doc._id;
                            }), function (grouped) {
                                return grouped[0];
                            });
                            transfers = project_transfers;
                            var value = 0;
                            var groups;
                            var transfers_value = 0;
                            var currency_value=[];
                            _.map(_.groupBy(transfers, function (doc) {
                                return doc.transfer_unit;
                            }), function (grouped) {
                                value=0;
                                transfers_value=0;
                                _.each(grouped, function (group) {
                                    value = value + parseInt(group.transfer_value)
                                })
                                if (value > 0) {
                                    transfers_value = (value / 1000000).toFixed(1)
                                }
                                currency_value.push({
                                    currency:grouped[0].transfer_unit,
                                    total_value:transfers_value
                                });
                                return currency_value;
                            });

                            value = 0;
                            transfers_value=0;
                            _.each(transfers, function (transfer) {
                                value = value + parseInt(transfer.transfer_value)
                            })
                            if (value > 0) {
                                transfers_value = (value / 1000000).toFixed(1)
                            }
                            sunburst_new.push({
                                name: '<b>Payment to</b><br>Payments<br>' + transfers_value + ' Million',
                                children: [],
                                size: parseInt(value),
                                total_value: transfers_value
                            });
                            if (transfers.length) {
                                _.map(_.groupBy(transfers, function (doc) {
                                    return doc.country.iso2;
                                }), function (grouped) {
                                    value = 0;
                                    transfers_value = 0;
                                    groups = _.map(_.groupBy(grouped, function (doc) {
                                        return doc.transfer_gov_entity;
                                    }), function (grouped_) {
                                        return grouped_[0];
                                    });
                                    _.each(groups, function (group) {
                                        value = value + group.transfer_value
                                    })
                                    if (value > 0) {
                                        transfers_value = (value / 1000000).toFixed(1)
                                    }
                                    sunburst_new[0].children.push({
                                        name: '<b>Payment to</b><br>' + grouped[0].country.name + '<br>' + transfers_value + ' Million',
                                        children: [],
                                        size: parseInt(value)
                                    });
                                    _.each(groups, function (transfer, key) {
                                        transfers_value = (transfer.transfer_value / 1000000).toFixed(1)
                                        sunburst_new[0].children[counter].children.push({
                                            name: '<b>Payment to</b><br>' + transfer.transfer_gov_entity + '<br>' + transfers_value + ' Million',
                                            'size': parseInt(transfer.transfer_value)
                                        })
                                    })
                                    ++counter;
                                    return sunburst_new;
                                });
                                sunburst = sunburst_new;
                                callback(null, {
                                    data: sunburst,
                                    total: currency_value,
                                    filters: payments_filter,
                                    transfers: transfers
                                })
                            }
                        }
                    })
                } else {
                    callback(null, {data: '', total: '', filters: payments_filter, transfers: ''})

                }
            });
    }
};