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
    ObjectId = require('mongoose').Types.ObjectId,
    util = require('util'),
    async   = require('async'),
    csv     = require('csv-parse/lib/sync'),
    request = require('request'),
    moment = require('moment'),
    _ = require('underscore'),
    randomstring = require('just.randomstring');

exports.processData = function(link, callback) {
    var report = "";
    var keytoend =  link.substr(link.indexOf("/d/") + 3, link.length);
    var key = keytoend.substr(0, keytoend.indexOf("/"));
    report += `Using link ${link}\n`;
    if (key.length != 44) {
        report += "Could not detect a valid spreadsheet key in URL\n";
        callback("Failed", report);
        return;
    }
    else {
        report += `Using GS key ${key}\n`;
    }
    var feedurl = `https://spreadsheets.google.com/feeds/worksheets/${key}/public/full?alt=json`;
    var sheets = new Object;

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
                                callback("Failed", report);
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
            callback("Failed", report);
            return;
        }
    });
}

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

//Data needed for inter-entity reference
var sourceTypes, sources, countries, commodities, commoditiesById, companies, company_groups, projects, contracts;

//TODO: Move to new duplicates model
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
        source_url: newRow['#source+url'],
        source_url_type: newRow['#source+urlType'], //TODO: unnecessary?
        /* TODO? source_url_type_id: String, */
        source_archive_url: newRow['#source+archiveCopy'],
        source_notes: newRow['#source+description'],
        source_date: newRow['#source+sourceDate'],
        retrieve_date: newRow['#source+retrievedDate']
        /* TODO create_author:, */
    };
    return source;
};

var makeNewCompanyGroup = function(newRow) {
    //TODO: https://github.com/NRGI/rp-org-frontend/issues/34
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
        companyg.company_group_website = {string: newRow['#group+website'], source: sources[newRow['#source'].toLowerCase()]._id}; //Fact
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
    //TODO: https://github.com/NRGI/rp-org-frontend/issues/34
    var returnObj = {obj: null, link: null};
    var company = {
        company_name: newRow['#company']
    };

    //TODO: Require OC URL for UK companies?
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
        company.company_website = {string: newRow['#company+website'], source: sources[newRow['#source'].toLowerCase()]._id}; //Fact
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
    var project = {
        proj_name: newRow['#project'],
        proj_established_source: sources[newRow['#source'].toLowerCase()]._id,
        proj_country: [{country: countries[newRow['#project+site+country+identifier']]._id, source: sources[newRow['#source'].toLowerCase()]._id}]
    };
    if (newRow['#project+site+address'] !== "") project.proj_address = [{string: newRow['#project+site+address'], source: sources[newRow['#source'].toLowerCase()]._id}];
    if (newRow['#project+site+lat'] !== "") project.proj_coordinates = [{loc: [parseFloat(newRow['#project+site+lat']), parseFloat(newRow['#project+site+long'])], source: sources[newRow['#source'].toLowerCase()]._id}];
    if (newRow['#commodity'] !== "") project.proj_commodity = [{commodity: commodities[newRow['#commodity']]._id, source: sources[newRow['#source'].toLowerCase()]._id}];

    return project;
}

var makeNewSite = function(newRow, projDoc) {
    var site = {
        site_name: newRow['#project+site'],
        site_established_source: sources[newRow['#source'].toLowerCase()]._id,
        site_country: [{country: countries[newRow['#project+site+country+identifier']]._id, source: sources[newRow['#source'].toLowerCase()]._id}] //TODO: How in the world can there multiple versions of country
    };
    if (newRow['#project+site+address'] !== "") site.site_address = [{string: newRow['#project+site+address'], source: sources[newRow['#source'].toLowerCase()]._id}];
    if (newRow['#project+site+lat'] !== "") site.site_coordinates = [{loc: [parseFloat(newRow['#project+site+lat']), parseFloat(newRow['#project+site+long'])], source: sources[newRow['#source'].toLowerCase()]._id}];
    if (newRow['#commodity'] !== "") site.site_commodity = [{commodity: commodities[newRow['#commodity']]._id, source: sources[newRow['#source'].toLowerCase()]._id}];
    else { //Inherit
        if (projDoc.proj_commodity) {
            site.site_commodity = projDoc.proj_commodity;
        }
    }

    site.field = true; //If oil/gas or unclear/unknown
    if (site.site_commodity[0]) {
        if (commoditiesById[site.site_commodity[0].commodity].commodity_type == "mining") {
            site.field = false; // "type = site"
        }
    }

    //TODO (future template)
    //site_operated_by: [fact],
    //site_company_share: [fact],

    if (newRow['#status+statusType'] !== "") {
        var status;
        if (newRow['#status+statusType'].indexOf('/') != -1) {
            status = newRow['#status+statusType'].split('/')[1]; //Workaround to cope with "construction/development"
        }
        else status = newRow['#status+statusType'];
        status = status.toLowerCase().replace(/ /g, '_');
        site.site_status = [{string: status, timestamp: parseGsDate(newRow['#status+trueAt']), source: sources[newRow['#source'].toLowerCase()]._id}];
    }

    return site;
};

var makeNewProduction = function(newRow) {
    var production = {
        production_commodity: commodities[newRow['#project+production+commodity']]._id,
        production_year: parseInt(newRow['#project+production+year']),
        country: countries[newRow['#country+identifier']]._id,
        source: sources[newRow['#source'].toLowerCase()]._id
    };
    if (newRow['#project'] !=="") {
        production.production_level = "project";
        production.project = projects[newRow['#project'].toLowerCase()]._id;
    }
    if (newRow['#project+production+unit'] !== "") {
        production.production_unit = newRow['#project+production+unit'];
    }
    if (newRow['#project+production+volume'] !== "") {
        production.production_volume = newRow['#project+production+volume'].replace(/,/g, "");
    }
    if (newRow['#project+production+price'] !== "") {
        production.production_price = newRow['#project+production+price'].replace(/,/g, "");
    }
    if (newRow['#project+production+priceUnit'] !== "") {
        production.production_price_unit = newRow['#project+production+priceUnit'];
    }

    return production;
};

var makeNewTransfer = function(newRow, transfer_audit_type) {
    var transfer = {
        source: sources[newRow['#source'].toLowerCase()]._id,
        country: countries[newRow['#country+identifier']]._id,
        transfer_audit_type: transfer_audit_type
    };

    if (newRow['#company'] !== "") {
        transfer.company = companies[newRow['#company'].toLowerCase()]._id;
    }

    if (newRow['#reportLineItem'] !== "") {
        transfer.transfer_line_item = newRow['#reportLineItem'];
    }

    if (newRow['#project'] !== "") {
        transfer.transfer_level = "project";
        transfer.project = projects[newRow['#project'].toLowerCase()]._id;
    }
    else {
        transfer.transfer_level = "country";
    }

    if (transfer_audit_type == "government_receipt") {
        transfer.transfer_year = parseInt(newRow['#governmentReceipt+year']);
        transfer.transfer_type = newRow['#governmentReceipt+paymentType'];
        transfer.transfer_unit = newRow['#governmentReceipt+currency'];
        transfer.transfer_value = newRow['#governmentReceipt+value'].replace(/,/g, "");
        if (newRow['#governmentReceipt+basisOfAccounting'] !== "") transfer.transfer_accounting_basis = newRow['#governmentReceipt+basisOfAccounting'];
        if (newRow['#governmentReceipt+governmentParty'] !== "") transfer.transfer_gov_entity = newRow['#governmentReceipt+governmentParty'];
        if (newRow['#governmentReceipt+governmentParty+identifier'] !== "") transfer.transfer_gov_entity_id = newRow['#governmentReceipt+governmentParty+identifier'];
    }
    else if (transfer_audit_type == "company_payment") {
        transfer.transfer_audit_type = "company_payment";
        transfer.transfer_year = parseInt(newRow['#companyPayment+year']);
        transfer.transfer_type = newRow['#companyPayment+paymentType'];
        transfer.transfer_unit = newRow['#companyPayment+currency'];
        transfer.transfer_value = newRow['#companyPayment+value'].replace(/,/g, "");
        if (newRow['#companyPayment+basisOfAccounting'] !== "") transfer.transfer_accounting_basis = newRow['#companyPayment+basisOfAccounting'];
    }
    else return false;

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
                    companiesReport.add(`Invalid data in row: ${inspect.util(row)}. Aborting.\n`);
                    return callback(`Failed: ${companiesReport.report}`);
                }
                model.create(
                    newObj.obj,
                    function(err, cmodel) {
                        if (err) {
                            companiesReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                            return callback(`Failed: ${companiesReport.report}`);
                        }
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
            /*parseConcessionsAndContracts,
            parseProduction,
            parseTransfers,*/
            parseReserves
        ], function (err, report) {
            if (err) {
                console.log("PARSE: Got an error\n");
                return finalcallback("Failed", report.report);
            }
            finalcallback("Success", report.report);
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
                }
                callback(null, result);
            }
        });
    }

    function parseCommodities(result, callback) {
        //Complete commodity list is in the DB
        result.add("Getting commodities from database...\n");
        commodities = new Object;
        commoditiesById = new Object;
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
            if (row['#source'] == "") {
                sourcesReport.add("Sources: source name cannot be empty. Aborting.\n");
                return callback(`Failed: ${sourcesReport.report}`);
            }
            Source.findOne(
                {source_url: row['#source+url'].toLowerCase()},
                null, //return everything
                { sort: { create_date: 1 } }, //Find OLDEST (use that for comparison instead of some other duplicate - important where we create duplicates)
                function(err, doc) {
                    if (err) {
                        sourcesReport.add(`Encountered an error while querying the DB: ${err}. Aborting.\n`);
                        return callback(`Failed: ${sourcesReport.report}`);
                    }
                    else if (doc) {
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

    function createSiteProjectLink (siteId, projectId, sourceId, report, lcallback) {
        Link.create({project: projectId, site: siteId, source: sourceId, entities: ['project', 'site']},
            function (err, nlmodel) {
                if (err) {
                    report.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                    return lcallback(`Failed: ${report.report}`);
                }
                else {
                    report.add(`Linked site to project in the DB.\n`);
                    return lcallback(null); //Final step, no return value
                }
            }
        );
    }

    function parseProjects(result, callback) {
        var processProjectRow = function(projectsReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
            function updateOrCreateProject(projDoc, duplicateId, wcallback) {
                if (!projDoc) {
                    projDoc = makeNewProject(row);
                }

                //Update status and commodity
                if (row['#commodity'] !== "") {
                    var notfound = true;
                    if (doc.proj_commodity) {
                        for (fact of doc.proj_commodity) {
                            //No need to check if commodity exists as the doc either comes from DB or has already had commodity added from DB list in makeNewProject
                            //TODO: In general, do we want to store multiple sources for the same truth? [from GS]
                            if (commodities[row['#commodity']]._id == fact.commodity._id) { //TODO type check
                                notfound = false;
                                report.add(`Project commodity ${row['#commodity']} already exists in project, not adding\n`);
                                break;
                            }
                        }
                    }
                    else doc.proj_commodity = [];
                    if (notfound) { //Commodity must be here, as based on this sheet
                        //Don't push but add, existing values will not be removed
                        doc.proj_commodity = [{commodity: commodities[row['#commodity']]._id, source: sources[row['#source'].toLowerCase()]._id}];
                        report.add(`Project commodity ${row['#commodity']} added to project\n`);
                    }
                }
                else if (doc.proj_commodity) delete doc.proj_commodity; //Don't push
            
                if (row['#status+statusType'] != "") {
                    var notfound = true;
                    if (doc.proj_status) {
                        for (fact of doc.proj_status) {
                            if (row['#status+statusType'] == fact.string) {
                                notfound = false;
                                report.add(`Project status ${row['#status+statusType']} already exists in project, not adding\n`);
                                break;
                            }
                        }
                    }
                    else doc.proj_status = [];
                    if (notfound) {
                        //Don't push but add, existing values will not be removed
                        var status;
                        if (row['#status+statusType'].indexOf('/') != -1) {
                            status = row['#status+statusType'].split('/')[1]; //Workaround to cope with "construction/development"
                        }
                        else status = row['#status+statusType'];
                        status = status.toLowerCase().replace(/ /g, '_');
                        doc.proj_status = [{string: status, timestamp: parseGsDate(row['#status+trueAt']), source: sources[row['#source'].toLowerCase()]._id}];
                        report.add(`Project status ${row['#status+statusType']} added to project\n`);
                    }
                }
                else if (doc.proj_status) delete doc.proj_status; //Don't push
            
                //TODO... projects with mulitple countries, really?
                //TODO: This can probably be simplified with $addToSet!
                if (row['#project+site+country+identifier'] !== "") {
                    var notfound = true;
                    if (doc.proj_country) { //TODO: project without a country???
                        for (fact of doc.proj_country) {
                            if (countries[row['#project+site+country+identifier']]._id == fact.country._id) {
                                notfound = false;
                                report.add(`Project country ${row['#project+site+country+identifier']} already exists in project, not adding\n`);
                                break;
                            }
                        }
                    }
                    else doc.proj_country = [];
                    if (notfound) {
                        //Don't push but add, existing values will not be removed
                        doc.proj_country = [{country: countries[row['#project+site+country+identifier']]._id, source: sources[row['#source'].toLowerCase()]._id}];
                        report.add(`Project country ${row['#project+site+country+identifier']} added to project\n`);
                    }
                }
                else if (doc.proj_country) delete doc.proj_country; //Don't push
            
                return doc;
                
                if (!proj_doc) {
                    projectsReport.add(`Invalid data in row: ${util.inspect(row)}. Aborting.\n`);
                    return wcallback(`Failed: ${projectsReport.report}`);
                }

                if (!doc_id) doc_id = new ObjectId();
                Project.findByIdAndUpdate(
                    doc_id,
                    final_doc,
                    {setDefaultsOnInsert: true, upsert: true, new: true},
                    function(err, model) {
                        if (err) {
                            //console.log(err);
                            projectsReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                            return wcallback(`Failed: ${projectsReport.report}`);
                        }
                        //Take first country that occurs - TODO, correct if/when projects go back to having single countries
                        if (row['#project+site+country+identifier'] !== "") {  //Projects must have countries even if sites come afterwards
                            if (!model.proj_id) {
                                Project.update({_id: model._id}, {proj_id: row['#project+site+country+identifier'].toLowerCase() + '-' + model.proj_name.toLowerCase().slice(0, 4) + '-' + randomstring(6).toLowerCase()}, {},
                                    function(err) {
                                        if (err) {
                                            projectsReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                            return wcallback(`Failed: ${projectsReport.report}`);
                                        }
                                        projectsReport.add(`Added or updated project ${row[rowIndex]} to the DB.\n`);
                                        projects[row[rowIndex].toLowerCase()] = model;
                                        return wcallback(null, model); //Continue to site stuff
                                    }
                                );
                            }
                            else return wcallback(null, model); //Continue to site stuff
                        }
                        else {
                            projectsReport.add(`Invalid data in row - projects and sites must have a country (row: ${util.inspect(row)}). Aborting.\n`);
                            return wcallback(`Failed: ${projectsReport.report}`);
                        }
                    }
                );
            }

            function createSiteAndLink(projDoc, wcallback) {
                if (row['#project+site'] !== "") {
                    Site.findOne(
                        {$or: [
                            {site_name: row['#project+site']},
                            {"site_aliases.alias": row['#project+site']}
                        ]},
                        function (err, sitemodel) {
                            if (err) {
                                projectsReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                return wcallback(`Failed: ${projectsReport.report}`);
                            }
                            else if (sitemodel) {
                                //Site already exists - check for link, could be missing if site is from another project
                                //TODO: For now if we find location add it to the site. In future sheets all site info should be in same row somewhere
                                var update = {};
                                if (row['#project+site+address'] !== "") update.site_address = {string: row['#project+site+address'], source: sources[row['#source'].toLowerCase()]._id};
                                if (row['#project+site+lat'] !== "") update.site_coordinates = {loc: [parseFloat(row['#project+site+lat']), parseFloat(row['#project+site+long'])], source: sources[row['#source'].toLowerCase()]._id};
                                Site.update({_id: sitemodel._id}, {$addToSet: update});
                                //TODO: check $addToSet
                                var found = false;
                                Link.find({project: projDoc._id, site: sitemodel._id, source: sources[row['#source'].toLowerCase()]._id},
                                    function (err, sitelinkmodel) {
                                        if (err) {
                                            projectsReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                            return wcallback(`Failed: ${projectsReport.report}`);
                                        }
                                        else if (sitelinkmodel) {
                                            projectsReport.add(`Link to ${row['#project+site']} already exists in the DB, not adding\n`);
                                            return wcallback(null);
                                        }
                                        else {
                                            createSiteProjectLink(sitemodel._id, projDoc._id, sources[row['#source'].toLowerCase()]._id, projectsReport, wcallback);
                                        }
                                    }
                                );
                            }
                            else { //Site doesn't exist - create and link
                                Site.create(
                                    makeNewSite(row, projDoc),
                                    function (err, newsitemodel) {
                                        if (err) {
                                            projectsReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                            return wcallback(`Failed: ${projectsReport.report}`);
                                        }
                                        else {
                                            createSiteProjectLink(newsitemodel._id, projDoc._id, sources[row['#source'].toLowerCase()]._id, projectsReport, wcallback);
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
                else { //Nothing more to do
                    projectsReport.add(`No site info in row\n`);
                    return wcallback(null);
                }
            }

            
            if (row['#project'] === "") {
                projectsReport.add('Empty project name in row. Skipping.\n');
                return callback(null);
            }
            
            //Look for project in DB
            if (!_.findWhere(projects, {proj_name: row['#project'].toLowerCase()})) { //If no yet in internal list (i.e. contained in this workbook)
                //Projects - check against name and aliases
                Project.findOne(
                    {
                        $and: [
                            {
                                $or: [
                                    {
                                        "proj_name": row[rowIndex]
                                    },
                                    {
                                        "proj_aliases.alias": row[rowIndex]
                                    }
                                ]
                            },
                            {
                                "proj_country": countries[row['#project+site+country+identifier']]._id
                            }
                        ]
                    },
                    function(err, doc) {
                        if (err) {
                            projectsReport.add(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                            return callback(`Failed: ${projectsReport.report}`);
                        }
                        else if (doc) { //Project already exists,
                            //TODO: Note duplicate status
                            projectsReport.add(`Project ${row[rowIndex]} already exists in the DB (name or alias match), flagging new project as duplicate\n`);
                            updateOrCreateProject(null, doc._id, callback); //NO existing project internally
                        }
                        else {
                            projectsReport.add(`Project ${row[rowIndex]} not found in DB.\n`);
                            updateOrCreateProject(null, null, callback); //NO existing project internally, NO project in DB
                        }
                    }
                );
            }
            else {
                updateOrCreateProject(projects[row['#project'].toLowerCase()], null, callback); //Existing project internally, may or may not already be flagged as duplicate of something in the DB
            }
        };
        projects = {};
        var saveAllProjectsWhenDone = function (err, reportSoFar) {
            if (err) {
                callback(err, reportSoFar);
            }
            else {
                //TODO - take projects and save them all to DB
                //and when done, call this callback: callback(null, reportSoFar);
            }
        };
        parseEntity(result, '5', projects, processProjectRow, "Project", '#project', Project, "proj_name", makeNewProject, saveAllProjectsWhenDone);
    }

    function parseConcessionsAndContracts(result, callback) {
        //First linked companies
        var processCandCRowCompanies = function(row, callback) {
            var compReport = "";
            if (row['#project+company'] != "") {
                if (!companies[row['#project+company'].toLowerCase()] || !projects[row['#project'].toLowerCase()] || !sources[row['#source'].toLowerCase()] ) {
                    compReport += (`Invalid data in row: ${inspect.util(row)}. Aborting.\n`);
                    return callback(`Failed: ${compReport}`);
                }
                Link.findOne(
                    {
                        company: companies[row['#project+company'].toLowerCase()]._id,
                        project: projects[row['#project'].toLowerCase()]._id,
                        source: sources[row['#source'].toLowerCase()]._id
                    },
                    function(err, doc) {
                        if (err) {
                            compReport += (`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                            return callback(`Failed: ${compReport}`);
                        }
                        else if (doc) {
                            compReport += (`Company ${row['#project+company']} is already linked with project ${row['#project']}, not adding\n`);
                            return callback(null, row, compReport);
                        }
                        else {
                            var newCompanyLink = {
                                company: companies[row['#project+company'].toLowerCase()]._id,
                                project: projects[row['#project'].toLowerCase()]._id,
                                source: sources[row['#source'].toLowerCase()]._id,
                                entities:['company','project']
                            };
                            Link.create(
                                newCompanyLink,
                                function(err, model) {
                                    if (err) {
                                        compReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                        return callback(`Failed: ${compReport}`);
                                    }
                                    compReport += (`Linked company ${row['#project+company']} with project ${row['#project']} in the DB.\n`);
                                    return callback(null, row, compReport);
                                }
                            );
                        }
                    }
                );
            }
            else {
                compReport += "No company found in row\n";
                return callback(null, row, compReport);
            }
        };
        //Linked contracts - all based on ID (for API look up)
        var processCandCRowContracts = function(row, reportSoFar, callback) {
            var contReport = reportSoFar;
            if (row['#contract+identifier'] != "") {
                Contract.findOne({
                        contract_id: row['#contract+identifier']
                    },
                    function(err, doc) {
                        if (err) {
                            contReport += (`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                            return callback(`Failed: ${contReport}`);
                        }
                        else if (doc) { //Found contract, now see if its linked
                            contracts[row['#contract+identifier']] = doc;
                            contReport += (`Contract ${row['#contract+identifier']} exists, checking for links\n`);
                            async.series(
                                [
                                    function (linkcallback) { //Contract <-> Project Link
                                        Link.findOne(
                                            {
                                                contract: doc._id,
                                                project: projects[row['#project'].toLowerCase()]._id,
                                                source: sources[row['#source'].toLowerCase()]._id
                                            },
                                            function(err, ldoc) {
                                                if (err) return linkcallback(err);
                                                else if (ldoc) {
                                                    contReport += (`Contract ${row['#contract+identifier']} is already linked with project ${row['#project']}, not adding\n`);
                                                    return linkcallback(null);
                                                }
                                                else {
                                                    var newContractLink = {
                                                        contract: doc._id,
                                                        project: projects[row['#project'].toLowerCase()]._id,
                                                        source: sources[row['#source'].toLowerCase()]._id,
                                                        entities:['contract','project']
                                                    };
                                                    Link.create(
                                                        newContractLink,
                                                        function(err, model) {
                                                            if (err) return linkcallback(err);
                                                            contReport += (`Linked contract ${row['#contract+identifier']} with project ${row['#project']} in the DB.\n`);
                                                            return linkcallback(null);
                                                        }
                                                    );
                                                }
                                            });
                                    },
                                    function (linkcallback) { //Contract <-> Company Link
                                        if (row['#project+company'] != "") {
                                            Link.findOne(
                                                {
                                                    contract: doc._id,
                                                    company: companies[row['#project+company'].toLowerCase()]._id,
                                                    source: sources[row['#source'].toLowerCase()]._id
                                                },
                                                function(err, ldoc) {
                                                    if (err) return linkcallback(err);
                                                    else if (ldoc) {
                                                        contReport += (`Contract ${row['#contract+identifier']} is already linked with company ${row['#project+company']}, not adding\n`);
                                                        return linkcallback(null);
                                                    }
                                                    else {
                                                        var newContCompLink = {
                                                            contract: doc._id,
                                                            company: companies[row['#project+company'].toLowerCase()]._id,
                                                            source: sources[row['#source'].toLowerCase()]._id,
                                                            entities:['contract','company']
                                                        };
                                                        Link.create(
                                                            newContCompLink,
                                                            function(err, model) {
                                                                if (err) return linkcallback(err);
                                                                contReport += (`Linked contract ${row['#contract+identifier']} with company ${row['#project+company']} in the DB.\n`);
                                                                return linkcallback(null);
                                                            }
                                                        );
                                                    }
                                                });
                                        }
                                        else return linkcallback(null);
                                    }
                                ],
                                function (err) {
                                    if (err) {
                                        contReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                        return callback(`Failed: ${contReport}`);
                                    }
                                    return callback(null, row, contReport);
                                }
                            );
                        }
                        else { //No contract, create and link
                            var newContract = {
                                contract_id: row['#contract+identifier']
                            };
                            Contract.create(
                                newContract,
                                function(err, cmodel) {
                                    if (err) {
                                        contReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                        return callback(`Failed: ${contReport}`);
                                    }
                                    contracts[row['#contract+identifier']] = cmodel;
                                    contReport += (`Created contract ${row['#contract+identifier']}.\n`);
                                    //Now create Link
                                    var newContractLink = {
                                        contract: cmodel._id,
                                        project: projects[row['#project'].toLowerCase()]._id,
                                        source: sources[row['#source'].toLowerCase()]._id,
                                        entities:['contract','project']
                                    };
                                    Link.create( // Contract <-> Project
                                        newContractLink,
                                        function(err, model) {
                                            if (err) {
                                                contReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                                return callback(`Failed: ${contReport}`);
                                            }
                                            contReport += (`Linked contract ${row['#contract+identifier']} with project ${row['#project']} in the DB.\n`);
                                            if (row['#project+company'] != "") {
                                                var newContCompLink = {
                                                    contract: cmodel._id,
                                                    company: companies[row['#project+company'].toLowerCase()]._id,
                                                    source: sources[row['#source'].toLowerCase()]._id,
                                                    entities:['contract','company']
                                                };
                                                Link.create( // Contract <-> Company
                                                    newContCompLink,
                                                    function(err, model) {
                                                        if (err) {
                                                            contReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                                            return callback(`Failed: ${contReport}`);
                                                        }
                                                        contReport += (`Linked contract ${row['#contract+identifier']} with company ${row['#project+company']} in the DB.\n`);
                                                        return callback(null, row, contReport);
                                                    }
                                                );
                                            }
                                            else return callback(null, row, contReport);
                                        }
                                    );
                                }
                            );
                        }
                    }
                );
            }
            else {
                contReport += "No contract found in row\n";
                return callback(null, row, contReport);
            }
        };
        //Then linked concessions
        var processCandCRowConcessions = function(row, reportSoFar, callback) {
            var concReport = reportSoFar;
            if (row['#project+concession'] != "") {
                Concession.findOne(
                    {$or: [
                        {concession_name: row['#project+concession']},
                        {"concession_aliases.alias": row['#project+concession']}
                    ]
                    },
                    function(err, doc) {
                        if (err) {
                            concReport += (`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                            return callback(`Failed: ${concReport}`);
                        }
                        else if (doc) { //Found concession, now see if its linked to project, company, contract
                            concReport += (`Concession ${row['#project+concession']} exists, updating facts and checking for links\n`);
                            async.series(
                                [
                                    function (linkcallback) {
                                        //TODO to change it for 0.6 as it is a bit more explicit there
                                        var newConcession = {}; //Holder for potentially new fact; in theory don't need to check if it exists
                                        var newProjectData = {}; //ditto, copy across to project (TODO: this is for the 0.5 template and may change)
                                        if ((row['#project+company'] != "") && (row['#project+company+isOperator'] != "") && (row['#project+company+isOperator'] == "TRUE")) {
                                            newConcession.concession_operated_by = {company: companies[row['#project+company'].toLowerCase()]._id, source: sources[row['#source'].toLowerCase()]._id};
                                            newProjectData.proj_operated_by = {company: companies[row['#project+company'].toLowerCase()]._id, source: sources[row['#source'].toLowerCase()]._id};
                                        }
                                        if ((row['#project+company'] != "") && (row['#project+company+share'] != "")) {
                                            var share = parseInt(row['#project+company+share'].replace("%", ""))/100.0;
                                            newConcession.concession_company_share = {company: companies[row['#project+company'].toLowerCase()]._id, number: share, source: sources[row['#source'].toLowerCase()]._id};
                                            newProjectData.proj_company_share = {company: companies[row['#project+company'].toLowerCase()]._id, number: share, source: sources[row['#source'].toLowerCase()]._id};
                                        }
                                        if (row['#project+concession+country+identifier'] != "") {
                                            newConcession.concession_country = {country: countries[row['#project+concession+country+identifier']]._id, source: sources[row['#source'].toLowerCase()]._id};
                                        }
                                        Concession.update(
                                            {_id: doc._id},
                                            {$addToSet: //Only create new fact if wasn't here before
                                            newConcession,
                                            },
                                            {},
                                            function (err, cmodel) {
                                                if (err) return linkcallback(err);
                                                Project.update(
                                                    {_id: projects[row['#project'].toLowerCase()]._id},
                                                    {$addToSet: //Only create new fact if wasn't here before
                                                    newProjectData,
                                                    },
                                                    {},
                                                    function (cperr, cpmodel) {
                                                        if (cperr) return linkcallback(cperr);
                                                        return linkcallback(null);
                                                    }
                                                );
                                            }
                                        );
                                    },
                                    function (linkcallback) { //Concession <-> Project Link
                                        Link.findOne(
                                            {
                                                concession: doc._id,
                                                project: projects[row['#project'].toLowerCase()]._id,
                                                source: sources[row['#source'].toLowerCase()]._id
                                            },
                                            function(err, ldoc) {
                                                if (err) return linkcallback(err);
                                                else if (ldoc) {
                                                    concReport += (`Concession ${row['#project+concession']} is already linked with project ${row['#project']}, not adding\n`);
                                                    return linkcallback(null);
                                                }
                                                else {
                                                    var newConcessionLink = {
                                                        concession: doc._id,
                                                        project: projects[row['#project'].toLowerCase()]._id,
                                                        source: sources[row['#source'].toLowerCase()]._id,
                                                        entities:['concession','project']
                                                    };
                                                    Link.create(
                                                        newConcessionLink,
                                                        function(err, model) {
                                                            if (err) return linkcallback(err);
                                                            concReport += (`Linked concession ${row['#project+concession']} with project ${row['#project']} in the DB.\n`);
                                                            return linkcallback(null);
                                                        }
                                                    );
                                                }
                                            });
                                    },
                                    function (linkcallback) { //Concession <-> Company Link
                                        if (row['#project+company'] != "") {
                                            Link.findOne(
                                                {
                                                    concession: doc._id,
                                                    company: companies[row['#project+company'].toLowerCase()]._id,
                                                    source: sources[row['#source'].toLowerCase()]._id
                                                },
                                                function(err, ldoc) {
                                                    if (err) return linkcallback(err);
                                                    else if (ldoc) {
                                                        concReport += (`Concession ${row['#project+concession']} is already linked with company ${row['#project+company']}, not adding\n`);
                                                        return linkcallback(null);
                                                    }
                                                    else {
                                                        var newConcessionCompLink = {
                                                            concession: doc._id,
                                                            company: companies[row['#project+company'].toLowerCase()]._id,
                                                            source: sources[row['#source'].toLowerCase()]._id,
                                                            entities:['concession','company']
                                                        };
                                                        Link.create(
                                                            newConcessionCompLink,
                                                            function(err, model) {
                                                                if (err) return linkcallback(err);
                                                                concReport += (`Linked concession ${row['#project+concession']} with company ${row['#project+company']} in the DB.\n`);
                                                                return linkcallback(null);
                                                            }
                                                        );
                                                    }
                                                });
                                        }
                                        else return linkcallback(null);
                                    },
                                    function (linkcallback) { //Concession <-> Contract Link
                                        if (row['#contract+identifier'] != "") {
                                            Link.findOne(
                                                {
                                                    concession: doc._id,
                                                    contract: contracts[row['#contract+identifier']]._id,
                                                    source: sources[row['#source'].toLowerCase()]._id
                                                },
                                                function(err, ldoc) {
                                                    if (err) return linkcallback(err);
                                                    else if (ldoc) {
                                                        concReport += (`Concession ${row['#project+concession']} is already linked with contract ${row['#contract+identifier']}, not adding\n`);
                                                        return linkcallback(null);
                                                    }
                                                    else {
                                                        var newConcessionContLink = {
                                                            concession: doc._id,
                                                            contract: contracts[row['#contract+identifier']]._id,
                                                            source: sources[row['#source'].toLowerCase()]._id,
                                                            entities:['concession','contract']
                                                        };
                                                        Link.create(
                                                            newConcessionContLink,
                                                            function(err, model) {
                                                                if (err) return linkcallback(err);
                                                                concReport += (`Linked concession ${row['#project+concession']} with contract ${row['#contract+identifier']} in the DB.\n`);
                                                                return linkcallback(null);
                                                            }
                                                        );
                                                    }
                                                });
                                        }
                                        else return linkcallback(null);
                                    }
                                ],
                                function (err) {
                                    if (err) {
                                        concReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                        return callback(`Failed: ${concReport}`);
                                    }
                                    return callback(null, concReport);
                                }
                            );
                        }
                        else { //No concession, create and link
                            //TODO to change it for 0.6 as it is a bit more explicit there
                            var newConcession = {
                                concession_name: row['#project+concession'],
                                concession_established_source: sources[row['#source'].toLowerCase()]._id
                            };
                            var newProjectData = {};
                            if ((row['#project+company'] != "") && (row['#project+company+isOperator'] != "") && (row['#project+company+isOperator'] == "TRUE")) {
                                newConcession.concession_operated_by = {company: companies[row['#project+company'].toLowerCase()]._id, source: sources[row['#source'].toLowerCase()]._id}
                                newProjectData.proj_operated_by = {company: companies[row['#project+company'].toLowerCase()]._id, source: sources[row['#source'].toLowerCase()]._id};
                            }
                            if ((row['#project+company'] != "") && (row['#project+company+share'] != "")) {
                                var share = parseInt(row['#project+company+share'].replace("%", ""))/100.0;
                                newConcession.concession_company_share = {company: companies[row['#project+company'].toLowerCase()]._id, number: share, source: sources[row['#source'].toLowerCase()]._id}
                                newProjectData.proj_company_share = {company: companies[row['#project+company'].toLowerCase()]._id, number: share, source: sources[row['#source'].toLowerCase()]._id};
                            }
                            if (row['#project+concession+country+identifier'] != "") {
                                newConcession.concession_country = {country: countries[row['#project+concession+country+identifier']]._id, source: sources[row['#source'].toLowerCase()]._id}
                            }
                            Concession.create(
                                newConcession,
                                function(err, cmodel) {
                                    if (err) {
                                        concReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                        return callback(`Failed: ${concReport}`);
                                    }
                                    concReport += (`Created concession ${row['#project+concession']}.\n`);
                                    async.series(
                                        [
                                            function (linkcallback) {
                                                Project.update(
                                                    {_id: projects[row['#project'].toLowerCase()]._id},
                                                    {$addToSet: //Only create new fact if wasn't here before
                                                    newProjectData,
                                                    },
                                                    {},
                                                    function (cperr, cpmodel) {
                                                        if (cperr) return linkcallback(cperr);
                                                        return linkcallback(null);
                                                    }
                                                );
                                            },
                                            function (linkcallback) { // concession <-> project
                                                var newConcessionLink = {
                                                    concession: cmodel._id,
                                                    project: projects[row['#project'].toLowerCase()]._id,
                                                    source: sources[row['#source'].toLowerCase()]._id,
                                                    entities:['concession','project']
                                                };
                                                Link.create(
                                                    newConcessionLink,
                                                    function(err, model) {
                                                        if (err) return linkcallback(err);
                                                        concReport += (`Linked concession ${row['#project+concession']} with project ${row['#project']} in the DB.\n`);
                                                        return linkcallback(null);
                                                    }
                                                );
                                            },
                                            function (linkcallback) { // concession <-> contract
                                                if (row['#contract+identifier'] != "") {
                                                    var newConcessionContLink = {
                                                        concession: cmodel._id,
                                                        contract: contracts[row['#contract+identifier']]._id,
                                                        source: sources[row['#source'].toLowerCase()]._id,
                                                        entities:['concession','contract']
                                                    };
                                                    Link.create(
                                                        newConcessionContLink,
                                                        function(err, model) {
                                                            if (err) return linkcallback(err);
                                                            concReport += (`Linked concession ${row['#project+concession']} with contract ${row['#contract+identifier']} in the DB.\n`);
                                                            return linkcallback(null);
                                                        }
                                                    );
                                                }
                                                else return linkcallback(null);
                                            },
                                            function (linkcallback) { // concession <-> company
                                                if (row['#project+company'] != "") {
                                                    var newConcessionCompLink = {
                                                        concession: cmodel._id,
                                                        company: companies[row['#project+company'].toLowerCase()]._id,
                                                        source: sources[row['#source'].toLowerCase()]._id,
                                                        entities:['concession','company']
                                                    };
                                                    Link.create(
                                                        newConcessionCompLink,
                                                        function(err, model) {
                                                            if (err) return linkcallback(err);
                                                            concReport += (`Linked concession ${row['#project+concession']} with company ${row['#project+company']} in the DB.\n`);
                                                            return linkcallback(null);
                                                        }
                                                    );
                                                }
                                                else return linkcallback(null);
                                            }
                                        ],
                                        function (err) {
                                            if (err) {
                                                concReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                                return callback(`Failed: ${concReport}`);
                                            }
                                            return callback(null, concReport);
                                        }
                                    );
                                }
                            );
                        }
                    }
                );
            }
            else {
                concReport += "No concession found in row\n";
                return callback(null, concReport);
            }
        };

        var processCandCRow = function(candcReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
            if ((row['#source'] == "#source") || ((row['#project+company'] == "") && (row['#contract+identifier'] == "") && (row['#project+concession'] == ""))) {
                candcReport.add("Concessions and Contracts: Empty row or label.\n");
                return callback(null); //Do nothing
            }
            if (!sources[row['#source'].toLowerCase()] ) {
                candcReport.add(`Invalid source in row: ${inspect.util(row)}. Aborting.\n`);
                return callback(`Failed: ${candcReport.report}`);
            }
            async.waterfall([
                    processCandCRowCompanies.bind(null, row), //First do companies, then with contracts we can link contracts+companies
                    processCandCRowContracts,
                    processCandCRowConcessions                //Second do contracts, then with concessions we can link comp+conc and contr+conc
                ],
                function (err, result) {
                    if (err) {
                        candcReport.add(`Processing of company/contract/concessions caused an error: ${err}\n`);
                        return callback(`Processing of company/contract/concession caused an error: ${err}\n`);
                    }
                    candcReport.add(result);
                    return callback(null);
                }
            );
        }
        contracts = new Object;
        parseEntity(result, '7', null, processCandCRow, null, null, null, null, null, callback);
    }

    function parseProduction(result, callback) {
        var processProductionRow = function(prodReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
            //This serves 2 purposes, check for blank rows and skip rows with no value
            if (row['#project+production+volume'] === "") {
                prodReport.add("Productions: Empty row.\n");
                return callback(null); //Do nothing
            }
            //TODO?: Currently hard req. for country, commodity, year. If proj or company there should be valid.
            if ((row['#country+identifier'] === "") || !countries[row['#country+identifier']] || ((row['#project'] !== "") && !projects[row['#project'].toLowerCase()] ) || ((row['#company'] !== "") && !companies[row['#company'].toLowerCase()] ) || !sources[row['#source'].toLowerCase()] || (row['#project+production+commodity'] === "") || !commodities[row['#project+production+commodity']] || (row['#project+production+year'] === "") ) {
                prodReport.add(`Invalid or missing data in row: ${util.inspect(row)}. Aborting.\n`);
                return callback(`Failed: ${prodReport.report}`);
            }
            //Production - match by country + project/company (if present) + year + commodity
            //TODO extend for sites later
            //TODO extend for concessions later if this makes it into template
            var query = {
                production_commodity: ObjectId(commodities[row['#project+production+commodity']]._id),
                production_year: parseInt(row['#project+production+year']),
                country: ObjectId(countries[row['#country+identifier']]._id)
            };
            if (row['#project'] !== "") {
                query.project = ObjectId(projects[row['#project'].toLowerCase()]._id);
            }
             prodReport.add(util.inspect(query, {showHidden: true, colors: true, depth: 5}));
            Production.findOne(
                query,
                {}, //return only _id
                {},
                function(err, doc) {
                    if (err) {
                        prodReport.add(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                        return callback(`Failed: ${prodReport.report}`);
                    }
                    else if (doc) {
                        prodReport.add(`Production ${row['#project']}/${row['#project+production+commodity']}/${row['#project+production+year']} already exists in the DB, not adding\n`);
                        return callback(null);
                    }
                    else {
                        var newProduction = makeNewProduction(row);
                        Production.create(
                            newProduction,
                            function(err, model) {
                                if (err) {
                                    prodReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                    return callback(`Failed: ${prodReport.report}`);
                                };
                                prodReport.add(`Production ${row['#project']}/${row['#project+production+commodity']}/${row['#project+production+year']} added\n`);
                                return callback(null)
                            }
                        );
                    }
                }
            );
        };
        parseEntity(result, '8', null, processProductionRow, null, null, null, null, null, callback);
    }

    function parseTransfers(result, callback) {
        var processTransferRow = function(transReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
            //This serves 2 purposes, check for blank rows and skip rows with no value
            if (((row['#governmentReceipt+value'] === "") && (row['#companyPayment+value'] === ""))) {
                transReport.add("Transfers: Empty row or label, or no volume data.\n");
                return callback(null); //Do nothing
            }
            //Hard req. for country at this point
            if (((row['#project'] !== "") && !projects[row['#project'].toLowerCase()]) || !sources[row['#source'].toLowerCase()] || row['#country+identifier'] === "" || !countries[row['#country+identifier']] ) {
                transReport.add(`Invalid or missing data in row: ${inspect.util(row)}. Aborting.\n`);
                return callback(`Failed: ${transReport.report}`);
            }
            //Transfer - many possible ways to match
            //Determine if payment or receipt
            var transfer_audit_type = "";
            if (row['#governmentReceipt+value'] !== "") {
                transfer_audit_type = "government_receipt";
                transfer_type = "receipt";
            }
            else if (row['#companyPayment+value'] !== "") {
                transfer_audit_type = "company_payment";
                transfer_type = "payment";
            }
            else returnInvalid();

            //Note: no checking for existing entries but blanket acceptance of data as rows themselves can duplicate. If we ever want back (for 0.5), look in git 18/7/16
            var newTransfer = makeNewTransfer(row, transfer_audit_type);
            if (!newTransfer) {
                transReport.add(`Invalid or missing data in row: ${inspect.util(row)}. Aborting.\n`);
                return callback(`Failed: ${transReport.report}`);
            }
            Transfer.create(
                newTransfer,
                function(err, model) {
                    if (err) {
                        transReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                        return callback(`Failed: ${transReport.report}`);
                    }
                    transReport.add(`Added transfer (${util.inspect(query)}) to the DB.\n`);
                    return callback(null);
                }
            );
        };
        parseEntity(result, '10', null, processTransferRow, null, null, null, null, null, callback);
    }

    function parseReserves(result, callback) {
        result.add("Reserves IGNORED\n");
        callback(null, result);
    }
}