var SourceType = require('mongoose').model('SourceType'),
    Source = require('mongoose').model('Source'),
    Country = require('mongoose').model('Country'),
    Commodity = require('mongoose').model('Commodity'),
    CompanyGroup = require('mongoose').model('CompanyGroup'),
    Company = require('mongoose').model('Company'),
    Project = require('mongoose').model('Project'),
    Site = require('mongoose').model('Site'),
    Link = require('mongoose').model('Link'),
    Contract = require('mongoose').model('Contract'),
    Concession = require('mongoose').model('Concession'),
    Production = require('mongoose').model('Production'),
    Transfer = require('mongoose').model('Transfer'),
    util = require('util'),
    async   = require('async'),
    csv     = require('csv-parse/lib/sync'),
    request = require('request'),
    moment = require('moment'),
    _ = require('underscore'),
    randomstring = require('just.randomstring');
    
var actionId;

var createdOrAffectedEntities;

var projIds = [];

exports.processData = function(link, actionid, existingProjIds, callback) {
    actionId = actionid;
    createdOrAffectedEntities = {};
    projIds = existingProjIds;
    var report = "";
    var keytoend =  link.substr(link.indexOf("/d/") + 3, link.length);
    var key = keytoend.substr(0, keytoend.indexOf("/"));
    report += `Using link ${link}\n`;
    if (key.length != 44) {
        report += "Could not detect a valid spreadsheet key in URL\n";
        callback("Failed", report, createdOrAffectedEntities);
        return;
    }
    else {
        report += `Using GS key ${key}\n`;
    }
    var feedurl = `https://spreadsheets.google.com/feeds/worksheets/${key}/public/full?alt=json`;
    var sheets = {};

    request({
        url: feedurl,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            //create num of sheets without . in name
            var numSheets = 0;
            var i;
            for (i=0; i<body.feed.entry.length; i++) {
                if (body.feed.entry[i].title.$t.indexOf(".") != -1) numSheets++;
            }
            var numProcessed = 0;
            for (i=0; i<body.feed.entry.length; i++) {
                for (var j=0; j<body.feed.entry[i].link.length; j++) {
                    if ((body.feed.entry[i].link[j].type == "text/csv") && (body.feed.entry[i].title.$t.indexOf(".") != -1)) {
                        report += `Getting data from sheet "${body.feed.entry[i].title.$t}"...\n`;
                        request({
                            url: body.feed.entry[i].link[j].href
                        }, (function (i, error, response, sbody) {
                            if (error) {
                                report += `${body.feed.entry[i].title.$t}: Could not retrieve sheet`;
                                callback("Failed", report, createdOrAffectedEntities);
                                return;
                            }
                            sbody = sbody.substring(sbody.indexOf("\n#") + 1); //Skip to start
                            records = csv(sbody, {trim: true, columns: true});
                            var item = {};
                            item.title = body.feed.entry[i].title.$t;
                            item.link = response.request.uri.href;
                            item.data = records;                                
                            report += `${item.title}: Stored ${records.length} rows\n`;
                            sheets[item.title.split(".").shift()] = item;
                            numProcessed++;
                            if (numProcessed == numSheets) {
                                var reporter = {
                                    report: report,
                                    add: function(more) {
                                        this.report += more;
                                    }
                                };
                                //callback("Success", report);
                                parseData(sheets, reporter, callback);
                            }
                        }).bind(null, i));
                    }
                }
            }
        }
        else {
            report += "Could not get information from GSheets feed - is the sheet shared?\n";
            callback("Failed", report, createdOrAffectedEntities);
            return;
        }
    });
};

var currentTime = moment.utc().format(); //Time for this import: set once

function parseGsDate(input) {
    /* In general format should appear as YYYY or DD/MM/YYYY or empty but sometimes GS has it as a date internally */
    var result;
    if (!input || input === "") return null;
    else if (input.length == 4) result = moment(input + ' +0000', "YYYY Z").format();
    else result = moment(input + ' +0000', "DD/MM/YYYY Z").format();
    //Hope for the best
    if (result == "Invalid date") return input;
    else return result;
}

//Data needed for inter-entity reference
var sourceTypes, sources, countries, countriesById, commodities, commoditiesById, companies, company_groups, projects, sites, contracts, concessions;

function fixwebsite(input) {
    if (input.indexOf('http') == -1) input = "http://" + input;
    return input;
}

var makeNewSource = function(newRow) {
    newRow['#source+sourceDate'] = parseGsDate(newRow['#source+sourceDate']);
    newRow['#source+retrievedDate'] = parseGsDate(newRow['#source+retrievedDate']);

    if (!sourceTypes[newRow['#source+sourceType']]) {
        console.log("SERIOUS ERROR: Missing source type in the DB");
        return false;
    }

    var source = {
        source_name: newRow['#source'],
        source_type_id: sourceTypes[newRow['#source+sourceType']]._id,
        source_url: fixwebsite(newRow['#source+url']),
        source_archive_url: fixwebsite(newRow['#source+archiveCopy']),
        source_notes: newRow['#source+description'],
        source_date: newRow['#source+sourceDate'],
        retrieve_date: newRow['#source+retrievedDate']
        /* TODO? create_author:, */
    };
    return source;
};

var makeNewCompanyGroup = function(newRow) {
    var returnObj = {obj: null, link: null};
    var companyg = {
        company_group_name: newRow['#group'],
    };
    
    if (newRow['#group+openCorporatesURL'] !== "") {
        companyg.open_corporates_group_ID = ocUrlToId(newRow['#group+openCorporatesURL']);
        if (companyg.open_corporates_group_ID === false) return false;
    }
    if (newRow['#group+country+identifier'] !== "") {
        if (!countries[newRow['#group+country+identifier']]) {
            console.log("SERIOUS ERROR: Missing country in the DB. Either the DB or Sheet need to be fixed.");
            return false;
        }
        companyg.country_of_incorporation = [{country: countries[newRow['#group+country+identifier']]._id, source: sources[newRow['#source'].toLowerCase()]._id, timestamp: currentTime}]; //Fact array
    }
    if (newRow['#group+website'] !== "") {
        companyg.company_group_website = {string: fixwebsite(newRow['#group+website']), source: sources[newRow['#source'].toLowerCase()]._id, timestamp: currentTime}; //Fact
    }
    if (newRow['#group+notes'] !== "") {
       companyg.description = newRow['#group+notes'];
    }

    if (newRow['#source'] !== "") {
        if (sources[newRow['#source'].toLowerCase()]) { //Must be here due to lookups in sheet
            companyg.company_group_record_established = sources[newRow['#source'].toLowerCase()]._id;
        }
        else return false; //error
    }
    else return false; //error
    
    returnObj.obj = companyg;
    return returnObj;
};

function ocUrlToId(url) {
    if (url.indexOf("opencorporates") == -1) return false;
    var parts = url.split('/');
    return parts[parts.length-2] + '/' + parts[parts.length-1];
}

var makeNewCompany = function(newRow) {
    var returnObj = {obj: null, link: null};
    var company = {
        company_name: newRow['#company']
    };

    //TODO: Require OC URL for UK companies? (Issue #136)
    if (newRow['#company+openCorporatesURL'] !== "") {
        company.open_corporates_id = ocUrlToId(newRow['#company+openCorporatesURL']);
        if (company.open_corporates_id === false) return false;
    }
    if (newRow['#company+country+identifier'] !== "") {
        if (!countries[newRow['#company+country+identifier']]) {
            console.log("SERIOUS ERROR: Missing country in the DB. Either the DB or Sheet need to be fixed.");
            return false;
        }
        company.country_of_incorporation = [{country: countries[newRow['#company+country+identifier']]._id, source: sources[newRow['#source'].toLowerCase()]._id, timestamp: currentTime}]; //Fact array
    }
    if (newRow['#company+website'] !== "") {
        company.company_website = {string: fixwebsite(newRow['#company+website']), source: sources[newRow['#source'].toLowerCase()]._id, timestamp: currentTime}; //Fact
    }
    if (newRow['#company+notes'] !== "") {
       company.description = newRow['#company+notes'];
    }
    if (newRow['#source'] !== "") {
        if (sources[newRow['#source'].toLowerCase()]) { //Must be here due to lookups in sheet
            company.company_established_source = sources[newRow['#source'].toLowerCase()]._id;
        }
        else return false; //error
    }
    else return false; //Require source

    if (newRow['#group'] !== "") {
        returnObj.link = {company_group: company_groups[newRow['#group'].toLowerCase()]._id, source: sources[newRow['#source'].toLowerCase()]._id};
    }

    returnObj.obj = company;
    return returnObj;
};

var makeNewProject = function(newRow) {
    if (sources[newRow['#source'].toLowerCase()] === -1) return false;

    var project = {
        $set: {
            proj_name: newRow['#project'],
            proj_established_source: sources[newRow['#source'].toLowerCase()]._id
        },
        $addToSet: {
            proj_commodity: {$each: []},
            proj_aliases:   {$each: []},
            proj_status:    {$each: []},
            proj_country:   {$each: []}
        }
    };
    
    return project;
};

var makeNewProduction = function(newRow) {
    var production = {
        production_commodity: commodities[newRow['#production+commodity']]._id,
        production_year: parseInt(newRow['#production+year']),
        country: countries[newRow['#country+identifier']]._id,
        source: sources[newRow['#source'].toLowerCase()]._id
    };
    
    if (newRow['#production+unit'] !== "") {
        production.production_unit = newRow['#production+unit'];
    }
    if (newRow['#production+volume'] !== "") {
        production.production_volume = newRow['#production+volume'].replace(/,/g, "");
    }
    if (newRow['#production+price'] !== "") {
        production.production_price = newRow['#production+price'].replace(/,/g, "");
    }
    if (newRow['#production+priceUnit'] !== "") {
        production.production_price_unit = newRow['#production+priceUnit'];
    }
    if (newRow['#production+notes'] !== "") {
        production.production_note = newRow['#production+notes'];
    }
    
    production = fillInGenericFields(newRow, production, "production");
    if (!production) return false;

    return production;
};

function fillInGenericFields(newRow, object, name) {
    var dbName = name;
    if (name === 'payment') dbName = 'transfer';
    
    switch(newRow['#' + name + '+entity+type'].toLowerCase()) {
        case "":
        case "unknown":
            if (newRow['#' + name + '+entity+name'] !== "") { //Entity names without entity type: default is project
                //But it can also not be a project
                if (projects[newRow['#' + name + '+entity+name'].toLowerCase()]) {
                    object[dbName + '_level'] = "project";
                    object.project = projects[newRow['#' + name + '+entity+name'].toLowerCase()]._id;
                }
                else {
                    object[dbName + '_level'] = "unknown";
                    //Store the text
                    object[dbName + '_label'] = newRow['#' + name + '+entity+name'];
                }
            }
            else if (newRow['#company'] !== "") object[dbName + '_level'] = "company"; //Implied company level. Company filled elsewhere.
            //Otherwise we only have country to go on. Country must be present. Country filled elsewhere.
            else object[dbName + '_level'] = "country";
            break;
        case "project":
            if (!projects[newRow['#' + name + '+entity+name'].toLowerCase()]) return false;
            object[dbName + '_level']= "project";
            object.project = projects[newRow['#' + name + '+entity+name'].toLowerCase()]._id;
            break;
        case "concession":
            if (!concessions[newRow['#' + name + '+entity+name'].toLowerCase()]) return false;
            object[dbName + '_level'] = "concession";
            object.concession = concessions[newRow['#' + name + '+entity+name'].toLowerCase()]._id;
            break;
        case "site":
        case "field":
            object[dbName + '_level'] = newRow['#' + name + '+entity+type'].toLowerCase();
            object.site = sites[newRow['#' + name + '+entity+name'].toLowerCase()]._id;
            break;
        case "company":
            object[dbName + '_level'] = "company"; //Explicit company level. Value will be taken from company column elsewhere, but store text if present.
            if (newRow['#' + name + '+entity+name'] !== "") object[dbName + '_label'] = newRow['#' + name + '+entity+name'];
            break;
        case "country":
            object[dbName + '_level'] = "country"; //Explicit country level. Value will be taken from company column elsewhere, but store text if present.
            if (newRow['#' + name + '+entity+name'] !== "") object[dbName + '_label'] = newRow['#' + name + '+entity+name'];
            break;
        default:
            return false; //Unsupported input!
    }
    return object;
}

var makeNewTransfer = function(newRow) {
    
    var transfer = {
        source: sources[newRow['#source'].toLowerCase()]._id,
        country: countries[newRow['#country+identifier']]._id,
    };
    
    var warning = null;
    var error = null;
    
    if (newRow['#payment-category'].toLowerCase() == "receipt") {
        transfer.transfer_audit_type = "government_receipt";
    }  
    else if (newRow['#payment-category'].toLowerCase() == "payment") {
        transfer.transfer_audit_type = "company_payment";
    }
    else if (newRow['#payment-category'].toLowerCase() == "total") {
        transfer.transfer_audit_type = "reconciled";
    }
    else if (newRow['#payment-category'].toLowerCase() == "unknown") {
        transfer.transfer_audit_type = "unknown";
    }
    else return false;

    if (newRow['#company'] !== "") {
        transfer.company = companies[newRow['#company'].toLowerCase()]._id;
    }
    
    transfer = fillInGenericFields(newRow, transfer, "payment");
    if (!transfer) return false;

    transfer.transfer_year = parseInt(newRow['#payment+year']);
    
    if (transfer_type_code_parts.length !== 2) {
        //Require this field and require that it's well formatted into class/type
        error = "ERROR for payment: payment type code is not formatted correctly (class/type)";
        return {transfer: null, warning: null, error: error};
    }
    
    transfer.transfer_type_classification = transfer_type_code_parts[0];
    
	//We validate for this classification scheme
	if (transfer_type_code_parts[0] === "eurd") {
        //Check and convert types
        switch (transfer_type_code_parts[1]) {
            case "tax":
                transfer.transfer_type = "Tax";
                break;
            case "license":
                transfer.transfer_type = "Fees";
                break;
            case "dividend":
                transfer.transfer_type = "Dividends";
                break;
            case "royalty":
                transfer.transfer_type = "Royalties";
                break;
            case "bonus":
                transfer.transfer_type = "Bonuses";
                break;
            case "entitlement":
                transfer.transfer_type = "Production Entitlements";
                break;
            case "infrastructure":
                transfer.transfer_type = "Infrastructure";
                break;
            case "other":
                transfer.transfer_type = "Other";
                break;
            case "total":
                transfer.transfer_type = "Total";
                break;
            default:
                error = "ERROR for payment: invalid payment type (in payment type column). Should be one of (eurd/) + tax, license, dividend, royalty, bonus, entitlement, infrastructure, other or total";
                return {transfer: null, warning: null, error: error};
        }
    }
    else {
        warning = "WARNING: A classification system for payment types for which we have no validation is in use; Proper Case values will be imported directly without validation";
        transfer.transfer_type = transfer_type_code_parts[1].toProperCase();
    }

    transfer.transfer_unit = newRow['#payment+currency'];
    transfer.transfer_value = newRow['#payment+value'].replace(/,/g, "");
    if (newRow['#payment+governmentParty'] !== "") transfer.transfer_gov_entity = newRow['#payment+governmentParty'];
    if (newRow['#payment+governmentParty+identifier'] !== "") transfer.transfer_gov_entity_id = newRow['#payment+governmentParty+identifier'];
    if (newRow['#payment+basisOfAccounting'] !== "") transfer.transfer_accounting_basis = newRow['#payment+basisOfAccounting'];
    if (newRow['#payment+notes'] !== "") transfer.transfer_note = newRow['#payment+notes'];

    return {transfer: transfer, warning: warning, error: null};
};

//This handles companies and company groups
//Note the maker function returns an object with a sub-object
processCompanyRow = function(companiesReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
    if (row[rowIndex] === "") {
        companiesReport.add("Row empty. Skipping.\n");
        return callback(null);
    }
    var prefix = "company";
    if (entityName === "CompanyGroup") prefix = "company_group";
    //Check against name and aliases
    var queryEntry1 = {};
    queryEntry1[modelKey] = row[rowIndex];
    var queryEntry2 = {};
    queryEntry2[prefix+'_aliases.alias'] = row[rowIndex];

    model.findOne(
        {$or: [
            queryEntry1,
            queryEntry2
        ]},
        function(err, doc) {
            var testAndCreateLink = function(skipTest, link, company_id) {
                link.company = company_id;
                var createLink = function() {
                    link.entities = ['company', 'company_group'];
                    Link.create(link, function(err, nlmodel) {
                        if (err) {
                            companiesReport.add(`Encountered an error (${err}) adding link to DB. Aborting.\n`);
                            return callback(`Failed: ${companiesReport.report}`);
                        }
                        else {
                            createdOrAffectedEntities[nlmodel._id] = {entity: 'link', obj: nlmodel._id};
                            companiesReport.add(`Created link\n`);
                            return callback(null);
                        }
                    });
                };
                if (!skipTest) {
                    Link.findOne(
                        link,
                        function (err, lmodel) {
                            if (err) {
                                companiesReport.add(`Encountered an error (${err}) while querying DB. Aborting.\n`);
                                return callback(`Failed: ${companiesReport.report}`);
                            }
                            else if (lmodel) {
                                createdOrAffectedEntities[lmodel._id] = {entity: 'link', obj: lmodel._id};
                                companiesReport.add(`Link already exists in the DB, not adding\n`);
                                return callback(null);
                            }
                            else {
                                createLink();
                            }
                        }
                    );
                }
                else createLink();
            };
            if (err) {
                companiesReport.add(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                return callback(`Failed: ${companiesReport.report}`);
            }
            else if (doc) {
                createdOrAffectedEntities[doc._id] = {entity: prefix, obj: doc._id};
                destObj[row[rowIndex].toLowerCase()] = doc;
                //Also index by aliases
                var alias;
                
                for (alias of doc[prefix+'_aliases']) {
                    destObj[alias.alias.toLowerCase()] = doc;
                }
                companiesReport.add(`${entityName} ${row[rowIndex]} already exists in the DB (name or alias match), not adding. Checking for link creation need.\n`);
                var testObj = makerFunction(row);
                if (testObj && testObj.link) {
                    testAndCreateLink(false, testObj.link, doc._id);
                }
                else {
                    companiesReport.add(`No link to make\n`);
                    return callback(null);
                }
            }
            else {
                var newObj = makerFunction(row);
                if (!newObj) {
                    companiesReport.add(`Invalid data in row: ${util.inspect(row)}. Aborting.\n`);
                    return callback(`Failed: ${companiesReport.report}`);
                }
                model.create(
                    newObj.obj,
                    function(err, cmodel) {
                        if (err) {
                            companiesReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                            return callback(`Failed: ${companiesReport.report}`);
                        }
                        createdOrAffectedEntities[cmodel._id] = {entity: prefix, obj: cmodel._id};
                        companiesReport.add(`Added ${entityName} ${row[rowIndex]} to the DB.\n`);
                        destObj[row[rowIndex].toLowerCase()] = cmodel;
                        if (newObj.link) {
                            testAndCreateLink(true, newObj.link, cmodel._id);
                        }
                        else return callback(null);
                    }
                );
            }
        }
    );
};

function parseData(sheets, report, finalcallback) {
    async.waterfall([
            parseSourceTypes.bind(null, report),
            parseSources,
            parseCountries,
            parseCommodities,
            parseCompanyGroups,
            parseCompanies,
            parseProjects,
            parseProjectSitesAndCompaniesAndConcessionsAndContracts, 
            parseProduction,
            parseTransfers,
            parseReserves
        ], function (err, report) {
            if (err) {
                console.log("PARSE: Got an error\n");
                return finalcallback("Failed", report.report, createdOrAffectedEntities);
            }
            finalcallback("Success", report.report, createdOrAffectedEntities);
        }
    );

    function parseEntity(reportSoFar, sheetname, entityObj, processRow, entityName, rowIndex, model, modelKey, rowMaker, callback) {
        //Drop first X, last Y rows
        var data = sheets[sheetname].data;
        //TODO: for some cases parallel is OK: differentiate
        async.eachSeries(data, processRow.bind(null, reportSoFar, entityObj, entityName, rowIndex, model, modelKey, rowMaker), function (err) { //"A callback which is called when all iteratee functions have finished, or an error occurs."
            if (err) {
                return callback(err, reportSoFar); //Giving up
            }
            callback(null, reportSoFar); //All good
        });
    }

    function parseSourceTypes(result, callback) {
        //Complete source type list is in the DB
        result.add("Getting source types from database...\n");
        sourceTypes = {};
        SourceType.find({}, function (err, stresult) {
            if (err) {
                result.add(`Got an error: ${err}\n`);
                callback(err);
            }
            else {
                result.add(`Found ${stresult.length} source types\n`);
                var st;
                for (st of stresult) {
                    sourceTypes[st.source_type_name] = st;
                }
                callback(null, result);
            }
        });
    }

    function parseCountries(result, callback) {
        //Complete country list is in the DB
        result.add("Getting countries from database...\n");
        countries = {};
        countriesById = {};
        Country.find({}, function (err, cresult) {
            if (err) {
                result.add(`Got an error: ${err}\n`);
                callback(err);
            }
            else {
                result.add(`Found ${cresult.length} countries\n`);
                var ctry;
                for (ctry of cresult) {
                    countries[ctry.iso2] = ctry;
                    countriesById[ctry._id] = ctry;
                }
                callback(null, result);
            }
        });
    }

    function parseCommodities(result, callback) {
        //Complete commodity list is in the DB
        result.add("Getting commodities from database...\n");
        commodities = {};
        commoditiesById = {};
        Commodity.find({}, function (err, cresult) {
            if (err) {
                result.add(`Got an error: ${err}\n`);
                callback(err);
            }
            else {
                result.add(`Found ${cresult.length} commodities\n`);
                var cmty;
                for (cmty of cresult) {
                    commodities[cmty.commodity_name] = cmty;
                    //Also index by alias
                    var alias;
                    for (alias of cmty.commodity_aliases) {
                        commodities[alias.alias.toLowerCase()] = cmty;
                    }
                    commoditiesById[cmty._id] = cmty;
                }
                callback(null, result);
            }
        });
    }

    function parseSources(result, callback) {
        var processSourceRow = function(sourcesReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
            if (row['#source'] === "") {
                sourcesReport.add("Sources: source name cannot be empty. Aborting.\n");
                return callback(`Failed: ${sourcesReport.report}`);
            }
            Source.findOne(
                {source_url: row['#source+url'].toLowerCase()},
                null, //return everything
                {},
                function(err, doc) {
                    if (err) {
                        sourcesReport.add(`Encountered an error while querying the DB: ${err}. Aborting.\n`);
                        return callback(`Failed: ${sourcesReport.report}`);
                    }
                    else if (doc) {
                        createdOrAffectedEntities[doc._id] = {entity: 'source', obj: doc._id};
                        sourcesReport.add(`Source ${row['#source']} already exists in the DB (url match), not adding\n`);
                        sources[row['#source'].toLowerCase()] = doc;
                        return callback(null);
                    }
                    else {
                        var newSource = makeNewSource(row);
                        if (!newSource) {
                            sourcesReport.add(`Invalid data in row: ${util.inspect(row)}. Aborting.\n`);
                            return callback(`Failed: ${sourcesReport.report}`);
                        }
                        Source.create(
                            newSource,
                            (function(err, model) {
                                if (err) {
                                    sourcesReport.add(`Encountered an error while creating a source in the DB: ${err}. Aborting.\n`);
                                    return callback(`Failed: ${sourcesReport.report}`);
                                }
                                sourcesReport.add(`Added source ${row['#source']} to the DB.\n`);
                                createdOrAffectedEntities[model._id] = {entity: 'source', obj: model._id};
                                sources[row['#source'].toLowerCase()] = model;
                                return callback(null);
                            })
                        );
                    }
                }
            );
        };
        sources = {};
        parseEntity(result, '2', sources, processSourceRow, "Source", 0, Source, "source_name", makeNewSource, callback);
    }

    function parseCompanyGroups(result, callback) {
        company_groups = {};
        parseEntity(result, '4', company_groups, processCompanyRow, "CompanyGroup", '#group', CompanyGroup, "company_group_name", makeNewCompanyGroup, callback);
    }

    function parseCompanies(result, callback) {
        companies = {};
        parseEntity(result, '4', companies, processCompanyRow, "Company", '#company', Company, "company_name", makeNewCompany, callback);
    }

    function parseProjects(result, callback) {
        function processProjectRow(projectsReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
            function updateOrCreateProject(projDoc, currentDoc, countryId, projId, wcallback) {
                if (!projDoc) {
                    projDoc = makeNewProject(row); //This can sit alongside the existing proj from db for now. Merging happens later.
                    
                    if (!projDoc) {
                        projectsReport.add(`Invalid data in row: ${util.inspect(row)}. Aborting.\n`);
                        return wcallback(`Failed: ${projectsReport.report}`);
                    }
                }
                if (projId) projDoc.proj_id = projId; 
                projDoc.$addToSet.proj_country.$each.push({source: sources[row['#source'].toLowerCase()]._id, country: countryId, timestamp: currentTime});
                if (row['#project+alias'] !== "") projDoc.$addToSet.proj_aliases.$each.push({alias: row['#project+alias'], source: sources[row['#source'].toLowerCase()]._id, timestamp: currentTime});
                if (row['#commodity'] !== "") projDoc.$addToSet.proj_commodity.$each.push({commodity: commodities[row['#commodity']]._id, source: sources[row['#source'].toLowerCase()]._id, timestamp: currentTime});
                
                if (row['#status+statusType'] !== "") {
                    var status = row['#status+statusType'];
                    
                    if (row['#status+statusType'].indexOf('/') != -1) {
                        status = row['#status+statusType'].split('/')[1]; //Workaround to cope with "construction/development"
                    }

                    var proj_status = {
                        string: status.toLowerCase().replace(/ /g, '_'),
                        source: sources[row['#source'].toLowerCase()]._id
                    };
                    if (row['#status+trueAt'] !== "") {
                        proj_status.timestamp = parseGsDate(row['#status+trueAt']);
                    }
                    if (row['#status+startDate'] !== "") {
                        proj_status.startTimestamp = parseGsDate(row['#status+startDate']);
                    }
                    if (row['#status+endDate'] !== "") {
                        proj_status.endTimestamp = parseGsDate(row['#status+endDate']);
                    }
                    projDoc.$addToSet.proj_status.$each.push(proj_status);
                }
                
                if (currentDoc) projDoc._id = currentDoc._id; //Crucial as we use findByIdAndUpdate later to do the upsert/merge. WIll be removed from doc before updating.
                
                destObj[row['#project'].toLowerCase()] = projDoc; //Can also serve as update to internal list
                //TODO: don't overwrite project name with an alias!!!

                return wcallback(null);  //Signal this one done without error
            }

            if (row['#project'] === "") {
                projectsReport.add('Empty project name in row. Skipping.\n');
                return callback(null);
            }
            
            if (row['#project'] === "") {
                projectsReport.add('Empty project name in row. Skipping.\n');
                return callback(null);
            }
            var countryRow, countryId;
            var projQuery = {};
            var projId = null;
            
            
            try {
                //First get country
                countryRow = _.findWhere(sheets['1'].data, {"#project": row['#project']}); //Find data in sheet 1
                countryId = countries[countryRow['#country+identifier']]._id;
                //Then search based on project name and country
                projRow = _.findWhere(projIds, {"projName": row['#project'], "projCountry": countryRow['#country+identifier']}); //Find data in list of existing proj. IDs read in from Google Sheets
                if (projRow) {
                    projId = projRow['projId'];
                    console.log("Found an existing project ID for " + row['#project'] + ": " + projId);
                }
                
                var projQueryBase = {
                                    $or:
                                        [
                                            {
                                                "proj_name":  { $regex : new RegExp(row[rowIndex], "i") } //case insensitive... companies house!
                                            },
                                            {
                                                "proj_aliases.alias": { $regex : new RegExp(row[rowIndex], "i") }
                                            }
                                        ],
                                    "proj_country.country": countryId
                                };
                
                
                if (projId) {
                    console.log("Got a project ID: " + projId);
                    projQuery = {
                                    $or:
                                        [
                                            {"proj_id": projId},
                                            projQueryBase
                                        ]
                                };
                }
                else {
                    console.log("Did not got a project ID for project " + row['#project']);
                    projQuery = projQueryBase;
                }
            }
            catch (error) {
                projectsReport.add(`Invalid data in referenced sheet 1: \n${util.inspect(countryRow)} referenced from row \n${util.inspect(row)}. Aborting.\n`);
                return callback(`Failed: ${projectsReport.report}`);
            }
            //Look for project in DB. This only happens if not in internal list.
            if (!_.findWhere(destObj, {proj_name: row['#project'].toLowerCase()})) { //If not yet in internal list (i.e. contained in this workbook)
                //Projects - check against name and aliases
                //TODO: read sheet 1 in properly as the following is inefficient
                
                Project.findOne(projQuery,
                    function(err, doc) {
                        if (err) {
                            projectsReport.add(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                            return callback(`Failed: ${projectsReport.report}`);
                        }
                        else if (doc) { //Project already exists,
                            console.log("Project already exists");// under query: " + util.inspect(projQuery, {depth: 8}));
                            projectsReport.add(`Project ${row[rowIndex]} already exists in the DB (name or alias match), using\n`);
                            updateOrCreateProject(null, doc, countryId, projId, callback); //NO existing project internally
                        }
                        else {
                            console.log("Project does not exist");// under query: " + util.inspect(projQuery, {depth: 8}));
                            projectsReport.add(`Project ${row[rowIndex]} not found in DB. It will be added later.\n`);
                            updateOrCreateProject(null, null, countryId, projId, callback); //NO existing project internally, NO project in DB
                        }
                    }
                );
            }
            else {
                updateOrCreateProject(destObj[row['#project'].toLowerCase()], null, countryId, callback); //Existing project internally, may or may not exist in the DB
            }
            
        }
        
        function saveAllProjectsWhenDone (err, reportSoFar) {
            if (err) {
                callback(err, reportSoFar);
            }
            else {
                var projectNames = Object.getOwnPropertyNames(projects);
                async.eachSeries(projectNames, //TODO: each parallel???
                    function (project, ecallback) {
                        var idToUpdateOrCreate = require('mongoose').Types.ObjectId(); //Generate a new ID if we don't have one
                        if (projects[project]._id) {
                            idToUpdateOrCreate = projects[project]._id;
                            delete projects[project]._id; //Don't try to update _id
                        }
                        if (projects[project].__v) delete projects[project].__v; //Don't send __v back in to Mongo: https://github.com/Automattic/mongoose/issues/1933
                        Project.findByIdAndUpdate(
                            idToUpdateOrCreate,
                            projects[project],
                            {upsert: true, 'new': true},
                            function(err, pmodel) {
                                
                                if (err) {
                                    reportSoFar.add(`Encountered an error (${util.inspect(err)}) while saving project to the DB. Aborting.\n`);
                                    return ecallback(err);
                                }
                                
                                createdOrAffectedEntities[pmodel._id] = {entity: 'project', obj: pmodel._id, newProjId: null};
                                
                                projects[project] = pmodel; //Internal update switching from update format to saved format. Also gets us _id "back"
                                
                                if (!pmodel.proj_id) {
                                    var newProjId = countriesById[pmodel.proj_country[0].country].iso2.toLowerCase() + '-' + pmodel.proj_name.toLowerCase().slice(0, 4) + '-' + randomstring(6).toLowerCase();
                                    console.log("After creation or update, project " + pmodel.proj_name + "did not have an ID: creating one now and updating");
                                    Project.update({_id: pmodel._id}, {proj_id: newProjId}, {},
                                        function(err) {
                                            if (err) {
                                                projectsReport.add(`Encountered an error while setting the project ID DB: ${err}. Aborting.\n`);
                                                return ecallback(err);
                                            }
                                            //Abuse this object to feedback a mapping of new IDs to names
                                            createdOrAffectedEntities[pmodel._id].newProjId = newProjId;
                                            createdOrAffectedEntities[pmodel._id].projName = pmodel.proj_name;
                                            //This is not efficient, but remember it only happens very occasionally in the long run
                                            //TODO: Use proper read in of projects sheet if that gets done
                                            var projRowIndex = _.findIndex(sheets['1'].data, function (item) {if (item["#project"] === pmodel.proj_name) return true;});
                                            console.log("Found project at row " + projRowIndex);
                                            createdOrAffectedEntities[pmodel._id].rowNum = projRowIndex;
                                            reportSoFar.add('Created or updated project ' + projects[project].proj_name + ' in the DB.\n');
                                            
                                            return ecallback(null);
                                        }
                                    );
                                }
                                else {
                                    reportSoFar.add('Created or updated project ' + projects[project].proj_name + ' in the DB.\n');
                                    return ecallback(null);
                                }
                            }
                        );
                    },
                    function (err) {
                        if (err) return callback(err, reportSoFar);
                        else return callback(null, reportSoFar);
                    }
                );
            }
        }
        
        projects = {};
        
        parseEntity(result, '3', projects, processProjectRow, "Project", '#project', Project, "proj_name", makeNewProject, saveAllProjectsWhenDone);
    }

    function parseProjectSitesAndCompaniesAndConcessionsAndContracts(result, callback) {
        var processCandCRow = function(candcReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
            if (row['#source'] === "") {
                candcReport.add("C/C/C/S Sheet: Empty row or label.\n");
                return callback(null); //Do nothing
            }
            if (!sources[row['#source'].toLowerCase()] ) {
                candcReport.add(`Invalid source in row: ${util.inspect(row)}. Aborting.\n`);
                return callback(`Failed: ${candcReport.report}`);
            }
            
            async.waterfall(
                [
                    /* Project in row */
                    function (wcallback) {
                        //Quick check for project
                        if (row['#project'] !== "") {
                            if (projects[row['#project'].toLowerCase()]) return wcallback(null, projects[row['#project'].toLowerCase()]);
                            else {
                                return wcallback(`C/C/C/S Sheet project is invalid (row: ${util.inspect(row)}). Aborting.\n`);
                            }
                        }
                        else {
                            candcReport.add("C/C/C/S Sheet: No project in row.\n");
                            return wcallback(null, null); //No project is OK
                        }
                    },
                    /* Company in row */
                    function (project, wcallback) {
                        //Quick check for company
                        if (row['#project+company'] !== "") {
                            if (companies[row['#project+company'].toLowerCase()]) {
                                //Update company countries of operation
                                if (row['#project+site+country+identifier'] !== "") {
                                    Company.findOneAndUpdate(
                                        companies[row['#project+company'].toLowerCase()]._id,
                                        {
                                            $addToSet: {
                                                countries_of_operation: {country: countries[row['#project+site+country+identifier']]._id, source: sources[row['#source'].toLowerCase()]._id, timestamp: currentTime}
                                            }
                                        },
                                        {'new': true}, //Return updated model
                                        function (err, cmodel) {
                                            if (err) return wcallback(err);
                                            else {
                                                createdOrAffectedEntities[cmodel._id] = {entity: 'company', obj: cmodel._id};
                                                companies[row['#project+company'].toLowerCase()] = cmodel;
                                                return wcallback(null, project, companies[row['#project+company'].toLowerCase()]);
                                            }
                                        }
                                    );
                                }
                                else return wcallback(null, project, companies[row['#project+company'].toLowerCase()]);
                            }
                            else {
                                return wcallback(`C/C/C/S Sheet company is invalid (row: ${util.inspect(row)}). Aborting.\n`);
                            }
                        }
                        else {
                            candcReport.add("C/C/C/S Sheet: No company in row.\n");
                            return wcallback(null, project, null); //No company is OK
                        }
                    },
                    /* Contract in row */
                    function (project, company, wcallback) {
                        //Check for existing contract, if doesn't exist, create
                         if ((row['#contract'] !== "") || (row['#contract+uri'] !== "") || (row['#contract+rcId'] !== "") || (row['#contract+ooId'] !== "")) {
                            var query = [];
                            var contract_obj = {};
                            var contract_describer = "";
                            if (row['#contract'] !== "") { query.push({contract_title: row['#contract']}); contract_obj.contract_title = row['#contract']; contract_describer += (contract_obj.contract_title + "/"); }
                            if (row['#contract+rcId'] !== "") { query.push({contract_title: row['#contract+rcId']}); contract_obj.contract_id = row['#contract']; contract_describer += (contract_obj.contract_id + "/"); }
                            if (row['#contract+ooId'] !== "") { query.push({contract_title: row['#contract+ooId']}); contract_obj.oo_contract_id= row['#contract']; contract_describer += (contract_obj.oo_contract_id + "/"); }
                            if (row['#contract+uri'] !== "") { query.push({contract_title: row['#contract+uri']}); contract_obj.contract_url = row['#contract']; contract_describer += (contract_obj.contract_url + "/"); }
                            contract_describer = contract_describer.slice(0,-1);
                            Contract.findOne({
                                    $or: query
                                },
                                function(err, doc) {
                                    if (err) {
                                        return wcallback(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                                    }
                                    else if (doc) { //Found contract, but no clear reference to archive by. For inter-sheet lookups use title if present, but pass it along for this row only.
                                        createdOrAffectedEntities[doc._id] = {entity: 'contract', obj: doc._id};
                                        if (row['#contract'] !== "") contracts[row['#contract'].toLowerCase] = doc;
                                        candcReport.add(`Contract ${contract_describer} exists\n`);
                                        return wcallback(null, project, company, doc);
                                    }
                                    else { //No contract, create
                                        Contract.create(
                                            contract_obj,
                                            function(err, cmodel) {
                                                if (err) {
                                                    return wcallback(err);
                                                }
                                                createdOrAffectedEntities[cmodel._id] = {entity: 'contract', obj: cmodel._id};
                                                if (row['#contract'] !== "") contracts[row['#contract']] = cmodel;
                                                candcReport.add(`Created a contract (${contract_describer})\n`);
                                                return wcallback(null, project, company, cmodel);
                                            }
                                        );
                                    }
                                }
                            );
                        }
                        else {
                            candcReport.add("No contract found in row\n");
                            return wcallback(null, project, company, null);
                        }
                    },
                    /* Concession in row */
                    function (project, company, contract, wcallback) {
                        //Check for existing concession, if doesn't exist, create
                        if (row['#project+concession'] !== "") {
                            var setstuff = {
                                concession_name: row['#project+concession'],
                                concession_established_source: sources[row['#source'].toLowerCase()]._id
                            };
                            
                            var addtostuff = {};
                            
                            if (row['#project+concession+country+identifier'] !== "") {
                                addtostuff.concession_country = {country: countries[row['#project+concession+country+identifier']]._id, source: sources[row['#source'].toLowerCase()]._id, timestamp: currentTime};
                            }
                            if ((row['#project+company'] !== "") && (row['#project+company+isOperator'] === "TRUE")) { //TODO review stringency
                                addtostuff.concession_operated_by = {company: companies[row['#project+company'].toLowerCase()]._id, source: sources[row['#source'].toLowerCase()]._id, timestamp: currentTime};
                            }
                            if (row['#project+company+share'] !== "") {
                                var share = parseInt(row['#project+company+share'].replace("%", ""))/100.0;
                                addtostuff.concession_company_share = {company: companies[row['#project+company'].toLowerCase()]._id, number: share, source: sources[row['#source'].toLowerCase()]._id, timestamp: currentTime};
                            }
                            //N.B. Can't use findOneAndUpdate (yet): https://jira.mongodb.org/browse/SERVER-13843
                            Concession.findOne(
                                {
                                    $or: [
                                        {concession_name: row['#project+concession']},
                                        {"concession_aliases.alias": row['#project+concession']} //TODO: Could lead to replacing a concession with a new name by alias and losing the name
                                    ],
                                    "concession_country.country": countries[row['#project+concession+country+identifier']]._id
                                },
                                function (err, found) {
                                    if (err) {
                                        wcallback(err);
                                    }
                                    var id = require('mongoose').Types.ObjectId(); //Generate a new ID if we don't have one
                                    if (found) id = found._id;
                                    Concession.findByIdAndUpdate(
                                        id,
                                        {
                                            $set: setstuff,
                                            $addToSet: addtostuff
                                        },
                                        {upsert: true, 'new': true},
                                        function(err, doc) {
                                            if (err) {
                                                wcallback(err);
                                            }
                                            else  {
                                                createdOrAffectedEntities[doc._id] = {entity: 'concession', obj: doc._id};
                                                concessions[row['#project+concession'].toLowerCase()] = doc;
                                                candcReport.add("Found and updated concession\n"); //TODO include name
                                                return wcallback(null, project, company, contract, doc);
                                            }
                                        }
                                    );
                                }
                            );
                        }
                        else {
                            candcReport.add("No concession found in row\n");
                            return wcallback(null, project, company, contract, null);
                        }
                    },
                    function (project, company, contract, concession, wcallback) {
                        //Check for existing site, if doesn't exist, create
                        var identifier = null;
                        if (row['#project+site'] !== "") {
                            identifier = "site";
                        }
                        else if (row['#project+field'] !== "") {
                            identifier = "field";
                        }
                        else return wcallback(null, project, company, contract, concession, null);
                        
                        var setstuff = {
                            site_name: row['#project+' + identifier],
                            site_established_source: sources[row['#source'].toLowerCase()]._id
                        };
                        
                        if (identifier === "field") setstuff.field = true;
                        else setstuff.field = false;
                        
                        var addtostuff = {};
                        
                        addtostuff.site_country = {country: countries[row['#project+' + identifier + '+country+identifier']]._id, source: sources[row['#source'].toLowerCase()]._id};
                        
                        if (row['#project+' + identifier + '+address'] !== "") addtostuff.site_address = {string: row['#project+' + identifier + '+address'], source: sources[row['#source'].toLowerCase()]._id, timestamp: currentTime};
                        if (row['#project+' + identifier + '+lat'] !== "") addtostuff.site_coordinates = {loc: [parseFloat(row['#project+' + identifier + '+lat']), parseFloat(row['#project+' + identifier + '+long'])], source: sources[row['#source'].toLowerCase()]._id, timestamp: currentTime};
                        
                        if ((row['#project+company'] !== "") && (row['#project+company+isOperator'] === "TRUE")) { //TODO review stringency
                            addtostuff.site_operated_by = {company: companies[row['#project+company'].toLowerCase()]._id, source: sources[row['#source'].toLowerCase()]._id, timestamp: currentTime};
                        }
                        
                        if (row['#project+company+share'] !== "") {
                            var share = parseInt(row['#project+company+share'].replace("%", ""))/100.0;
                            addtostuff.site_company_share = {company: companies[row['#project+company'].toLowerCase()]._id, number: share, source: sources[row['#source'].toLowerCase()]._id, timestamp: currentTime};
                        }    

                        //Same workaround broken findOneAndUpdate as with concessions
                        Site.findOne(
                             {
                                 $or: [
                                     {site_name: row['#project+' + identifier]},
                                     {"site_aliases.alias": row['#project+' + identifier]} //TODO: Could lead to replacing a site with a new name by alias and losing the name
                                 ],
                                 "site_country.country": countries[row['#project+' + identifier + '+country+identifier']]._id
                             },
                             function (err, found) {
                                 if (err) {
                                     console.log(err);
                                     return wcallback(err);
                                 }
                                 var id = require('mongoose').Types.ObjectId(); //Generate a new ID if we don't have one
                                 if (found) id = found._id;
                                 Site.findByIdAndUpdate(
                                    id,  
                                    {
                                        $set: setstuff,
                                        $addToSet: addtostuff
                                    },
                                    {upsert: true, 'new': true},
                                    function(err, doc) {
                                        if (err) {
                                            console.log(err);
                                            return wcallback(err);
                                        }
                                        else  {
                                            createdOrAffectedEntities[doc._id] = {entity: 'site', obj: doc._id};
                                            sites[row['#project+' + identifier].toLowerCase()] = doc;
                                            candcReport.add("Found and updated site\n"); //TODO include name
                                            return wcallback(null, project, company, contract, concession, doc);
                                        }
                                    }
                                );
                             }
                         );
                        
                    },
                    function (project, company, contract, concession, site, wcallback) {
                        function makeLink (llink, lcallback) {
                            Link.findOneAndUpdate( //Create if doesn't already exist
                                llink,
                                llink,
                                {upsert: true, 'new': true},
                                function (err, doc) {
                                    if (err) {
                                        candcReport.add("Error creating link\n"); //TODO include name
                                        lcallback(err);
                                    }
                                    else {
                                        createdOrAffectedEntities[doc._id] = {entity: 'link', obj: doc._id};
                                        candcReport.add("Linked " + llink.entities[0] + " with " + llink.entities[1] + "\n"); //TODO include name
                                        lcallback(null);
                                    }
                                }
                            );
                        }
                        
                        async.series([ //TODO: change to parallel
                            /* Link project with company */
                            function(scallback) {
                                if (project && company) {
                                    var link = {
                                        source: sources[row['#source'].toLowerCase()]._id,
                                        project: project._id,
                                        company: company._id,
                                        entities: ['project', 'company']
                                    };
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link project with contract */
                            function(scallback) {
                                if (project && contract) {
                                    var link = {
                                        source: sources[row['#source'].toLowerCase()]._id,
                                        project: project._id,
                                        contract: contract._id,
                                        entities: ['project', 'contract']
                                    };
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link project with concession */
                            function(scallback) {
                                if (project && concession) {
                                    var link = {
                                        source: sources[row['#source'].toLowerCase()]._id,
                                        project: project._id,
                                        concession: concession._id,
                                        entities: ['project', 'concession']
                                    };
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link project with site */
                            function(scallback) {
                                if (project && site) {
                                    var link = {
                                        source: sources[row['#source'].toLowerCase()]._id,
                                        project: project._id,
                                        site: site._id,
                                        entities: ['project', 'site']
                                    };
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link company with contract */
                            function(scallback) {
                                if (company && contract) {
                                    var link = {
                                        source: sources[row['#source'].toLowerCase()]._id,
                                        company: company._id,
                                        contract: contract._id,
                                        entities: ['company', 'contract']
                                    };
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link company with concession */
                            function(scallback) {
                                if (company && concession) {
                                    var link = {
                                        source: sources[row['#source'].toLowerCase()]._id,
                                        company: company._id,
                                        concession: concession._id,
                                        entities: ['company', 'concession']
                                    };
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link company with site */
                            function(scallback) {
                                if (company && site) {
                                    var link = {
                                        source: sources[row['#source'].toLowerCase()]._id,
                                        company: company._id,
                                        site: site._id,
                                        entities: ['company', 'site']
                                    };
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link contract with concession */
                            function(scallback) {
                                if (contract && concession) {
                                    var link = {
                                        source: sources[row['#source'].toLowerCase()]._id,
                                        contract: contract._id,
                                        concession: concession._id,
                                        entities: ['contract', 'concession']
                                    };
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link contract with site */
                            function(scallback) {
                                if (contract && site) {
                                    var link = {
                                        source: sources[row['#source'].toLowerCase()]._id,
                                        contract: contract._id,
                                        site: site._id,
                                        entities: ['contract', 'site']
                                    };
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link concession with site */
                            function(scallback) {
                                if (concession && site) {
                                    var link = {
                                        source: sources[row['#source'].toLowerCase()]._id,
                                        concession: concession._id,
                                        site: site._id,
                                        entities: ['concession', 'site']
                                    };
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            }    
                        ],
                        function (err) {
                            if (err) return wcallback(err);
                            else return wcallback(null);
                        }
                        );
                    }
                ],
                function (err) {
                    if (err) {
                        candcReport.add(err);
                        return callback(`Failed: ${candcReport.report}`);
                    }
                    else {
                        return callback(null);
                    }
                }
            );
        };
        contracts = {};
        concessions = {};
        sites = {};
        parseEntity(result, '5', null, processCandCRow, null, null, null, null, null, callback);
    }

    function parseProduction(result, callback) {
        var processProductionRow = function(prodReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
            //This serves 2 purposes, check for blank rows and skip rows with no value
            if (row['#production+volume'] === "") {
                prodReport.add("Productions: Empty row.\n");
                return callback(null); //Do nothing
            }
            //TODO?: Currently hard req. for country, commodity, year. If company there should be valid.
            if ((row['#country+identifier'] === "") || !countries[row['#country+identifier']] || ((row['#company'] !== "") && !companies[row['#company'].toLowerCase()] ) || !sources[row['#source'].toLowerCase()] || (row['#production+commodity'] === "") || !commodities[row['#production+commodity']] || (row['#production+year'] === "") ) {
                prodReport.add(`Invalid or missing data in row: ${util.inspect(row)}. Aborting.\n`);
                return callback(`Failed: ${prodReport.report}`);
            }

            var newProduction = makeNewProduction(row);
            
            if (!newProduction) {
                prodReport.add(`Invalid or missing data in row: ${util.inspect(row)}. Aborting.\n`);
                return callback(`Failed: ${prodReport.report}`);
            }
            
            //TODO: no querying necessary?
            var query = {
                production_commodity: commodities[row['#production+commodity']]._id,
                production_year: parseInt(row['#production+year']),
                country: countries[row['#country+identifier']]._id,
                source: sources[row['#source'].toLowerCase()]._id
            };
            if (newProduction.project) {
                query.project = projects[row['#production+entity+name'].toLowerCase()]._id;
            }
            else if (newProduction.concession) {
                query.concession = concessions[row['#production+entity+name'].toLowerCase()]._id;
            }
            else if (newProduction.site) {
                query.site = sites[row['#production+entity+name'].toLowerCase()]._id;
            }
            
            //prodReport.add(util.inspect(query, {showHidden: true, colors: true, depth: 5}));
            
            Production.findOneAndUpdate(
                query,
                newProduction,
                {upsert: true, 'new': true},
                function(err, doc) {
                    if (err) {
                        prodReport.add(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                        return callback(`Failed: ${prodReport.report}`);
                    }
                    else {
                        createdOrAffectedEntities[doc._id] = {entity: 'production', obj: doc._id};
                        prodReport.add(`Production added or updated\n`); //TODO add details
                        return callback(null);
                    }
                }
            );
        };
        parseEntity(result, '6', null, processProductionRow, null, null, null, null, null, callback);
    }

    function parseTransfers(result, callback) {
        var processTransferRow = function(transReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
            if (row['#payment+value'] === "") {
                transReport.add("Transfers: Empty row or label, or no volume data.\n");
                return callback(null); //Do nothing
            }
            //Hard req. for country
            if ((row['#country+identifier'] === "") || !countries[row['#country+identifier']] || (row['#payment-category'] === "")) {
                transReport.add(`Invalid or missing country or payment category in row: ${util.inspect(row)}. Aborting.\n`);
                return callback(`Failed: ${transReport.report}`);
            }
            //Transfer - many possible ways to match
            //Determine if payment or receipt
            
            var newTransferObj = makeNewTransfer(row);
            
            if (newTransferObj.error) {
                transReport.add(`Invalid or missing data in row: ${util.inspect(row)}. Error message was: ${newTransferObj.error}. Aborting.\n`);
                return callback(`Failed: ${transReport.report}`);
            }
            else if (newTransferObj.warning) {
                transReport.add(`Warning for data in row: ${util.inspect(row)}. Warning message was: ${newTransferObj.warning}. Continuing.\n`);  
            }
            
            //Note: no checking for existing entries but blanket acceptance of data as rows themselves can duplicate. If we ever want back (for 0.5), look in git 18/7/16
            Transfer.create(
                newTransferObj.transfer,
                function(err, tmodel) {
                    if (err) {
                        transReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                        return callback(`Failed: ${transReport.report}`);
                    }
                    createdOrAffectedEntities[tmodel._id] = {entity: 'transfer', obj: tmodel._id};
                    transReport.add(`Added transfer to the DB.\n`); //TODO detail
                    return callback(null);
                }
            );
        };
        parseEntity(result, '8', null, processTransferRow, null, null, null, null, null, callback);
    }

    function parseReserves(result, callback) {
        result.add("Reserves IGNORED\n");
        callback(null, result);
    }
}