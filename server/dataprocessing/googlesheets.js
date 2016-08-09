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
    
var actionId = null;

var createdOrAffectedEntities = {};

exports.processData = function(link, actionid, callback) {
    actionId = actionid;
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
            for (var i=0; i<body.feed.entry.length; i++) {
                if (body.feed.entry[i].title.$t.indexOf(".") != -1) numSheets++;
            }
            var mainTitle = body.feed.title.$t;
            var numProcessed = 0;
            for (var i=0; i<body.feed.entry.length; i++) {
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

function parseGsDate(input) {
    /* In general format should appear as YYYY or DD/MM/YYYY or empty but sometimes GS has it as a date internally */
    var result;
    if (!input || input == "") return null;
    else if (input.length == 4) result = moment(input + ' +0000', "YYYY Z").format();
    else result = moment(input + ' +0000', "DD/MM/YYYY Z").format();
    //Hope for the best
    if (result == "Invalid date") return input;
    else return result;
}

function isFactAlreadyThere(doc, key, fact) {
    /*
    var factEntry;
    var found = false;
    if (doc[key]) {
        for (factEntry of doc[key]) {
            var factNewEntry;
            var match = true;
            for (factNewEntry of fact) {
                if facfactNewEntry
            }
        }
    }
    */
    return false;
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
        companyg.country_of_incorporation = [{country: countries[newRow['#group+country+identifier']]._id, source: sources[newRow['#source'].toLowerCase()]._id}]; //Fact array
    }
    if (newRow['#group+website'] !== "") {
        companyg.company_group_website = {string: fixwebsite(newRow['#group+website']), source: sources[newRow['#source'].toLowerCase()]._id}; //Fact
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
        company.country_of_incorporation = [{country: countries[newRow['#company+country+identifier']]._id, source: sources[newRow['#source'].toLowerCase()]._id}]; //Fact array
    }
    if (newRow['#company+website'] !== "") {
        company.company_website = {string: fixwebsite(newRow['#company+website']), source: sources[newRow['#source'].toLowerCase()]._id}; //Fact
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
        proj_name: newRow['#project'],
        proj_established_source: sources[newRow['#source'].toLowerCase()]._id,
        proj_commodity: [],
        proj_aliases: [],
        proj_status: [],
        proj_country: []
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

    return production;
};

function fillInGenericFields(newRow, object, name) {
    switch(newRow['#' + name + '+entity+type'].toLowerCase()) {
        case "":
        case "unknown": //Strictly speaking unknown+value doesn't make much sense, but it makes the code a bit simpler
            if (newRow['#' + name + '+entity+name'] !== "") { //Entity names without entity type: default is project
                object[name + '_level'] = "project";
                object.project = projects[newRow['#' + name + '+entity+name'].toLowerCase()]._id;
            }
            else if (newRow['#company'] !== "") object[name + '_level'] = "company"; //Implied company level. Company filled elsewhere.
            //Otherwise we only have country to go on. Country must be present. Country filled elsewhere.
            else object[name + '_level'] = "country";
            break;
        case "project":
            object[name + '_level']= "project";
            object.project = projects[newRow['#' + name + '+entity+name'].toLowerCase()]._id;
            break;
        case "concession":
            object[name + '_level'] = "concession";
            object.concession = concessions[newRow['#' + name + '+entity+name'].toLowerCase()]._id;
            break;
        case "site":
        case "field":
            object[name + '_level'] = row['#' + name + '+entity+type'].toLowerCase();
            object.site = sites[newRow['#' + name + '+entity+name'].toLowerCase()]._id;
            break;
        case "company":
            object[name + '_level'] = "company"; //Explicit company level. Value will be taken from company column elsewhere.
            break;
        case "country":
            object[name + '_level'] = "country"; //Explicit country level. Value will be taken from company column elsewhere.
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

    transfer.transfer_year = parseInt(newRow['#payment+year']);
    transfer.transfer_type = newRow['#payment+paymentType']; //TODO - these have identifiers but we are not using them, and hence no validating the input (Issue #151)
    transfer.transfer_unit = newRow['#payment+currency'];
    transfer.transfer_value = newRow['#payment+value'].replace(/,/g, "");
    if (newRow['#payment+governmentParty'] !== "") transfer.transfer_gov_entity = newRow['#payment+governmentParty'];
    if (newRow['#payment+governmentParty+identifier'] !== "") transfer.transfer_gov_entity_id = newRow['#payment+governmentParty+identifier'];
    if (newRow['#payment+basisOfAccounting'] !== "") transfer.transfer_accounting_basis = newRow['#payment+basisOfAccounting'];
    if (newRow['#payment+notes'] !== "") transfer.transfer_note = newRow['#payment+notes'];

    return transfer;
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
        sources = new Object;
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
            function updateOrCreateProject(projDoc, currentDoc, countryId, wcallback) {
                if (!projDoc) {
                    projDoc = makeNewProject(row); //This can sit alongside the existing proj from db for now. Merging happens later.
                    
                    if (!projDoc) {
                        projectsReport.add(`Invalid data in row: ${util.inspect(row)}. Aborting.\n`);
                        return wcallback(`Failed: ${projectsReport.report}`);
                    }
                    
                    var cFact = {source: sources[row['#source'].toLowerCase()]._id, country: countryId};
                    if (!isFactAlreadyThere(projDoc, "proj_country", cFact)) projDoc.proj_country.push(cFact);
                }

                if (row['#project+alias'] !== "") {
                    var aFact = {alias: row['#project+alias'], source: sources[row['#source'].toLowerCase()]._id};
                    if (!isFactAlreadyThere(projDoc, "proj_aliases", aFact)) projDoc.proj_aliases.push(aFact);
                }

                if (row['#commodity'] !== "") {
                    var coFact = {commodity: commodities[row['#commodity']]._id, source: sources[row['#source'].toLowerCase()]._id};
                    if (!isFactAlreadyThere(projDoc, "proj_commodity", coFact)) projDoc.proj_commodity.push(coFact);
                    //TODO: how to store commodity notes in facts?
                }
            
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
                    projDoc.proj_status = proj_status;
                }
                
                destObj[row['#project'].toLowerCase()] = projDoc; //Can also serve as update to internal list
                //TODO: don't overwrite project name with an alias!!!

                return wcallback(null, model);
            }

            if (row['#project'] === "") {
                projectsReport.add('Empty project name in row. Skipping.\n');
                return callback(null);
            }
            
            if (row['#project'] === "") {
                projectsReport.add('Empty project name in row. Skipping.\n');
                return callback(null);
            }
            
            var countryRow = _.findWhere(sheets['1'].data, {"#project": row['#project']});
            var countryId = countries[countryRow['#country+identifier']]._id;
                
            //Look for project in DB. This only happens if not in internal list.
            if (!_.findWhere(destObj, {proj_name: row['#project'].toLowerCase()})) { //If not yet in internal list (i.e. contained in this workbook)
                //Projects - check against name and aliases
                //TODO: read sheet 1 in properly as the following is inefficient
                
                Project.findOne(
                    {
                        $and:
                        [
                            {
                                $or:
                                    [
                                        {
                                            "proj_name": row[rowIndex]
                                        },
                                        {
                                            "proj_aliases.alias": row[rowIndex]
                                        }
                                    ]
                            },
                            { "proj_country.country": countryId} 
                        ]
                    },
                    function(err, doc) {
                        if (err) {
                            projectsReport.add(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                            return callback(`Failed: ${projectsReport.report}`);
                        }
                        else if (doc) { //Project already exists,
                            projectsReport.add(`Project ${row[rowIndex]} already exists in the DB (name or alias match), using\n`);
                            updateOrCreateProject(null, doc, countryId, callback); //NO existing project internally
                        }
                        else {
                            projectsReport.add(`Project ${row[rowIndex]} not found in DB.\n`);
                            updateOrCreateProject(null, null, countryId, callback); //NO existing project internally, NO project in DB
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
                        if (projects[project]._id) idToUpdateOrCreate = projects[project]._id;
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
                                
                                createdOrAffectedEntities[pmodel._id] = {entity: 'project', obj: pmodel._id};
                                
                                projects[project] = pmodel; //Internal update. Important to do this here to grab id if it was previously set.
                                
                                if (!pmodel.proj_id) {
                                    Project.update({_id: pmodel._id}, {proj_id: countriesById[pmodel.proj_country[0].country].iso2.toLowerCase() + '-' + pmodel.proj_name.toLowerCase().slice(0, 4) + '-' + randomstring(6).toLowerCase()}, {},
                                        function(err) {
                                            if (err) {
                                                projectsReport.add(`Encountered an error while setting the project ID DB: ${err}. Aborting.\n`);
                                                return ecallback(err);
                                            }
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
                                                countries_of_operation: {country: countries[row['#project+site+country+identifier']]._id, source: sources[row['#source'].toLowerCase()]._id}
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
                            Contract.findOne({
                                    $or: [
                                        {contract_title: row['#contract']},
                                        {contract_id: row['#contract+rcId']},
                                        {oo_contract_id: row['#contract+ooId']},
                                        {contract_url: row['#contract+uri']}
                                    ]
                                },
                                function(err, doc) {
                                    if (err) {
                                        return wcallback(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                                    }
                                    else if (doc) { //Found contract, but no clear reference to archive by. For inter-sheet lookups use title if present, but pass it along for this row only.
                                        createdOrAffectedEntities[doc._id] = {entity: 'contract', obj: doc._id};
                                        if (row['#contract'] !== "") contracts[row['#contract'].toLowerCase] = doc;
                                        candcReport.add(`Contract ${row['#contract+identifier']} exists\n`);
                                        return wcallback(null, project, company, doc);
                                    }
                                    else { //No contract, create
                                        var newContract = {
                                            contract_title: row['#contract'],
                                            contract_id: row['#contract+rcId'],
                                            oo_contract_id: row['#contract+ooId'],
                                            contract_url: row['#contract+uri']
                                        };
                                        Contract.create(
                                            newContract,
                                            function(err, cmodel) {
                                                if (err) {
                                                    return wcallback(err);
                                                }
                                                createdOrAffectedEntities[cmodel._id] = {entity: 'contract', obj: cmodel._id};
                                                if (row['#contract'] !== "") contracts[row['#contract']] = cmodel;
                                                candcReport.add(`Created a contract.\n`);
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
                            var newConcession = {
                                concession_name: row['#project+concession'],
                                concession_established_source: sources[row['#source'].toLowerCase()]._id
                            };
                            if (row['#project+concession+country+identifier'] !== "") {
                                newConcession.concession_country = {$addToSet: {country: countries[row['#project+concession+country+identifier']]._id, source: sources[row['#source'].toLowerCase()]._id}};
                            }
                            if ((row['#project+company'] !== "") && (row['#project+company+isOperator'] === "TRUE")) { //TODO review stringency
                                newConcession.concession_operated_by =  {$addToSet: {company: companies[row['#project+company'].toLowerCase()]._id, source: sources[row['#source'].toLowerCase()]._id}};
                            }
                            if (row['#project+company+share'] !== "") {
                                var share = parseInt(row['#project+company+share'].replace("%", ""))/100.0;
                                newConcession.concession_company_share =  {$addToSet: {company: companies[row['#project+company'].toLowerCase()]._id, number: share, source: sources[row['#source'].toLowerCase()]._id}};
                            } 
                            Concession.findOneAndUpdate(
                                {
                                    $and: [
                                        {
                                            $or: [
                                                {concession_name: row['#project+concession']},
                                                {"concession_aliases.alias": row['#project+concession']} //TODO: Could lead to replacing a concession with a new name by alias and losing the name
                                            ]
                                        },
                                        {"concession_country.country": countries[row['#project+concession+country+identifier']]._id}
                                    ]
                                },
                                newConcession,
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
                        
                        var site = {
                            site_name: row['#project+' + identifier],
                            site_established_source: sources[row['#source'].toLowerCase()]._id,
                            site_country: {$addToSet: {country: countries[row['#project+' + identifier + '+country+identifier']]._id, source: sources[row['#source'].toLowerCase()]._id}} //TODO: How in the world can there multiple versions of country
                        };
                        
                        if (identifier === "field") site.site_field = true;
                        else site.site_field = false;
                        
                        if (row['#project+' + identifier + '+address'] !== "") site.site_address = {$addToSet: {string: row['#project+' + identifier + '+address'], source: sources[row['#source'].toLowerCase()]._id}};
                        if (row['#project+' + identifier + '+lat'] !== "") site.site_coordinates = {$addToSet: {loc: [parseFloat(row['#project+' + identifier + '+lat']), parseFloat(row['#project+' + identifier + '+long'])], source: sources[row['#source'].toLowerCase()]._id}};
                        
                        if ((row['#project+company'] !== "") && (row['#project+company+isOperator'] === "TRUE")) { //TODO review stringency
                            site.site_operated_by = {$addToSet: {company: companies[row['#project+company'].toLowerCase()]._id, source: sources[row['#source'].toLowerCase()]._id}};
                        }
                        
                        if (row['#project+company+share'] !== "") {
                            var share = parseInt(row['#project+company+share'].replace("%", ""))/100.0;
                            site.site_company_share = {$addToSet: {company: companies[row['#project+company'].toLowerCase()]._id, number: share, source: sources[row['#source'].toLowerCase()]._id}};
                        }    

                       Site.findOneAndUpdate(
                            {
                                $and: [
                                    {
                                        $or: [
                                            {site_name: row['#project+' + identifier]},
                                            {"site_aliases.alias": row['#project+' + identifier]} //TODO: Could lead to replacing a site with a new name by alias and losing the name
                                        ]
                                    },
                                    {"site_country.country": countries[row['#project+' + identifier + '+country+identifier']]._id}
                                ]
                            },
                            site,
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
                        
                    },
                    function (project, company, contract, concession, site, wcallback) {
                        var baselink =  {
                            source: sources[row['#source'].toLowerCase()]._id,

                        };
                        var project_link = baselink;
                        var company_link = baselink;
                        var contract_link = baselink;
                        var concession_link = baselink;
                        if (project) project_link.project = project._id;
                        if (company) company_link.company = company._id;
                        if (contract) contract_link.contract = contract._id;
                        if (concession) concession_link.concession = concession._id;
                        
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
                                    var link = project_link;
                                    link.entities = ['project', 'company'];
                                    link.company = company._id;
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link project with contract */
                            function(scallback) {
                                if (project && contract) {
                                    var link = project_link;
                                    link.entities = ['project', 'contract'];
                                    link.contract = contract._id;
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link project with concession */
                            function(scallback) {
                                if (project && concession) {
                                    var link = project_link;
                                    link.entities = ['project', 'concession'];
                                    link.concession = concession._id;
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link project with site */
                            function(scallback) {
                                if (project && site) {
                                    var link = project_link;
                                    link.entities = ['project', 'site'];
                                    link.site = site._id;
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link company with contract */
                            function(scallback) {
                                if (company && contract) {
                                    var link = company_link;
                                    link.entities = ['company', 'contract'];
                                    link.contract = contract._id;
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link company with concession */
                            function(scallback) {
                                if (company && concession) {
                                    var link = company_link;
                                    link.entities = ['company', 'concession'];
                                    link.concession = concession._id;
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link company with site */
                            function(scallback) {
                                if (company && site) {
                                    var link = company_link;
                                    link.entities = ['company', 'site'];
                                    link.site = site._id;
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link contract with concession */
                            function(scallback) {
                                if (contract && concession) {
                                    var link = contract_link;
                                    link.entities = ['contract', 'concession'];
                                    link.concession = concession._id;
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link contract with site */
                            function(scallback) {
                                if (contract && site) {
                                    var link = contract_link;
                                    link.entities = ['contract', 'site'];
                                    link.site = site._id;
                                    makeLink(link, scallback);
                                }
                                else scallback(null);
                            },
                            /* Link concession with site */
                            function(scallback) {
                                if (concession && site) {
                                    var link = concession_link;
                                    link.entities = ['concession', 'site'];
                                    link.site = site._id;
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
            
            var newTransfer = makeNewTransfer(row);

            if (!newTransfer) {
                transReport.add(`Invalid or missing data in row: ${util.inspect(row)}. Aborting.\n`);
                return callback(`Failed: ${transReport.report}`);
            }
            
            //Note: no checking for existing entries but blanket acceptance of data as rows themselves can duplicate. If we ever want back (for 0.5), look in git 18/7/16
            Transfer.create(
                newTransfer,
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