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


exports.getContractTable = function(req, res){
    var link_counter, link_len,companies_len,companies_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);
    var company ={};var commodity=[];
    company.contracts_link=[];
    var type = req.params.type;
    var query='';
    if(type=='company') { query = {company:req.params.id, entities:"contract"}}
    if(type=='concession') { query = {concession:req.params.id, entities:"site"}}
    if(type=='commodity') { query = {commodity:req.params.id, entities:"site"}}
    if(type=='group') { query={company_group: req.params.id, entities: "company"}}
    async.waterfall([
        getLinks,
        getContracts,
        getCommodity,
        getCommodityContractsApi,
        getCommodityCountry,
        getCommodityContractsDB,
        getCommodityCompaniesCount,
        getContractCommodity,
        getGroupLinkedCompanies,
        getGroupLinkedProjects,
        getGroupContracts
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            res.send(result);
        }
    });
    function getLinks(callback) {
        if (type != 'commodity'&&type != 'group'&&type != 'country') {
            Link.find(query)
                .populate('contract commodity country')
                .deepPopulate('site.site_country.country site.site_commodity.commodity')
                .exec(function (err, links) {
                    if (links) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            company.contracts_link.push({_id: link.contract.contract_id});
                            if (link_len == link_counter) {
                                company.contracts_link = _.map(_.groupBy(company.contracts_link,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                company.contracts_link=company.contracts_link.splice(skip,limit+skip);
                                callback(null, company);
                            }

                        })
                    } else {
                        callback(null, company);
                    }
                });
        } else {
            callback(null, company);
        }
    }
    function getContracts(company, callback) {
        if (type != 'commodity'&&type!='group') {
            company.contracts = [];
            var contract_counter = 0;
            var contract_len = company.contracts_link.length;
            if (contract_len > 0) {
                _.each(company.contracts_link, function (contract) {
                    request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract._id + '/metadata', function (err, res, body) {
                        var body = JSON.parse(body);
                        ++contract_counter;
                        company.contracts.push({
                            _id: contract._id,
                            contract_name: body.name,
                            contract_country: body.country,
                            contract_commodity: body.resource
                        });

                        if (contract_counter == contract_len) {
                            callback(null, company);
                        }
                    });
                });
            } else {
                callback(null, company);
            }
        } else {
            callback(null, company);
        }
    }
    function getCommodity(company,callback) {
        if (type == 'commodity') {
            Commodity.find({_id:req.params.id})
                .populate('contract commodity country')
                .exec(function (err, commodities) {
                    if (commodities) {
                        commodity = commodities;
                        callback(null, commodity);
                    } else {
                        callback(null, company);
                    }
                });
        } else {
            callback(null, company);
        }
    }
    function getCommodityContractsApi(commodity, callback) {
        if (type == 'commodity'||type == 'country') {
            var contract_query='';
            var getContract=false;
            if(type == 'commodity'){
                if(commodity.length>0) {
                    contract_query = 'recource=' + commodity[0].commodity_name;
                    getContract=true;
                }
            }
            if(type == 'country'){
                contract_query = 'country=' + req.params.id;
                getContract=true;
            }
            company.contracts = [];
            if(getContract==true) {
                request('http://rc-api-stage.elasticbeanstalk.com/api/contracts/search?group=metadata&' + contract_query, function (err, res, body) {
                    var body = JSON.parse(body);
                    var contract_counter = 0;
                    var contract_len = body.results.length;
                    if(contract_len>0) {
                        _.each(body.results, function (contract) {
                            ++contract_counter;
                            company.contracts.push({
                                _id: contract.open_contracting_id,
                                id: '',
                                contract_name: contract.name,
                                contract_country: {
                                    code: contract.country_code,
                                    name: []
                                },
                                contract_commodity: contract.resource,
                                companies: 0
                            });
                            if (contract_counter == contract_len) {
                                company.contracts = company.contracts.splice(skip, limit + skip);
                                callback(null, company);
                            }
                        });
                    }else {
                        callback(null, company);
                    }
                });
            }else {
                callback(null, company);
            }
        } else {
            callback(null, company);
        }
    }
    function getCommodityCountry(company, callback) {
        if (type == 'commodity') {
            var contract_len = company.contracts.length;
            var contract_counter = 0;
            if (contract_len > 0) {
                company.contracts.forEach(function (contract) {
                    contract_counter++;
                    if(contract.contract_country.code != undefined) {
                        Country.find({iso2: contract.contract_country.code})
                            .exec(function (err, country) {
                                if(country.length>0) {
                                    contract.contract_country.name = country[0].name;
                                }
                                if (contract_counter == contract_len) {
                                    callback(null, company);
                                }
                            });
                    }
                })
            } else {
                callback(null, company);
            }
        } else {
            callback(null, company);
        }
    }
    function getCommodityContractsDB(company, callback) {
        if (type == 'commodity' || type == 'country') {
            var contract_len = company.contracts.length;
            var contract_counter = 0;
            if (contract_len > 0) {
                company.contracts.forEach(function (contract) {
                    if(contract._id != undefined) {
                        Contract.find({contract_id: contract._id})
                            .exec(function (err, contracts) {
                                contract_counter++;
                                if(contracts.length>0) {
                                    contract.id = contracts[0]._id;
                                }
                                if (contract_counter == contract_len) {
                                    callback(null, company);
                                }
                            });
                    }else {
                        contract_counter++;
                    }
                    if (contract_counter == contract_len) {
                        callback(null, company);
                    }
                })
            } else {
                callback(null, company);
            }
        } else {
            callback(null, company);
        }
    }
    function getCommodityCompaniesCount(company, callback) {
        if (type == 'commodity'||type == 'country') {
            var contract_len = company.contracts.length;
            var contract_counter = 0;
            if (contract_len > 0) {
                company.contracts.forEach(function (contract) {
                    if(contract.id !='') {
                        Link.find({contract:contract.id,entities:'company'})
                            .exec(function (err, companies) {
                                contract_counter++;
                                if(companies.length>0) {
                                    companies = _.map(_.groupBy(companies,function(doc){
                                        return doc._id;
                                    }),function(grouped){
                                        return grouped[0];
                                    });
                                    contract.companies = companies.length;
                                }
                                if (contract_counter == contract_len) {
                                    callback(null, company);
                                }
                            });
                    } else
                    {contract_counter++;}
                    if (contract_counter == contract_len) {
                        callback(null, company);
                    }
                })
            } else {
                callback(null, company);
            }
        } else {
            callback(null, company);
        }
    }
    function getContractCommodity(company, callback) {
        if (type != 'commodity'&&type!='group'&&type != 'country') {
            var contract_len = company.contracts.length;
            var contract_counter = 0;
            if (contract_len > 0) {
                company.contracts.forEach(function (contract) {
                    contract.commodity = [];
                    var commodity_len = contract.contract_commodity.length;
                    if (commodity_len > 0) {
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
                                            callback(null, company);
                                        }
                                    });
                            }
                        })
                    } else{
                        if (contract_counter == contract_len) {
                            callback(null, company);
                        }
                    }
                })
            } else {
                callback(null, company);
            }
        }else{
            callback(null, company);
        }
    }
    function getGroupLinkedCompanies(company,callback) {
        if(type=='group') {
            var companies =[];
            Link.find(query)
                .exec(function (err, links) {
                    if (links.length>0) {
                        link_len = links.length;
                        link_counter = 0;
                        _.each(links, function (link) {
                            ++link_counter;
                            if(link.company!=undefined) {
                                companies.push({_id: link.company});
                            }
                            if (link_len == link_counter) {
                                companies = _.map(_.groupBy(companies,function(doc){
                                    return doc._id;
                                }),function(grouped){
                                    return grouped[0];
                                });
                                callback(null, companies);
                            }
                        })
                    } else {
                        callback(null, company);
                    }
                });
        } else{
            callback(null, company);
        }
    }
    function getGroupLinkedProjects(companies,callback) {
        if(type=='group') {
            var contract=[];
            if(companies.length>0) {
                companies_len = companies.length;
                companies_counter = 0;
                _.each(companies, function (company) {
                    if(company._id!=undefined){
                        query = {company: company._id, entities: "contract"};
                        Link.find(query)
                            .populate('contract')
                            .exec(function (err, links) {
                                ++companies_counter;
                                if (links.length>0) {
                                    link_len = links.length;
                                    link_counter = 0;
                                    _.each(links, function (link) {
                                        ++link_counter;
                                        contract.push(link.contract);
                                        if (link_len == link_counter && companies_counter == companies_len) {
                                            contract = _.map(_.groupBy(contract,function(doc){
                                                return doc._id;
                                            }),function(grouped){
                                                return grouped[0];
                                            });
                                            callback(null, contract);
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
    function getGroupContracts(contracts, callback) {
        if (type=='group') {
            company.contracts = [];
            var contract_counter = 0;
            var contract_len = contracts.length;
            if (contract_len > 0) {
                _.each(contracts, function (contract) {
                    request('http://rc-api-stage.elasticbeanstalk.com/api/contract/' + contract.contract_id + '/metadata', function (err, res, body) {
                        var body = JSON.parse(body);
                        ++contract_counter;
                        company.contracts.push({
                            contract_id: contract.contract_id,
                            _id: contract._id,
                            contract_name: body.name,
                            contract_country: body.country,
                            contract_commodity: body.resource
                        });

                        if (contract_counter == contract_len) {
                            company.contracts=company.contracts.splice(skip,limit+skip);
                            callback(null, company);
                        }
                    });
                });
            } else {
                callback(null, company);
            }
        } else {
            callback(null, company);
        }
    }
};