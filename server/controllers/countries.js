'use strict';

var Country 		= require('mongoose').model('Country'),
    Transfer 	    = require('mongoose').model('Transfer'),
    Link            = require('mongoose').model('Link'),
    Project 		= require('mongoose').model('Project'),
    Company 		= require('mongoose').model('Company'),
    Site 			= require('mongoose').model('Site'),
    Concession 		= require('mongoose').model('Concession'),
    Production 		= require('mongoose').model('Production'),
    Commodity 		= require('mongoose').model('Commodity'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getCountries = function(req, res) {
    var countries_len, countries_counter, final_country_set,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip),
        models = [
            {name:'Site',field:'site_country.country',params:'false',count:'site_count'},
            {name:'Site',field:'site_country.country',params:'true',count:'field_count'},
            {name:'Concession',field:'concession_country.country',count:'concession_count'},
            {name:'Transfer',field:'country',count:'transfer_count'},
            {name:'Production',field:'country',count:'production_count'}
        ];

    async.waterfall([
        countryCount,
        getCountrySet,
        getProjectCounts,
        getSiteCounts,
        getFieldCounts,
        getConcessionCount,
        getTransferCount,
        getRelevantCountries
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });

    function countryCount(callback) {
        Country.find({}).count().exec(function(err, country_count) {
            if (err) {
                callback(err);
            } else if (!country_count) {
                callback(null, 0);
            } else {
                callback(null, country_count);
            }
        });
    }
    function getCountrySet(country_count, callback) {
        Country.find(req.query)
            .sort({
                name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(function(err, countries) {
                if (err) {
                    callback(err);
                } else if (!countries) {
                    callback(null, country_count, []);
                } else {
                    callback(null, country_count, countries);
                }
            });
    }
    function getProjectCounts(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        _.each(countries, function(country) {
            Project.find({'proj_country.country': country._id})
                .count()
                .exec(function (err, count){
                    ++countries_counter
                    country.project_count = count;
                    if (countries_counter == countries_len) {
                        callback(null, country_count, countries);
                    }
                });
        });
    }
    function getSiteCounts(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        _.each(countries, function(country) {
            Site.find({'site_country.country': country._id, field:false})
                .count()
                .exec(function (err, count){
                    ++countries_counter
                    country.site_count = count;
                    if (countries_counter == countries_len) {
                        callback(null, country_count, countries);
                    }
                });
        });
    }
    function getFieldCounts(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        _.each(countries, function(country) {
            Site.find({'site_country.country': country._id, field:true})
                .count()
                .exec(function (err, count){
                    ++countries_counter
                    country.field_count = count;
                    if (countries_counter == countries_len) {
                        callback(null, country_count, countries);
                    }
                });
        });
    }
    function getConcessionCount(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        _.each(countries, function(country) {
            Concession.find({'concession_country.country': country._id})
                .count()
                .exec(function (err, count){
                    ++countries_counter
                    country.concession_count = count;
                    if (countries_counter == countries_len) {
                        callback(null, country_count, countries);
                    }
                });
        });
    }
    function getTransferCount(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        _.each(countries, function(country) {
            Transfer.find({'country': country._id})
                .count()
                .exec(function (err, count){
                    ++countries_counter
                    country.transfer_count = count;
                    if (countries_counter == countries_len) {
                        // callback(null, {data:countries, count:country_count})
                        callback(null, country_count, countries);
                    }
                });
        });
    }
    function getRelevantCountries(country_count, countries, callback) {
        countries_len = countries.length;
        countries_counter = 0;
        final_country_set = [];
        _.each(countries, function(country) {
            if (country.project_count!==0 || country.site_count!==0 || country.field_count!==0 || country.concession_count!==0 || country.transfer_count!==0) {
                final_country_set.push(country);
            } else {
                --country_count;
            }
        });
        callback(null, {data:final_country_set, count:country_count})
    }
};

exports.getCountryByID = function(req, res) {
    var production_counter, production_len, transfers_counter, transfers_len, concession_len, concession_counter, link_counter, site_counter, site_len, link_len, company_counter, company_len, project_counter, project_len;

    async.waterfall([
        getCountry,
        getIncorporatedCompanies,
        getOperatingCompanies,
        getProjects,
        getSites,
        getConcessions,
        getContracts,
        getContractCommodity,
        getIncorporatedCompanyGroups,
        getProjectCompanies,
        getConcessionProjects,
        getTransfers,
        getProduction,
        getCompanyGroups,
        getProjectCoordinate
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result)
        }
    });

    function getCountry(callback) {
        Country.findOne({iso2:req.params.id})
            .populate('country_commodity.commodity')
            .lean()
            .exec(function(err, country) {
                if(country) {
                    callback(null, country);
                } else {
                    res.send(err);
                }
            });
    }
    function getIncorporatedCompanies(country, callback) {
        country.companies_incorporated = [];
        Company.find({'country_of_incorporation.country': country._id})
            .populate('company_aliases', ' _id alias')
            .populate('company_group')
            .exec(function (err, company) {
                company_len = company.length;
                company_counter = 0;
                if (company_len>0) {
                    _.each(company, function (c) {
                        company_counter++;
                        country.companies_incorporated.push({_id:c._id,company_name: c.company_name,company_groups:[]});
                    });
                    if(company_counter==company_len){
                        callback(null, country);
                    }
                } else {
                    callback(null, country);
                }
            });
    }
    function getOperatingCompanies(country, callback) {
        country.companies = [];
        Company.find({'countries_of_operation.country': country._id})
            .populate('company_aliases', ' _id alias')
            .populate('company_group')
            .exec(function (err, company) {
                company_len = company.length;
                company_counter = 0;
                if (company_len>0) {
                    _.each(company, function (c) {
                        company_counter++;
                        country.companies.push({_id:c._id,company_name: c.company_name,company_groups:[]});
                    });
                    if(company_counter==company_len){
                        callback(null, country);
                    }
                } else {
                    callback(null, country);
                }
            });
    }
    function getProjects(country, callback) {
        country.projects = [];
        country.location = [];
        country.commodities = [];
        country.sources = {};
        country.transfers_query = [country._id];
        country.site_coordinates = {sites: [], fields: []};
        Project.find({'proj_country.country': country._id})
            .populate('proj_country.country')
            .populate('proj_aliases', ' _id alias')
            .populate('proj_commodity.commodity')
            .exec(function (err, project) {
                project_len = project.length;
                project_counter= 0;
                if (project_len>0) {
                    _.each(project, function (proj) {
                        ++project_counter;
                        if(country.transfers_query.indexOf(proj._id)<0) {
                            country.transfers_query.push(proj._id);
                        }
                        country.projects.push({
                            _id: proj._id,
                            proj_name: proj.proj_name,
                            proj_id: proj.proj_id,
                            proj_country: proj.proj_country,
                            proj_coordinates: proj.proj_coordinates,
                            proj_type: proj.proj_type,
                            proj_commodity: proj.proj_commodity,
                            proj_status: proj.proj_status,
                            companies: []
                        });
                        if (proj.proj_commodity.length>0) {
                            if (_.where(country.commodities, {_id: _.last(proj.proj_commodity).commodity._id}).length<1) {
                                country.commodities.push({
                                    _id: _.last(proj.proj_commodity).commodity._id,
                                    commodity_name: _.last(proj.proj_commodity).commodity.commodity_name,
                                    commodity_type: _.last(proj.proj_commodity).commodity.commodity_type,
                                    commodity_id: _.last(proj.proj_commodity).commodity.commodity_id
                                });
                            }
                        }
                        if (project_counter == project_len) {
                            callback(null, country);
                        }
                    });
                } else {
                    callback(null, country);
                }
            });
    }
    function getSites(country, callback) {
        country.sites = [];
        Site.find({'site_country.country': country._id})
            .populate('site_commodity.commodity')
            .exec(function (err, sites) {
                site_len = sites.length;
                site_counter = 0;
                if (site_len>0) {
                    _.each(sites, function (site) {
                        ++site_counter;
                        if(country.transfers_query.indexOf(site._id)<0) {
                            country.transfers_query.push(site._id);
                        }
                        country.sites.push({
                            _id: site._id,
                            field: site.field,
                            site_name: site.site_name,
                            site_status: site.site_status,
                            site_country: site.site_country,
                            site_commodity: site.site_commodity,
                            companies: []
                        });
                        if (site.field && site.site_coordinates.length>0) {
                            site.site_coordinates.forEach(function (loc) {
                                country.site_coordinates.fields.push({
                                    'lat': loc.loc[0],
                                    'lng': loc.loc[1],
                                    'message': site.site_name,
                                    'timestamp': loc.timestamp,
                                    'type': 'field',
                                    'id': site._id
                                });
                            });
                        } else if (!site.field && site.site_coordinates.length>0) {
                            site.site_coordinates.forEach(function (loc) {
                                country.site_coordinates.sites.push({
                                    'lat': loc.loc[0],
                                    'lng': loc.loc[1],
                                    'message': site.site_name,
                                    'timestamp': loc.timestamp,
                                    'type': 'site',
                                    'id': site._id
                                });
                            });
                        }
                        if (site.site_commodity.length>0) {
                            if (_.where(country.company_commodity, {_id:_.last(site.site_commodity)._id}).length<1) {
                                country.company_commodity.push({
                                    _id: _.last(site.site_commodity)._id,
                                    commodity_name: _.last(site.site_commodity).commodity.commodity_name,
                                    commodity_type: _.last(site.site_commodity).commodity.commodity_type,
                                    commodity_id: _.last(site.site_commodity).commodity.commodity_id
                                });
                            }
                        }

                        if(site_counter==site_len){
                            callback(null, country);
                        }
                    });
                } else {
                    if(site_counter==site_len){
                        callback(null, country);
                    }
                }
            });
    }
    function getConcessions(country, callback) {
        concession_counter = 0;
        country.concessions = [];
        Concession.find({'concession_country.country': country._id})
            .populate('concession_country.country')
            .populate('concession_commodity.commodity')
            .exec(function (err, concessions) {
                if (concessions.length>0) {
                    concession_len = concessions.length;
                    _.each(concessions, function (concession) {
                        ++concession_counter;
                        country.concessions.push({
                            _id: concession._id,
                            concession_name: concession.concession_name,
                            concession_country: _.find(concession.concession_country.reverse()).country,
                            concession_type: _.find(concession.concession_type.reverse()),
                            concession_commodities: concession.concession_commodity,
                            concession_status: concession.concession_status,
                            projects:[]
                        });
                        if (concession.concession_commodity.length>0) {
                            if (_.where(country.commodities, {_id: _.last(concession.concession_commodity).commodity._id}).length<1) {
                                country.commodities.push({
                                    _id: _.last(concession.concession_commodity).commodity._id,
                                    commodity_name: _.last(concession.concession_commodity).commodity.commodity_name,
                                    commodity_type: _.last(concession.concession_commodity).commodity.commodity_type,
                                    commodity_id: _.last(concession.concession_commodity).commodity.commodity_id
                                });
                            }
                        }
                        if (concession_counter == concession_len) {
                            callback(null, country);
                        }

                    });
                } else {
                    callback(null, country);
                }
            });
    }
    function getContracts(country, callback) {
        country.contracts = [];
        request('http://rc-api-stage.elasticbeanstalk.com/api/contracts/search?group=metadata&country_code=' + country.iso2.toLowerCase(), function (err, res, body) {
            var body = JSON.parse(body);
            body = body.results;
            var contract_counter = 0;
            var contract_len =body.length;
            if(contract_len>0) {
                country.concessions = [];
                _.each(body, function (contract) {
                    ++contract_counter;
                    country.contracts.push({
                        _id: contract.open_contracting_id,
                        contract_name: contract.name,
                        contract_commodity: contract.resource,
                        companies:contract.company_name
                    });
                });
                if (contract_counter == contract_len) {
                    callback(null, country);
                }
            } else {
                callback(null, country);
            }
        });
    }
    function getContractCommodity(country, callback) {
        var contract_len = country.contracts.length;
        var contract_counter = 0;
        if(contract_len>0) {
            country.contracts.forEach(function (contract) {
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
                                            commodity_type: name.commodity_type,
                                            _id: name._id,
                                            commodity_id: name.commodity_id
                                        });
                                    });
                                    if (contract_counter == contract_len) {
                                        callback(null, country);
                                    }
                                });
                        }
                    })
                }
            })
        } else{
            callback(null, country);
        }
    }
    function getIncorporatedCompanyGroups(country, callback) {
        company_counter = 0;
        company_len = country.companies_incorporated.length;
        if(company_len>0) {
            _.each(country.companies_incorporated,function (company) {
                Link.find({company: company._id, entities: 'company_group'})

                    .populate('company_group','_id company_group_name')
                    .deepPopulate('source.source_type_id')
                    .exec(function (err, links) {
                        link_counter = 0;
                        link_len = links.length;
                        ++company_counter;
                        links.forEach(function (link) {
                            ++link_counter;
                            var entity = _.without(link.entities, 'company')[0];
                            if(link.source!=undefined) {
                                if (!country.sources[link.source._id]) {
                                    country.sources[link.source._id] = link.source;
                                }
                            }
                            switch (entity) {
                                case 'company_group':
                                    company.company_groups.push({
                                        _id:link._id,
                                        company_group_name: link.company_group.company_group_name
                                    });
                                    break;
                                default:
                                    console.log(entity, 'link skipped...');
                            }
                        });
                        if (link_counter == link_len && company_len==company_counter) {
                            callback(null, country);
                        }

                    });
            });
        } else {
            callback(null, country);
        }
    }
    function getProjectCompanies(country, callback) {
        project_len = country.projects.length;
        if (project_len>0) {
            async.each(country.projects, function (project, ecallback) {
                    project.companies = 0;
                    Link.find({project: project._id, entities: 'company'})
                        .populate('company')
                        .deepPopulate('source.source_type_id')
                        .exec(function (err, links) {
                            links.forEach(function (link) {
                                var entity = _.without(link.entities, 'project')[0];
                                if(link.source!=undefined) {
                                    if (!country.sources[link.source._id]) {
                                        country.sources[link.source._id] = link.source;
                                    }
                                }
                                switch (entity) {
                                    case 'company':
                                        if (_.where(country.companies, {_id: link.company._id}).length<1) {
                                            country.companies.push({_id:link.company._id,company_name: link.company.company_name,company_groups:[]});
                                        }
                                        project.companies += 1;
                                        break;
                                    default:
                                        console.log(entity, 'link skipped...');
                                }
                            });
                            ecallback(null);
                        });
                },
                function (err) {
                    callback(null, country);
                });
        }
        else {
            callback(null, country);
        }
    }
    function getConcessionProjects(country, callback) {
        link_counter = 0;
        concession_len = country.concessions.length;
        if(concession_len>0) {
            concession_counter = 0;
            _.each(country.concessions, function (concession) {
                concession.projects = 0;
                Link.find({concession: concession._id})
                    .populate('project')
                    .deepPopulate('source.source_type_id')
                    .exec(function (err, links) {
                        ++concession_counter;
                        link_len = links.length;
                        link_counter = 0;
                        if(link_len>0) {
                            links.forEach(function (link) {
                                ++link_counter;
                                var entity = _.without(link.entities, 'concession')[0];
                                if (link.source != undefined) {
                                    if (!country.sources[link.source._id]) {
                                        country.sources[link.source._id] = link.source;
                                    }
                                }
                                switch (entity) {
                                    case 'project':
                                        concession.projects += 1;
                                        break;
                                    default:
                                        console.log(entity, 'link skipped...');
                                }
                                if (link_counter == link_len && concession_counter==concession_len) {
                                    callback(null, country);
                                }
                            });
                        }
                    });
            })
        } else {
            callback(null, country);
        }
    }
    function getTransfers(country, callback) {
        country.transfers = [];
        Transfer.find({$or: [
                {project:{$in: country.transfers_query}},
                {site:{$in: country.transfers_query}},
                {concession:{$in: country.transfers_query}},
                {country:{$in: country.transfers_query}}]})
            .populate('concession company project site')
            .deepPopulate('source.source_type_id')
            .lean()
            .exec(function(err, transfers) {
                transfers_counter = 0;
                transfers_len = transfers.length;
                if (transfers_len>0) {
                    transfers.forEach(function (transfer) {
                        if(transfer.source!=undefined) {
                            if (!country.sources[transfer.source._id]) {
                                //TODO clean up returned data if performance lags
                                country.sources[transfer.source._id] = transfer.source;
                            }
                        }

                        ++transfers_counter;
                        country.transfers.push({
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
                            _.last(country.transfers).company = {_id: transfer.company._id, company_name: transfer.company.company_name};
                            if (_.where(country.companies, {_id: transfer.company._id}).length<1) {
                                country.companies.push({_id:transfer.company._id,company_name: transfer.company.company_name,company_groups:[]});
                            }
                        }
                        if (transfer.project!==null && transfer.project) {
                            _.last(country.transfers).transfer_links.push({
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
                            _.last(country.transfers).transfer_links.push({
                                _id: transfer.site._id,
                                route: transfer.site._id,
                                type: type,
                                name: transfer.site.site_name});
                        }
                        if (transfers_counter===transfers_len) {
                            callback(null, country);

                        }
                    });
                } else {
                    callback(null, country);
                }
            });
    }
    function getProduction(country, callback) {
        country.production = [];
        Production.find({$or: [
                {project:{$in: country.transfers_query}},
                {site:{$in: country.transfers_query}},
                {concession:{$in: country.transfers_query}},
                {country:{$in: country.transfers_query}}]})
            .populate('production_commodity concession commodity project site')
            .deepPopulate('source.source_type_id')
            .lean()
            .exec(function(err, production) {
                production_counter = 0;
                production_len = production.length;
                if (production_len>0) {
                    production.forEach(function (prod) {
                        if(prod.source!=undefined) {
                            if (!country.sources[prod.source._id]) {
                                //TODO clean up returned data if performance lags
                                country.sources[prod.source._id] = prod.source;
                            }
                        }
                        ++production_counter;
                        country.production.push({
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
                            _.last(country.production).production_links.push({
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
                            _.last(country.production).production_links.push({
                                _id: prod.site._id,
                                route: prod.site._id,
                                type: type,
                                name: prod.site.site_name});
                        }
                        if (production_counter===production_len) {
                            callback(null, country);
                        }
                    });
                } else {
                    callback(null, country);
                }
            });
    }
    function getCompanyGroups(country, callback) {
        company_counter = 0;
        company_len = country.companies.length;
        if(company_len>0) {
            _.each(country.companies,function (company) {
                Link.find({company: company._id, entities: 'company_group'})
                    .populate('company_group','_id company_group_name')
                    .deepPopulate('source.source_type_id')
                    .exec(function (err, links) {
                        link_counter = 0;
                        link_len = links.length;
                        ++company_counter;
                        links.forEach(function (link) {
                            ++link_counter;
                            var entity = _.without(link.entities, 'company')[0];
                            if(link.source!=undefined) {
                                if (!country.sources[link.source._id]) {
                                    country.sources[link.source._id] = link.source;
                                }
                            }
                            switch (entity) {
                                case 'company_group':
                                    company.company_groups.push({
                                        _id:link._id,
                                        company_group_name: link.company_group.company_group_name
                                    });
                                    break;
                                default:
                                    console.log(entity, 'link skipped...');
                            }
                        });
                        if (link_counter == link_len && company_len==company_counter) {
                            callback(null, country);
                        }

                    });
            });
        } else {
            callback(null, country);
        }
    }
    function getProjectCoordinate(country,callback) {
        country.proj_coordinates = [];
        if (country.site_coordinates.sites.length>0) {
            country.site_coordinates.sites.forEach(function (site_loc) {
                country.proj_coordinates.push(site_loc);
            })
        }
        if (country.site_coordinates.fields.length>0) {
            country.site_coordinates.fields.forEach(function (field_loc) {
                country.proj_coordinates.push(field_loc);
            })
        }
        project_counter = 0;
        project_len = country.projects.length;
        if(project_len>0) {
            country.projects.forEach(function (project) {
                ++project_counter;
                project.proj_coordinates.forEach(function (loc) {
                    country.proj_coordinates.push({
                        'lat': loc.loc[0],
                        'lng': loc.loc[1],
                        'message': project.proj_name,
                        'timestamp': loc.timestamp,
                        'type': 'project',
                        'id': project.proj_id
                    });
                })
                if (project_counter == project_len) {
                    res.send(country);
                }
            });
        } else{
            res.send(country);
        }
    }

};

exports.createCountry = function(req, res, next) {
    var countryData = req.body;
    Country.create(countryData, function(err, country) {
        if(err){
            res.status(400);
            err = new Error('Error');
            return res.send({reason:err.toString()})
        } else{
            res.send();
        }
    });
};

exports.updateCountry = function(req, res) {
    var countryUpdates = req.body;
    Country.findOne({_id:req.body._id}).exec(function(err, country) {
        if(err) {
            res.status(400);
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
        country.iso2= countryUpdates.iso2;
        country.name= countryUpdates.name;
        //country.country_aliases= countryUpdates.country_aliases;
        //country.country_type= countryUpdates.country_type;
        //country.country_commodity= countryUpdates.country_commodity;
        country.save(function(err) {
            if(err) {
                err = new Error('Error');
                return res.send({reason: err.toString()});
            } else{
                res.send();
            }
        })
    });
};

exports.deleteCountry = function(req, res) {
    Country.remove({_id: req.params.id}, function(err) {
        if(!err) {
            res.send();
        }else{
            err = new Error('Error');
            return res.send({ reason: err.toString() });
        }
    });
};