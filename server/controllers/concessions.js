var Concession 		= require('mongoose').model('Concession'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Production 	    = require('mongoose').model('Production'),
    Link            = require('mongoose').model('Link'),
    async           = require('async'),
    _               = require("underscore");

exports.getConcessions = function(req, res) {
    var concession_len, link_len, concession_counter, link_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        concessionCount,
        getConcessionSet,
        getConcessionLinks,
        getTransfersCount,
        getProductionCount
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
            .skip(skip)
            .limit(limit)
            .populate('concession_country.country', '_id iso2 name')
            .populate('concession_commodity.commodity', ' _id commodity_name commodity_type commodity_id')
            .populate('concession_established_source')
            .lean()
            .exec(function(err, concessions) {
                if(concessions) {
                    //TODO clean up returned data if we see performance lags
                    callback(null, concession_count, concessions);
                } else {
                    res.send({data: concessions, count: concession_count});
                }
            });
    }
    function getConcessionLinks(concession_count, concessions, callback) {
        concession_len = concessions.length;
        concession_counter = 0;
        if(concession_len>0) {
            concessions.forEach(function (concession) {
                concession.transfers_query = [concession._id];
                concession.source_type = {p: false, c: false};
                Link.find({concession: concession._id})
                    .populate('commodity', '_id commodity_name commodity_type commodity_id')
                    .populate('company site project')
                    .deepPopulate('source.source_type_id site.site_commodity.commodity project.proj_commodity.commodity')
                    .exec(function (err, links) {
                        ++concession_counter;
                        link_len = links.length;
                        link_counter = 0;
                        if(link_len>0) {
                            concession.project_count = 0;
                            concession.company_count = 0;
                            concession.site_count = 0;
                            concession.field_count  = 0;
                            concession.contract_count = 0;
                            links.forEach(function (link) {
                                ++link_counter;
                                var entity = _.without(link.entities, 'concession')[0];
                                if (!concession.source_type.p || !concession.source_type.c) {
                                    if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                        concession.source_type.c = true;
                                    } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                        concession.source_type.c = true;
                                    } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                        concession.source_type.p = true;
                                    }
                                }
                                switch (entity) {
                                    case 'company':
                                        concession.company_count += 1;
                                        break;
                                    case 'contract':
                                        concession.contract_count += 1;
                                        break;
                                    case 'project':
                                        if (link.project.proj_commodity.length>0) {
                                            if (_.where(concession.concession_commodity, {_id:_.last(link.project.proj_commodity)._id}).length<1) {
                                                concession.concession_commodity.push({
                                                    _id: _.last(link.project.proj_commodity).commodity._id,
                                                    commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                        if (!_.contains(concession.transfers_query, link.project)) {
                                            concession.transfers_query.push(link.project);
                                        }
                                        concession.project_count += 1;
                                        break;
                                    case 'site':
                                        if (link.site.site_commodity.length>0) {
                                            if (_.where(concession.concession_commodity, {_id:_.last(link.site.site_commodity)._id}).length<1) {
                                                concession.concession_commodity.push({
                                                    _id: _.last(link.project.proj_commodity).commodity._id,
                                                    commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                                    commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                                    commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                                });
                                            }
                                        }
                                        if (!_.contains(concession.transfers_query, link.project)) {
                                            concession.transfers_query.push(link.project);
                                        }
                                        if (link.site.field) {

                                            concession.site_count += 1;
                                        } else if (!link.site.field) {
                                            concession.field_count += 1;
                                        }
                                        break;
                                    default:
                                        console.log(entity, 'skipped...');
                                }
                            });
                            if (concession_counter == concession_len && link_counter == link_len) {
                                callback(null, concession_count, concessions);
                            }
                        } else {
                            if (concession_counter == concession_len && link_counter == link_len) {
                                callback(null, concession_count, concessions);
                            }
                        }

                    });
            });
        } else{
            callback(null, concession_count, concessions);
        }
    }
    function getTransfersCount(concession_count, concessions, callback) {
        concession_len = concessions.length;
        concession_counter = 0;
        _.each(concessions, function(concession) {
            Transfer.find({$or: [
                {project:{$in: concession.transfers_query}},
                {site:{$in: concession.transfers_query}},
                {concession:{$in: concession.transfers_query}}]})
                .count()
                .exec(function (err, transfer_count) {
                    ++concession_counter;
                    concession.transfer_count = transfer_count;
                    if (concession_counter === concession_len) {
                        callback(null, concession_count, concessions);
                    }
                });

        });
    }
    function getProductionCount(concession_count, concessions, callback) {
        concession_len = concessions.length;
        concession_counter = 0;
        _.each(concessions, function(concession) {
            Production.find({$or: [
                {project:{$in: concession.transfers_query}},
                {site:{$in: concession.transfers_query}},
                {concession:{$in: concession.transfers_query}}]})
                .count()
                .exec(function (err, production_count) {
                    ++concession_counter;
                    concession.production_count = production_count;
                    if (concession_counter === concession_len) {
                        res.send({data: concessions, count: concession_count});
                    }
                });

        });
    }
};

exports.getConcessionByID = function(req, res) {
    var link_counter, link_len,concession_counter, concession_len, proj_counter, proj_len, site_counter, site_len, transfers_counter, transfers_len;

    async.waterfall([
        getConcession,
        getConcessionLinks,
        //TODO finish deeply linked projects and sites
        // getLinkedProjects,
        // getLinkedSites,
        getTransfers,
        getProduction,
        getCompanyGroup,
        getProjectCoordinate
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
            .deepPopulate('concession_company_share.company')
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
        concession.companies = [];
        concession.projects = [];
        concession.contracts = [];
        concession.sites = [];
        concession.transfers_query = [concession._id];
        concession.source_type = {p: false, c: false};
        concession.site_coordinates = {sites: [], fields: []};
        concession.sources = {};
        Link.find({concession: concession._id})
            .populate('contract company')
            .deepPopulate('project.proj_country.country project.proj_commodity.commodity site.site_commodity.commodity source.source_type_id')
            .exec(function(err, links) {
                link_len = links.length;
                link_counter = 0;
                if(link_len>0) {
                    links.forEach(function (link) {
                        ++link_counter;
                        var entity = _.without(link.entities, 'concession')[0];
                        if (!concession.source_type.p || !concession.source_type.c) {
                            if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                concession.source_type.c = true;
                            } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                concession.source_type.c = true;
                            } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                concession.source_type.p = true;
                            }
                        }
                        if(link.source!=undefined) {
                            if (!concession.sources[link.source._id]) {
                                //TODO clean up returned data if performance lags
                                concession.sources[link.source._id] = link.source;
                            }
                        }
                        switch (entity) {
                            case 'company':
                                if (!concession.companies.hasOwnProperty(link.company._id)) {
                                    concession.companies.push({
                                        _id: link.company._id,
                                        company_name: link.company.company_name
                                    });
                                    //TODO deal with shares and operation
                                    // concession.concession_operated_by.forEach(function(operator) {
                                    //     console.log(_.last(operator));
                                    //     var index = concession.companies.findIndex(x => x._id==String(_.last(operator)));
                                    //     console.log(index);
                                    // });
                                    // var index = concession.companies.findIndex(x => x._id==String(_.last(_.last(concession.concession_operated_by)).company));
                                    // if (index > -1) {
                                    //     concession.companies[index].operating = _.last(_.last(concession.concession_operated_by)).timestamp;
                                    // }
                                    // console.log(index);
                                    // console.log(concession.companies);
                                    // console.log(concession.companies);
                                    // // console.log(_.findWhere(concession.companies, {_id: _.last(_.last(concession.concession_operated_by).company)._id}));
                                    // console.log(_.findWhere(concession.companies, {company_name: 'Chevron'}));

                                    // console.log(_.last(_.last(concession.concession_operated_by).company)._id);
                                    // console.log(concession.concession_company_share);
                                }
                                break;
                            case 'contract':
                                if (!_.contains(concession.contracts, link.contract.contract_id)) {
                                    concession.contracts.push(link.contract);
                                }
                                break;
                            case 'project':
                                concession.transfers_query.push(link.project._id);
                                concession.projects.push({
                                    _id: link.project._id,
                                    proj_name: link.project.proj_name,
                                    proj_id: link.project.proj_id,
                                    proj_commodity: link.project.proj_commodity,
                                    proj_status: link.project.proj_status,
                                    proj_coordinates: link.project.proj_coordinates
                                });
                                if (link.project.proj_commodity.length>0) {
                                    if (_.where(concession.concession_commodity, {_id:_.last(link.project.proj_commodity).commodity._id}).length<1) {
                                        concession.concession_commodity.push({
                                            _id: _.last(link.project.proj_commodity).commodity._id,
                                            commodity_name: _.last(link.project.proj_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.project.proj_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.project.proj_commodity).commodity.commodity_id
                                        });
                                    }
                                }
                                break;
                            case 'site':
                                concession.transfers_query.push(link.site._id);
                                concession.sites.push({
                                    _id: link.site._id,
                                    field: link.site.field,
                                    site_name: link.site.site_name,
                                    site_status: link.site.site_status
                                });
                                if (link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        concession.site_coordinates.fields.push({
                                            'lat': loc.loc[0],
                                            'lng': loc.loc[1],
                                            'message': link.site.site_name,
                                            'timestamp': loc.timestamp,
                                            'type': 'field',
                                            'id': link.site._id
                                        });
                                    });
                                } else if (!link.site.field && link.site.site_coordinates.length>0) {
                                    link.site.site_coordinates.forEach(function (loc) {
                                        concession.site_coordinates.sites.push({
                                            'lat': loc.loc[0],
                                            'lng': loc.loc[1],
                                            'message': link.site.site_name,
                                            'timestamp': loc.timestamp,
                                            'type': 'site',
                                            'id': link.site._id
                                        });
                                    });
                                }
                                if (link.site.site_commodity.length>0) {
                                    if (_.where(concession.concession_commodity, {_id:_.last(link.site.site_commodity).commodity._id}).length<1) {
                                        concession.concession_commodity.push({
                                            _id: _.last(link.project.site_commodity).commodity._id,
                                            commodity_name: _.last(link.site.site_commodity).commodity.commodity_name,
                                            commodity_type: _.last(link.site.site_commodity).commodity.commodity_type,
                                            commodity_id: _.last(link.site.site_commodity).commodity.commodity_id
                                        });
                                    }
                                }
                                break;
                            default:
                                console.log(entity, 'link skipped...');
                        }
                        if (link_counter == link_len) {
                            callback(null, concession);
                        }
                    });
                } else{
                    callback(null, concession);
                }
            });
    }
    function getLinkedProjects(concession, callback) {
        Link.find({$and: [
                {$or: [{project:{$in: concession.transfers_query}},{site:{$in: concession.transfers_query}}]},
                {$or: [{entities:'project'},{entities:'site'}]}
            ]})
            .deepPopulate('site.site_country.country site.site_commodity.commodity project.proj_country.country project.proj_commodity.commodity source.source_type_id')
            .exec(function (err, links) {
                link_len = links.length;
                link_counter = 0;
                if (link_len>0) {
                    links.forEach(function (link) {
                        ++link_counter;
                        // var entity = _.without(link.entities, 'concession')[0];
                        if (!concession.source_type.p || !concession.source_type.c) {
                            if (link.source.source_type_id.source_type_authority === 'authoritative') {
                                concession.source_type.c = true;
                            } else if (link.source.source_type_id.source_type_authority === 'non-authoritative') {
                                concession.source_type.c = true;
                            } else if (link.source.source_type_id.source_type_authority === 'disclosure') {
                                concession.source_type.p = true;
                            }
                        }
                        if (!concession.sources[link.source._id]) {
                            concession.sources[link.source._id] = link.source;
                        }
                        console.log(link.entities);
                        switch (link.entities) {
                            case 'project':
                                concession.projects.push({
                                    _id: link.project._id,
                                    proj_name: link.project.proj_name,
                                    proj_id: link.project.proj_id,
                                    proj_commodity: link.project.proj_commodity,
                                    proj_status: link.project.proj_status,
                                    proj_coordinates: link.project.proj_coordinates
                                });
                                break;
                        }
                    });
                } else {
                    callback(null, concession);
                    // res.send(concession);
                }

            });
        // site_len = concession.sites.length;
        // site_counter = 0;
        // if(site_len>0) {
        //     Link.find({$and: [
        //             {$or: [{project:{$in: project.transfers_query}},{site:{$in: project.transfers_query}}]},
        //             {$or: [{entities:'project'},{entities:'site'}]}
        //         ]})
        //         .deepPopulate('site.site_country.country site.site_commodity.commodity project.proj_country.country project.proj_commodity.commodity source.source_type_id')
        //         .exec(function (err, links) {
        //
        //         });
        //     // concession.sites.forEach(function (site) {
        //     //     Transfer.find(
        //     //         {$or: [{project:{$in: project.transfers_query}},{site:{$in: project.transfers_query}}]}
        //     //     )
        //     //     Link.find({site: site._id, $or[{entities:'project'},{entities:'site'}]})
        //     //         .populate('project')
        //     //         .deepPopulate('project.proj_country.country project.proj_commodity.commodity source.source_type_id')
        //     //         .exec(function (err, links) {
        //     //             ++site_counter;
        //                 link_len = links.length;
        //                 link_counter = 0;
        //     //             if (link_len>0) {
        //     //                 links.forEach(function (link) {
        //                         if (!concession.sources[link.source._id]) {
        //                             concession.sources[link.source._id] = link.source;
        //                         }
        //     //                     ++link_counter;
        //     //                     var entity = _.without(link.entities, 'site')[0];
        //     //                     switch (entity) {
        //                             case 'project':
        //                                 concession.projects.push({
        //                                     _id: link.project._id,
        //                                     proj_name: link.project.proj_name,
        //                                     proj_id: link.project.proj_id,
        //                                     proj_commodity: link.project.proj_commodity,
        //                                     proj_status: link.project.proj_status,
        //                                     proj_coordinates: link.project.proj_coordinates
        //                                 });
        //                                 break;
        //     //                         default:
        //     //                             console.log(entity, 'link skipped...');
        //     //                     }
        //     //                 });
        //     //                 if (site_counter == site_len && link_counter == link_len) {
        //     //                     // callback(null, concession);
        //     //                     res.send(concession);
        //     //                 }
        //     //             } else {
        //     //                 if (site_counter == site_len && link_counter == link_len) {
        //     //                     // callback(null, concession);
        //     //                     res.send(concession);
        //     //                 }
        //     //             }
        //     //         });
        //     // });
        // } else {
        //     // callback(null, concession);
        //     res.send(concession);
        // }
    }
    function getLinkedSites(concession, callback) {
        proj_len = concession.projects.length;
        proj_counter = 0;
        if(proj_len>0) {
            callback(null, concession);
            concession.projects.forEach(function (project) {
                Link.find({project: project._id, entities:'site'})
                    .populate('site')
                    .deepPopulate('site.site_country.country site.site_commodity.commodity source.source_type_id')
                    .exec(function (err, links) {
                        ++proj_counter;
                        link_len = links.length;
                        link_counter = 0;
                        if (link_len>0) {
                            links.forEach(function (link) {
                                if (!concession.sources[link.source._id]) {
                                    concession.sources[link.source._id] = link.source;
                                }
                                ++link_counter;
                                var entity = _.without(link.entities, 'site')[0];
                                switch (entity) {
                                    case 'project':
                                        concession.projects.push({
                                            _id: link.project._id,
                                            proj_name: link.project.proj_name,
                                            proj_id: link.project.proj_id,
                                            proj_commodity: link.project.proj_commodity,
                                            proj_status: link.project.proj_status,
                                            proj_coordinates: link.project.proj_coordinates
                                        });
                                        break;
                                    default:
                                        console.log(entity, 'link skipped...');
                                }
                            });

                        } else {
                            if (site_counter == site_len && link_counter == link_len) {
                                callback(null, concession);
                            }
                        }
                    });
            });
        } else {
            callback(null, concession);
        }
    }
    function getTransfers(concession, callback) {
        concession.transfers = [];
        Transfer.find({$or: [
            {project:{$in: concession.transfers_query}},
            {site:{$in: concession.transfers_query}}]})
            .populate('company country project site')
            .deepPopulate('source.source_type_id')
            .lean()
            .exec(function(err, transfers) {
                transfers_counter = 0;
                transfers_len = transfers.length;
                if (transfers_len>0) {
                    transfers.forEach(function (transfer) {
                        if (!concession.source_type.p || !concession.source_type.c) {
                            if (transfer.source.source_type_id.source_type_authority === 'authoritative') {
                                concession.source_type.c = true;
                            } else if (transfer.source.source_type_id.source_type_authority === 'non-authoritative') {
                                concession.source_type.c = true;
                            } else if (transfer.source.source_type_id.source_type_authority === 'disclosure') {
                                concession.source_type.p = true;
                            }
                        }
                        if(transfer.source!=undefined) {
                            if (!concession.sources[transfer.source._id]) {
                                //TODO clean up returned data if performance lags
                                concession.sources[transfer.source._id] = transfer.source;
                            }
                        }
                        ++transfers_counter;
                        concession.transfers.push({
                            _id: transfer._id,
                            transfer_year: transfer.transfer_year,
                            country: {
                                name: transfer.country.name,
                                iso2: transfer.country.iso2},
                            transfer_type: transfer.transfer_type,
                            transfer_unit: transfer.transfer_unit,
                            transfer_value: transfer.transfer_value,
                            transfer_level: transfer.transfer_level,
                            transfer_audit_type: transfer.transfer_audit_type,
                            transfer_links: []
                        });
                        if (transfer.company!==null && transfer.company) {
                            _.last(concession.transfers).company = {_id: transfer.company._id, company_name: transfer.company.company_name};
                        }
                        if (transfer.project!==null && transfer.project) {
                            _.last(concession.transfers).transfer_links.push({
                                _id: transfer.project._id,
                                route: transfer.project.proj_id,
                                type: 'project',
                                name: transfer.project.proj_name});
                        }
                        if (transfer.site!==null && transfer.site) {
                            var type;
                            if (transfer.site.field) {
                                type = 'field';
                            } else {
                                type = 'site';
                            }
                            _.last(concession.transfers).transfer_links.push({
                                _id: transfer.project._id,
                                route: transfer.project.proj_id,
                                type: type,
                                name: transfer.project.proj_name});
                        }
                        if (transfers_counter===transfers_len) {
                            callback(null, concession);
                        }
                    });
                } else {
                    callback(null, concession);
                }
            });
    }
    function getProduction(concession, callback) {
        concession.production = [];
        Production.find({$or: [
                {project:{$in: concession.transfers_query}},
                {site:{$in: concession.transfers_query}},
                {concession:{$in: concession.transfers_query}}]})
            .populate('production_commodity project site')
            .deepPopulate('source.source_type_id')
            .lean()
            .exec(function(err, production) {
                production_counter = 0;
                production_len = production.length;
                if (production_len>0) {
                    production.forEach(function (prod) {
                        if (!concession.source_type.p || !concession.source_type.c) {
                            if (prod.source.source_type_id.source_type_authority === 'authoritative') {
                                concession.source_type.c = true;
                            } else if (prod.source.source_type_id.source_type_authority === 'non-authoritative') {
                                concession.source_type.c = true;
                            } else if (prod.source.source_type_id.source_type_authority === 'disclosure') {
                                concession.source_type.p = true;
                            }
                        }
                        if(prod.source!=undefined) {
                            if (!concession.sources[prod.source._id]) {
                                //TODO clean up returned data if performance lags
                                concession.sources[prod.source._id] = prod.source;
                            }
                        }
                        ++production_counter;
                        concession.production.push({
                            _id: prod._id,
                            production_year: prod.production_year,
                            production_volume: prod.production_volume,
                            production_unit: prod.production_unit,
                            production_commodity: {
                                _id: prod.production_commodity._id,
                                commodity_name: prod.production_commodity.commodity_name,
                                commodity_id: prod.production_commodity.commodity_id},
                            production_price: prod.production_price,
                            production_price_unit: prod.production_price_unit,
                            production_level: prod.production_level,
                            production_links: []
                        });
                        if (prod.project!==null && prod.project) {
                            _.last(concession.production).production_links.push({
                                _id: prod.project._id,
                                route: prod.project.proj_id,
                                type: 'project',
                                name: prod.project.proj_name});
                        }
                        if (prod.site!==null && prod.site) {
                            var type;
                            if (prod.site.field) {
                                type = 'field';
                            } else {
                                type = 'site';
                            }
                            _.last(concession.production).production_links.push({
                                _id: prod.project._id,
                                route: prod.project.proj_id,
                                type: type,
                                name: prod.project.proj_name});
                        }
                        if (production_counter===production_len) {
                            callback(null, concession);
                        }
                    });
                } else {
                    callback(null, concession);
                }
            });
    }
    function getCompanyGroup(concession, callback) {
        concession_len = concession.companies.length;
        concession_counter = 0;
        if(concession_len>0) {
            concession.companies.forEach(function (company) {
                Link.find({company: company._id, entities:'company_group'})
                    .populate('company_group', '_id company_group_name')
                    .exec(function (err, links) {
                        ++concession_counter;
                        link_len = links.length;
                        link_counter = 0;
                        company.company_groups = [];
                            links.forEach(function (link) {
                                if (!concession.sources[link.source._id]) {
                                    concession.sources[link.source._id] = link.source;
                                }
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
    function getProjectCoordinate(concession,callback) {
        proj_counter = 0;
        proj_len = concession.projects.length;
        concession.polygon=[];
        concession.proj_coordinates = [];
        if (concession.concession_polygon.length>0) {
            var len=concession.concession_polygon.length;
            var counter=0;
            var coordinate=[];
            concession.concession_polygon.forEach(function (con_loc) {
                ++counter;
                coordinate.push({
                        'lat': con_loc.loc[0],
                        'lng': con_loc.loc[1]
                });
                if(len==counter){
                    concession.polygon.push({coordinate:coordinate});
                }
            })
        }
        if (concession.site_coordinates.sites.length>0) {
            concession.site_coordinates.sites.forEach(function (site_loc) {
                concession.proj_coordinates.push(site_loc);
            })
        }

        if (concession.site_coordinates.fields.length>0) {
            concession.site_coordinates.fields.forEach(function (field_loc) {
                concession.proj_coordinates.push(field_loc);
            })
        }

        if(proj_len>0) {
            concession.projects.forEach(function (project) {
                ++proj_counter;
                project.proj_coordinates.forEach(function (loc) {
                    concession.proj_coordinates.push({
                        'lat': loc.loc[0],
                        'lng': loc.loc[1],
                        'message': project.proj_name,
                        'timestamp': loc.timestamp,
                        'type': 'project',
                        'id': project.proj_id
                    });
                });
                if (proj_counter == proj_len) {
                    res.send(concession);
                }
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