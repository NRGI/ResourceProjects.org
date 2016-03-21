//var Source = require('mongoose').model('Source'),
//    Country = require('mongoose').model('Country'),
//    Commodity = require('mongoose').model('Commodity'),
//    CompanyGroup = require('mongoose').model('CompanyGroup'),
//    Company = require('mongoose').model('Company'),
//    Project = require('mongoose').model('Project'),
//    Site = require('mongoose').model('Site'),
//    Link = require('mongoose').model('Link'),
//    Contract = require('mongoose').model('Contract'),
//    Concession = require('mongoose').model('Concession'),
//    Production = require('mongoose').model('Production'),
//    Transfer = require('mongoose').model('Transfer'),
//    ObjectId = require('mongoose').Types.ObjectId,
//    util = require('util'),
//    async   = require('async'),
//    csv     = require('csv'),
//    request = require('request'),
//    moment = require('moment');
//
//exports.processData = function(link, callback) {
//    var report = "";
//    var keytoend =  link.substr(link.indexOf("/d/") + 3, link.length);
//    var key = keytoend.substr(0, keytoend.indexOf("/"));
//    report += `Using link ${link}\n`;
//    if (key.length != 44) {
//        report += "Could not detect a valid spreadsheet key in URL\n";
//        callback("Failed", report);
//        return;
//    }
//    else {
//        report += `Using GS key ${key}\n`;
//    }
//    var feedurl = `https://spreadsheets.google.com/feeds/worksheets/${key}/public/full?alt=json`;
//    var sheets = new Object;
//
//    request({
//        url: feedurl,
//        json: true
//    }, function (error, response, body) {
//        if (!error && response.statusCode === 200) {
//            var numSheets = body.feed.entry.length;
//            var mainTitle = body.feed.title.$t;
//            var numProcessed = 0;
//            for (var i=0; i<body.feed.entry.length; i++) {
//                for (var j=0; j<body.feed.entry[i].link.length; j++) {
//                    if (body.feed.entry[i].link[j].type == "text/csv") {
//                        report += `Getting data from sheet "${body.feed.entry[i].title.$t}"...\n`;
//                        request({
//                            url: body.feed.entry[i].link[j].href
//                        }, (function (i, error, response, sbody) {
//                            if (error) {
//                                report += `${body.feed.entry[i].title.$t}: Could not retrieve sheet\n`;
//                                callback("Failed", report);
//                                return;
//                            }
//                            csv.parse(sbody, {trim: true}, function(err, rowdata){
//                                if (error) {
//                                    report += `${skey}: Could not parse sheet\n`;
//                                    callback("Failed", report);
//                                    return;
//                                }
//                                var item = new Object;
//                                var cd = response.headers['content-disposition'];
//
//                                item.title = body.feed.entry[i].title.$t;
//                                item.link = response.request.uri.href;
//                                item.data = rowdata;
//                                report += `${item.title}: Stored ${rowdata.length} rows\n`;
//                                sheets[item.title] = item;
//                                numProcessed++;
//                                if (numProcessed == numSheets) {
//                                    parseData(sheets, report, callback);
//                                }
//                            });
//                        }).bind(null, i));
//                    }
//                }
//            }
//        }
//        else {
//            report += "Could not get information from GSheets feed - is the sheet shared?\n"
//            callback("Failed", report);
//            return;
//        }
//    });
//}
//
//function parseGsDate(input) {
//    /* In general format should appear as DD/MM/YYYY or empty but sometimes GS has it as a date internally */
//    var result;
//    if (!input || input == "") return null;
//    else result = moment(input, "DD/MM/YYYY").format();
//    //Hope for the best
//    if (result == "Invalid date") return input;
//    else return result;
//}
//
////Data needed for inter-entity reference
//var sources, countries, commodities, companies, projects;
//
//var makeNewSource = function(flagDuplicate, newRow, duplicateId) {
//    newRow[7] = parseGsDate(newRow[7]);
//    newRow[8] = parseGsDate(newRow[8]);
//
//    var source = {
//        source_name: newRow[0],
//        source_type: newRow[2], //TODO: unnecessary?
//        /* TODO? source_type_id: String, */
//        source_url: newRow[4],
//        source_url_type: newRow[5], //TODO: unnecessary?
//        /* TODO? source_url_type_id: String, */
//        source_archive_url: newRow[6],
//        source_notes: newRow[9],
//        source_date: newRow[7],
//        retrieve_date: newRow[8]
//        /* TODO create_author:, */
//    }
//    if (flagDuplicate) {
//        source.possible_duplicate = true;
//        source.duplicate = duplicateId
//    }
//    return source;
//}
//
//var makeNewCommodity = function(newRow) {
//    var commodity = {
//        commodity_name: newRow[9],
//        commodity_type: newRow[8].toLowerCase().replace(/ /g, "_")
//    }
//    return commodity;
//}
//
//var makeNewCompanyGroup = function(newRow) {
//    var returnObj = {obj: null, link: null};
//    var companyg = {
//        company_group_name: newRow[7]
//    };
//
//    if (newRow[0] != "") {
//        if (sources[newRow[0]]) { //Must be here due to lookups in sheet
//            companyg.company_group_record_established = sources[newRow[0]]._id;
//        }
//        else return false; //error
//    }
//    returnObj.obj = companyg;
//    //console.log("new company group: " + util.inspect(returnObj));
//    return returnObj;
//}
//
//var makeNewCompany = function(newRow) {
//    var returnObj = {obj: null, link: null};
//    var company = {
//        company_name: newRow[3]
//    };
//
//    if (newRow[5] != "") {
//        company.open_corporates_id = newRow[5];
//    }
//    if (newRow[2] != "") {
//        //TODO: This is not very helpful for the end user
//        if (!countries[newRow[2]]) {
//            console.log("SERIOUS ERROR: Missing country in the DB");
//            return false;
//        }
//        company.country_of_incorporation = [{country: countries[newRow[2]]._id}]; //Fact
//    }
//    if (newRow[6] != "") {
//        company.company_website = {string: newRow[6]}; //Fact, will have comp. id added later
//    }
//    if (newRow[0] != "") {
//        if (sources[newRow[0]]) { //Must be here due to lookups in sheet
//            company.company_established_source = sources[newRow[0]]._id;
//        }
//        else return false; //error
//    }
//
//    if (newRow[7] != "") {
//        //TODO: Also should check aliases in each object
//        returnObj.link = {company_group: company_groups[newRow[8]]._id};
//    }
//
//    returnObj.obj = company;
//    return returnObj;
//}
//
//var makeNewProject = function(newRow) {
//    var project = {
//        proj_name: newRow[1],
//    };
//    return project;
//}
//
//var updateProjectFacts = function(doc, row, report)
//{
//    var fact;
//    //Update status and commodity
//    if (row[9] != "") {
//        var notfound = true;
//        if (doc.proj_commodity) {
//            for (fact of doc.proj_commodity) {
//                //No need to check if commodity exists as commodities are taken from here
//                //TODO: In general, do we want to store multiple sources for the same truth? [from GS]
//                if (commodities[row[9]]._id == fact.commodity._id) {
//                    notfound = false;
//                    report.add(`Project commodity ${row[9]} already exists in project, not adding\n`);
//                    break;
//                }
//            }
//        }
//        else doc.proj_commodity = [];
//        if (notfound) { //Commodity must be here, as based on this sheet
//            //Don't push but add, existing values will not be removed
//            doc.proj_commodity = [{commodity: commodities[row[9]]._id, source: sources[row[0]]._id}];
//            report.add(`Project commodity ${row[9]} added to project\n`);
//        }
//    }
//    else if (doc.proj_commodity) delete doc.proj_commodity; //Don't push
//
//    if (row[10] != "") {
//        var notfound = true;
//        if (doc.proj_status) {
//            for (fact of doc.proj_status) {
//                if (row[10] == fact.string) {
//                    notfound = false;
//                    report.add(`Project status ${row[10]} already exists in project, not adding\n`);
//                    break;
//                }
//            }
//        }
//        else doc.proj_status = [];
//        if (notfound) {
//            //Don't push but add, existing values will not be removed
//            doc.proj_status = [{string: row[10].toLowerCase(), date: parseGsDate(row[11]), source: sources[row[0]]._id}];
//            report.add(`Project status ${row[10]} added to project\n`);
//        }
//    }
//    else if (doc.proj_status) delete doc.proj_status; //Don't push
//
//    //TODO... projects with mulitple countries, really?
//    if (row[5] != "") {
//        var notfound = true;
//        if (doc.proj_country) { //TODO: project without a country???
//            for (fact of doc.proj_country) {
//                if (countries[row[5]]._id == fact.country._id) {
//                    notfound = false;
//                    report.add(`Project country ${row[5]} already exists in project, not adding\n`);
//                    break;
//                }
//            }
//        }
//        else doc.proj_country = [];
//        if (notfound) {
//            //Don't push but add, existing values will not be removed
//            doc.proj_country = [{country: countries[row[5]]._id, source: sources[row[0]]._id}];
//            report.add(`Project country ${row[5]} added to project\n`);
//        }
//    }
//    else if (doc.proj_country) delete doc.proj_country; //Don't push
//    return doc;
//}
//
//var makeNewSite = function(newRow) {
//    var site = {
//        site_name: newRow[2],
//        site_established_source: sources[newRow[0]]._id,
//        site_country: [{country: countries[newRow[5]]._id, source: sources[newRow[0]]._id}] //TODO: How in the world can there multiple versions of country
//    }
//    if (newRow[3] != "") site.site_address = [{string: newRow[3], source: sources[newRow[0]]._id}];
//    //TODO FIELD INFO     field: Boolean //
//    if (newRow[6] != "") site.site_coordinates = [{loc: [parseFloat(newRow[6]), parseFloat(newRow[7])], source: sources[newRow[0]]._id}];
//    return site;
//}
//
//var makeNewProduction = function(newRow) {
//    var production = {
//        production_commodity: commodities[newRow[8]]._id,
//        production_year: parseInt(newRow[5]),
//        //production_project: projects[newRow[3]]._id,
//        source: sources[newRow[0]]._id
//    }
//
//    if (newRow[7] != "") {
//        production.production_unit = newRow[7];
//    }
//    if (newRow[6] != "") {
//        production.production_volume = newRow[6].replace(/,/g, "");
//    }
//    if (newRow[9] != "") {
//        production.production_price = newRow[9].replace(/,/g, "");
//    }
//    if (newRow[10] != "") {
//        production.production_price_per_unit = newRow[10];
//    }
//
//    return production;
//}
//
//var makeNewTransfer = function(newRow, transfer_audit_type) {
//    //TODO: This is not very helpful for the end user
//    if (!countries[newRow[2]]) {
//        console.log("SERIOUS ERROR: Missing country in the DB");
//        return false;
//    }
//
//    var transfer = {
//        source: sources[newRow[0]]._id,
//        transfer_country: countries[newRow[2]]._id,
//        transfer_audit_type: transfer_audit_type
//    };
//
//    if (newRow[3] != "") {
//        transfer.transfer_company = companies[newRow[3]]._id;
//    }
//
//    if (newRow[4] != "") {
//        transfer.transfer_line_item = newRow[4];
//    }
//
//    if (newRow[5] != "") {
//        transfer.transfer_level = "project";
//        //transfer.transfer_project = projects[newRow[5]]._id;
//    }
//    else {
//        transfer.transfer_level = "country";
//    }
//
//    if (transfer_audit_type == "government_receipt") {
//        transfer.transfer_year = parseInt(newRow[13]);
//        transfer.transfer_type = newRow[17];
//        transfer.transfer_unit = newRow[19];
//        transfer.transfer_value = newRow[21].replace(/,/g, "");
//        if (newRow[20] != "") transfer.transfer_accounting_basis = newRow[20];
//        if (newRow[15] != "") transfer.transfer_gov_entity = newRow[15];
//        if (newRow[16] != "") transfer.transfer_gov_entity_id = newRow[16];
//    }
//    else if (transfer_audit_type == "company_payment") {
//        transfer.transfer_audit_type = "company_payment";
//        transfer.transfer_year = parseInt(newRow[6]);
//        transfer.transfer_type = newRow[5];
//        transfer.transfer_unit = newRow[7];
//        transfer.transfer_value = newRow[9].replace(/,/g, "");
//        if (newRow[8] != "") transfer.transfer_accounting_basis = newRow[8];
//    }
//    else return false;
//
//    return transfer;
//}
//
////TODO: This needs some more work, specifically which properties to compare
//equalDocs = function(masterDoc, newDoc) {
//    for (property in newDoc) {
//        if (masterDoc[property]) {
//            if (newDoc[property] != masterDoc[property]) {
//                return false;
//            }
//        }
//        else return false;
//    }
//    return true;
//}
//
//processGenericRow = function(report, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
//    if ((row[rowIndex] == "") || (row[rowIndex][0] == "#")) {
//        report.add(entityName + ": Empty row or label.\n");
//        return callback(null); //Do nothing
//    }
//    var finderObj = {};
//    finderObj[modelKey] = row[rowIndex];
//    model.findOne(
//        finderObj,
//        function(err, doc) {
//            if (err) {
//                report.add(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
//                return callback(`Failed: ${report.report}`);
//            }
//            else if (doc) {
//                report.add(`${entityName} ${row[rowIndex]} already exists in the DB (name match), not adding\n`);
//                destObj[row[rowIndex]] = doc;
//                return callback(null);
//            }
//            else {
//                model.create(
//                    makerFunction(row),
//                    function(err, createdModel) {
//                        if (err) {
//                            report.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                            return callback(`Failed: ${report.report}`);
//                        }
//                        report.add(`Added ${entityName} ${row[rowIndex]} to the DB.\n`);
//                        destObj[row[rowIndex]] = createdModel;
//                        return callback(null);
//                    }
//                );
//            }
//        }
//    );
//}
//
////This handles companies and company groups
////Not the maker function returns an object with a sub-object
//processCompanyRow = function(companiesReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
//    if ((row[rowIndex] == "") || (row[rowIndex][0] == "#")) {
//        companiesReport.add(entityName + ": Empty row or label.\n");
//        return callback(null); //Do nothing
//    }
//    //Check against name and aliases
//    //TODO - may need some sort of sophisticated duplicate detection here
//    var queryEntry1 = {};
//    queryEntry1[modelKey] = row[rowIndex];
//    var queryEntry2 = {};
//    queryEntry2[modelKey+'_aliases.alias'] = row[rowIndex]; //TODO!!! Cannot be searched this way (no pre-population)
//
//    model.findOne(
//        {$or: [
//            queryEntry1,
//            queryEntry2
//        ]},
//        function(err, doc) {
//            var testAndCreateLink = function(skipTest, link, company_id) {
//                var createLink = function() {
//                    link.entities = ['company', 'company_group'];
//                    Link.create(link, function(err, nlmodel) {
//                        if (err) {
//                            companiesReport.add(`Encountered an error (${err}) adding link to DB. Aborting.\n`);
//                            return callback(`Failed: ${companiesReport.report}`);
//                        }
//                        else {
//                            companiesReport.add(`Created link\n`);
//                            return callback(null);
//                        }
//                    });
//                };
//                if (!skipTest) {
//                    link.company = company_id;
//                    Link.findOne(
//                        link,
//                        function (err, lmodel) {
//                            if (err) {
//                                companiesReport.add(`Encountered an error (${err}) while querying DB. Aborting.\n`);
//                                return callback(`Failed: ${companiesReport.report}`);
//                            }
//                            else if (lmodel) {
//                                companiesReport.add(`Link already exists in the DB, not adding\n`);
//                                return callback(null);
//                            }
//                            else {
//                                createLink();
//                            }
//                        }
//                    );
//                }
//                else createLink();
//            }
//            if (err) {
//                companiesReport.add(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
//                return callback(`Failed: ${companiesReport.report}`);
//            }
//            else if (doc) {
//                destObj[row[rowIndex]] = doc;
//                companiesReport.add(`${entityName} ${row[rowIndex]} already exists in the DB (name or alias match), not adding. Checking for link creation need.\n`);
//                var testObj = makerFunction(row);
//                if (testObj && testObj.link) {
//                    testAndCreateLink(false, testObj.link, doc._id);
//                }
//                else {
//                    companiesReport.add(`No link to make\n`);
//                    return callback(null);
//                }
//            }
//            else {
//                var newObj = makerFunction(row);
//                if (!newObj) {
//                    companiesReport.add(`Invalid data in row: ${row}. Aborting.\n`);
//                    return callback(`Failed: ${companiesReport.report}`);
//                }
//                model.create(
//                    newObj.obj,
//                    function(err, cmodel) {
//                        if (err) {
//                            companiesReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                            return callback(`Failed: ${companiesReport.report}`);
//                        }
//                        companiesReport.add(`Added ${entityName} ${row[rowIndex]} to the DB.\n`);
//                        destObj[row[rowIndex]] = cmodel;
//                        if (newObj.link) {
//                            testAndCreateLink(true, newObj.link, cmodel._id);
//                        }
//                        else return callback(null);
//                    }
//                );
//            }
//        }
//    );
//};
//
//function parseData(sheets, report, finalcallback) {
//    async.waterfall([
//            parseBasis,
//            parseCompanyGroups,
//            parseCompanies,
//            parseProjects,
//            parseConcessionsAndContracts,
//            parseProduction,
//            parseTransfers,
//            parseReserves
//        ], function (err, report) {
//            if (err) {
//                console.log("PARSE: Got an error\n");
//                return finalcallback("Failed", report)
//            }
//            finalcallback("Success", report);
//        }
//    );
//
//    ;
//
//    function parseEntity(reportSoFar, sheetname, dropRowsStart, dropRowsEnd, entityObj, processRow, entityName, rowIndex, model, modelKey, rowMaker, callback) {
//        var intReport = {
//            report: reportSoFar, //Relevant for the series waterfall - report gets passed along
//            add: function(text) {
//                this.report += text;
//            }
//        }
//        //Drop first X, last Y rows
//        var data = sheets[sheetname].data.slice(dropRowsStart, (sheets[sheetname].data.length - dropRowsEnd));
//        //TODO: for some cases parallel is OK: differentiate
//        async.eachSeries(data, processRow.bind(null, intReport, entityObj, entityName, rowIndex, model, modelKey, rowMaker), function (err) { //"A callback which is called when all iteratee functions have finished, or an error occurs."
//            if (err) {
//                return callback(err, intReport.report); //Giving up
//            }
//            callback(null, intReport.report); //All good
//        });
//    }
//
//    function parseBasis(callback) {
//        var basisReport = report + "Processing basis info\n";
//
//        async.parallel([
//            parseSources,
//            parseCountries,
//            parseCommodities
//        ], (function (err, resultsarray) {
//            console.log("PARSE BASIS: Finished parallel tasks OR got an error");
//            for (var r=0; r<resultsarray.length; r++) {
//                if (!resultsarray[r]) {
//                    basisReport += "** NO RESULT **\n";
//                }
//                else basisReport += resultsarray[r];
//            }
//            if (err) {
//                console.log("PARSE BASIS: Got an error");
//                basisReport += `Processing of basis info caused an error: ${err}\n`;
//                return callback(`Processing of basis info caused an error: ${err}\n`, basisReport);
//            }
//            console.log("Finished parse basis");
//            callback(null, basisReport);
//        }));
//
//        function parseCountries(callback) {
//            //Complete country list is in the DB
//            var creport = "Getting countries from database...\n";
//            countries = new Object;
//            Country.find({}, function (err, cresult) {
//                if (err) {
//                    creport += `Got an error: ${err}`;
//                    callback(err, creport);
//                }
//                else {
//                    creport += `Found ${cresult.length} countries`;
//                    var ctry;
//                    for (ctry of cresult) {
//                        countries[ctry.iso2] = ctry;
//                    }
//                    callback(null, creport);
//                }
//            });
//        }
//
//        function parseCommodities(callback) {
//            //TODO: In some sheets only a group is named...
//            commodities = new Object;
//            //The list of commodities of relevance for this dataset is taken from the location/status/commodity list
//            parseEntity("", '5. Project location, status, commodity', 3, 0, commodities, processGenericRow, "Commodity", 9, Commodity, "commodity_name", makeNewCommodity, callback);
//        }
//
//        function parseSources(callback) {
//            var processSourceRow = function(sourcesReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
//                if ((row[0] == "") || (row[0] == "#source")) {
//                    sourcesReport.add("Sources: Empty row or label.\n");
//                    return callback(null); //Do nothing
//                }
//                //TODO: Find OLDEST (use that for comparison instead of some other duplicate - important where we create duplicates)
//                //TODO - may need some sort of sophisticated duplicate detection here
//                Source.findOne(
//                    {source_url: row[4].toLowerCase()},
//                    function(err, doc) {
//                        if (err) {
//                            sourcesReport.add(`Encountered an error while querying the DB: ${err}. Aborting.\n`);
//                            return callback(`Failed: ${sourcesReport.report}`);
//                        }
//                        else if (doc) {
//                            sourcesReport.add(`Source ${row[0]} already exists in the DB (url match), checking content\n`);
//                            if (equalDocs(doc, makeNewSource(false, row))) {
//                                sourcesReport.add(`Source ${row[0]} already exists in the DB (url match), not adding\n`);
//                                sources[row[0]] = doc;
//                                return callback(null);
//                            }
//                            else {
//                                sourcesReport.add(`Source ${row[0]} already exists in the DB (url match),flagging as duplicate\n`);
//                                Source.create(
//                                    makeNewSource(true, row, doc._id),
//                                    function(err, model) {
//                                        if (err) {
//                                            sourcesReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                                            return callback(`Failed: ${sourcesReport.report}`);
//                                        }
//                                        sources[row[0]] = model;
//                                        return callback(null);
//                                    }
//                                );
//                            }
//                        }
//                        else {
//                            Source.findOne(
//                                {source_name: row[0]},
//                                (function(err, doc) {
//                                    if (err) {
//                                        sourcesReport.add(`Encountered an error while querying the DB: ${err}. Aborting.\n`);
//                                        return callback(`Failed: ${sourcesReport.report}`);
//                                    }
//                                    else if (doc) {
//                                        sourcesReport.add(`Source ${row[0]} already exists in the DB (name match), will flag as possible duplicate\n`);
//                                        Source.create(
//                                            makeNewSource(true, row, doc._id),
//                                            (function(err, model) {
//                                                if (err) {
//                                                    sourcesReport.add(`Encountered an error while creating a source in the DB: ${err}. Aborting.\n`);
//                                                    return callback(`Failed: ${sourcesReport.report}`);
//                                                }
//                                                sources[row[0]] = model;
//                                                return callback(null);
//                                            })
//                                        );
//                                    }
//                                    else {
//                                        sourcesReport.add(`Source ${row[0]} not found in the DB, creating\n`);
//                                        Source.create(
//                                            makeNewSource(false, row),
//                                            (function(err, model) {
//                                                if (err) {
//                                                    sourcesReport.add(`Encountered an error while creating a source in the DB: ${err}. Aborting.\n`);
//                                                    return callback(`Failed: ${sourcesReport.report}`);
//                                                }
//                                                sources[row[0]] = model;
//                                                return callback(null);
//                                            })
//                                        );
//                                    }
//                                })
//                            );
//                        }
//                    }
//                );
//            };
//            sources = new Object;
//            //TODO - refactor processSourceRow to use generic row or similar?
//            parseEntity("", '2. Source List', 3, 0, sources, processSourceRow, "Source", 0, Source, "source_name", makeNewSource, callback);
//        }
//
//    }
//
//    function parseCompanyGroups(result, callback) {
//        company_groups = new Object;
//        parseEntity(result, '6. Companies and Groups', 3, 0, company_groups, processCompanyRow, "CompanyGroup", 7, CompanyGroup, "company_group_name", makeNewCompanyGroup, callback);
//    }
//
//    function parseCompanies(result, callback) {
//        companies = new Object;
//        parseEntity(result, '6. Companies and Groups', 3, 0, companies, processCompanyRow, "Company", 3, Company, "company_name", makeNewCompany, callback);
//    }
//
//    //TODO: make more generic, entity names etc.
//    function createSiteProjectLink (siteId, projectId, report, lcallback) {
//        Link.create({project: projectId, site: siteId, entities: ['project', 'site']},
//            function (err, nlmodel) {
//                if (err) {
//                    report.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                    return lcallback(`Failed: ${report.report}`);
//                }
//                else {
//                    report.add(`Linked site to project in the DB.\n`);
//                    return lcallback(null); //Final step, no return value
//                }
//            }
//        );
//    }
//
//    function parseProjects(result, callback) {
//        var processProjectRow = function(projectsReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
//            if ((row[rowIndex] == "") || (row[1] == "#project")) {
//                projectsReport.add("Projects: Empty row or label.\n");
//                return callback(null); //Do nothing
//            }
//
//            function updateOrCreateProject(projDoc, wcallback) {
//                var doc_id = null;
//
//                if (!projDoc) {
//                    projDoc = makeNewProject(row);
//                }
//                else {
//                    doc_id = projDoc._id;
//                    projDoc = projDoc.toObject();
//                    delete projDoc._id; //Don't send id back in to Mongo
//                    delete projDoc.__v; //https://github.com/Automattic/mongoose/issues/1933
//                }
//
//                final_doc = updateProjectFacts(projDoc, row, projectsReport);
//
//                if (!final_doc) {
//                    projectsReport.add(`Invalid data in row: ${row}. Aborting.\n`);
//                    return wcallback(`Failed: ${projectsReport.report}`);
//                }
//
//                //console.log("Sent:\n" + util.inspect(final_doc));
//
//                if (!doc_id) doc_id = new ObjectId;
//                Project.findByIdAndUpdate(
//                    doc_id,
//                    final_doc,
//                    {setDefaultsOnInsert: true, upsert: true, new: true},
//                    function(err, model) {
//                        if (err) {
//                            //console.log(err);
//                            projectsReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                            return wcallback(`Failed: ${projectsReport.report}`);
//                        }
//                        //console.log("Returned\n: " + model)
//                        projectsReport.add(`Added or updated project ${row[rowIndex]} to the DB.\n`);
//                        projects[row[rowIndex]] = model;
//                        return wcallback(null, model); //Continue to site stuff
//                    }
//                );
//            }
//
//            function createSiteAndLink(projDoc, wcallback) {
//                if (row[2] != "") {
//                    Site.findOne(
//                        {$or: [
//                            {site_name: row[2]},
//                            {"site_aliases.alias": row[2]} //TODO: FIX POPULATE ETC.?
//                        ]},
//                        function (err, sitemodel) {
//                            if (err) {
//                                projectsReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                                return wcallback(`Failed: ${projectsReport.report}`);
//                            }
//                            else if (sitemodel) {
//                                //Site already exists - check for link, could be missing if site is from another project
//                                var found = false;
//                                Link.find({project: projDoc._id, site: sitemodel._id},
//                                    function (err, sitelinkmodel) {
//                                        if (err) {
//                                            projectsReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                                            return wcallback(`Failed: ${projectsReport.report}`);
//                                        }
//                                        else if (sitelinkmodel) {
//                                            projectsReport.add(`Link to ${row[2]} already exists in the DB, not adding\n`);
//                                            return wcallback(null);
//                                        }
//                                        else {
//                                            createSiteProjectLink(sitemodel._id, projDoc._id, projectsReport, wcallback);
//                                        }
//                                    }
//                                );
//                            }
//                            else { //Site doesn't exist - create and link
//                                Site.create(
//                                    makeNewSite(row),
//                                    function (err, newsitemodel) {
//                                        if (err) {
//                                            projectsReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                                            return wcallback(`Failed: ${projectsReport.report}`);
//                                        }
//                                        else {
//                                            createSiteProjectLink(newsitemodel._id, projDoc._id, projectsReport, wcallback);
//                                        }
//                                    }
//                                );
//                            }
//                        }
//                    );
//                }
//                else { //Nothing more to do
//                    projectsReport.add(`No site info in row\n`);
//                    return wcallback(null);
//                }
//            }
//
//            //Projects - check against name and aliases
//            //TODO - may need some sort of sophisticated duplicate detection here
//            Project.findOne(
//                {$or: [
//                    {proj_name: row[rowIndex]},
//                    {"proj_aliases.alias": row[rowIndex]} //TODO: FIX POPULATE ETC.?
//                ]},
//                function(err, doc) {
//                    //console.log(doc);
//                    if (err) {
//                        projectsReport.add(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
//                        return callback(`Failed: ${projectsReport.report}`);
//                    }
//                    else if (doc) { //Project already exists, row might represent a new site
//                        projectsReport.add(`Project ${row[rowIndex]} already exists in the DB (name or alias match), not adding but updating facts and checking for new sites\n`);
//                        projects[row[rowIndex]] = doc; //Basis data is always the same, OK if this gets called multiple times
//                        async.waterfall( //Waterfall because we want to be able to cope with a result or error being returned
//                            [updateOrCreateProject.bind(null, doc),
//                                createSiteAndLink], //Gets proj. id passed as result
//                            function (err, result) {
//                                if (err) {
//                                    return callback(`Failed: ${projectsReport.report}`);
//                                }
//                                else {
//                                    //All done
//                                    return callback(null);
//                                }
//                            }
//                        );
//                    }
//                    else {
//                        projectsReport.add(`Project ${row[rowIndex]} not found, creating.\n`);
//                        async.waterfall( //Waterfall because we want to be able to cope with a result or error being returned
//                            [updateOrCreateProject.bind(null, null), //Proj = null = create it please
//                                createSiteAndLink], //Gets proj. id passed as result
//                            function (err, result) {
//                                if (err) {
//                                    return callback(`Failed: ${projectsReport.report}`);
//                                }
//                                else {
//                                    //All done
//                                    return callback(null);
//                                }
//                            }
//                        );
//                    }
//                }
//            );
//        };
//        projects = new Object;
//        parseEntity(result, '5. Project location, status, commodity', 3, 0, projects, processProjectRow, "Project", 1, Project, "proj_name", makeNewProject, callback);
//    }
//
//    function parseConcessionsAndContracts(result, callback) {
//        //First linked companies
//        var processCandCRowCompanies = function(row, callback) {
//            var compReport = "";
//            if (row[2] != "") {
//                if (!companies[row[2]] || !projects[row[1]] || !sources[row[0]] ) {
//                    compReport += (`Invalid data in row: ${row}. Aborting.\n`);
//                    return callback(`Failed: ${compReport}`);
//                }
//                Link.findOne(
//                    {
//                        company: companies[row[2]]._id,
//                        project: projects[row[1]]._id
//                    },
//                    function(err, doc) {
//                        if (err) {
//                            compReport += (`Encountered an error (${err}) while querying the DB. Aborting.\n`);
//                            return callback(`Failed: ${compReport}`);
//                        }
//                        else if (doc) {
//                            compReport += (`Company ${row[2]} is already linked with project ${row[1]}, not adding\n`);
//                            return callback(null, compReport);
//                        }
//                        else {
//                            var newCompanyLink = {
//                                company: companies[row[2]]._id,
//                                project: projects[row[1]]._id,
//                                source: sources[row[0]]._id,
//                                entities:['company','project']
//                            };
//                            Link.create(
//                                newCompanyLink,
//                                function(err, model) {
//                                    if (err) {
//                                        compReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                                        return callback(`Failed: ${compReport}`);
//                                    }
//                                    compReport += (`Linked company ${row[2]} with project ${row[1]} in the DB.\n`);
//                                    return callback(null, compReport);
//                                }
//                            );
//                        }
//                    }
//                );
//            }
//            else return callback(null, "No company found in row\n");
//        };
//        //Linked contracts - all based on ID (for API look up)
//        var processCandCRowContracts = function(row, callback) {
//            var contReport = "";
//            if (row[7] != "") {
//                Contract.findOne({
//                        contract_id: row[7]
//                    },
//                    function(err, doc) {
//                        if (err) {
//                            contReport += (`Encountered an error (${err}) while querying the DB. Aborting.\n`);
//                            return callback(`Failed: ${contReport}`);
//                        }
//                        else if (doc) { //Found contract, now see if its linked
//                            contReport += (`Contract ${row[7]} exists, checking for link\n`);
//                            Link.findOne(
//                                {
//                                    contract: doc._id,
//                                    project: projects[row[1]]._id
//                                },
//                                function(err, ldoc) {
//                                    if (err) {
//                                        contReport += (`Encountered an error (${err}) while querying the DB. Aborting.\n`);
//                                        return callback(`Failed: ${contReport}`);
//                                    }
//                                    else if (ldoc) {
//                                        contReport += (`Contract ${row[7]} is already linked with project ${row[1]}, not adding\n`);
//                                        return callback(null, contReport);
//                                    }
//                                    else {
//                                        var newContractLink = {
//                                            contract: doc._id,
//                                            project: projects[row[1]]._id,
//                                            source: sources[row[0]]._id,
//                                            entities:['contract','project']
//                                        };
//                                        Link.create(
//                                            newContractLink,
//                                            function(err, model) {
//                                                if (err) {
//                                                    contReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                                                    return callback(`Failed: ${contReport}`);
//                                                }
//                                                contReport += (`Linked contract ${row[7]} with project ${row[1]} in the DB.\n`);
//                                                return callback(null, contReport);
//                                            }
//                                        );
//                                    }
//                                });
//                        }
//                        else { //No contract, create and link
//                            var newContract = {
//                                contract_id: row[7]
//                            };
//                            Contract.create(
//                                newContract,
//                                function(err, cmodel) {
//                                    if (err) {
//                                        contReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                                        return callback(`Failed: ${contReport}`);
//                                    }
//                                    contReport += (`Created contract ${row[7]}.\n`);
//                                    //Now create Link
//                                    var newContractLink = {
//                                        contract: cmodel._id,
//                                        project: projects[row[1]]._id,
//                                        source: sources[row[0]]._id,
//                                        entities:['contract','project']
//                                    };
//                                    Link.create(
//                                        newContractLink,
//                                        function(err, model) {
//                                            if (err) {
//                                                contReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                                                return callback(`Failed: ${contReport}`);
//                                            }
//                                            contReport += (`Linked contract ${row[7]} with project ${row[1]} in the DB.\n`);
//                                            return callback(null, contReport);
//                                        }
//                                    );
//                                }
//                            );
//                        }
//                    }
//                );
//            }
//            else return callback(null, "No contract found in row\n");
//        };
//        //Then linked concessions
//        var processCandCRowConcessions = function(row, callback) {
//            var concReport = "";
//            if (row[8] != "") {
//                Concession.findOne(
//                    {$or: [
//                        {concession_name: row[8]},
//                        {"concession_aliases.alias": row[8]} //TODO, alias population
//                    ]
//                    },
//                    function(err, doc) {
//                        if (err) {
//                            concReport += (`Encountered an error (${err}) while querying the DB. Aborting.\n`);
//                            return callback(`Failed: ${concReport}`);
//                        }
//                        else if (doc) { //Found concession, now see if its linked
//                            concReport += (`Contract ${row[8]} exists, checking for link\n`);
//                            Link.findOne(
//                                {
//                                    concession: doc._id,
//                                    project: projects[row[1]]._id
//                                },
//                                function(err, ldoc) {
//                                    if (err) {
//                                        concReport += (`Encountered an error (${err}) while querying the DB. Aborting.\n`);
//                                        return callback(`Failed: ${concReport}`);
//                                    }
//                                    else if (ldoc) {
//                                        concReport += (`Concession ${row[8]} is already linked with project ${row[1]}, not adding\n`);
//                                        return callback(null, concReport);
//                                    }
//                                    else {
//                                        var newConcessionLink = {
//                                            concession: doc._id,
//                                            project: projects[row[1]]._id,
//                                            source: sources[row[0]]._id,
//                                            entities:['concession','project']
//                                        };
//                                        Link.create(
//                                            newConcessionLink,
//                                            function(err, model) {
//                                                if (err) {
//                                                    concReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                                                    return callback(`Failed: ${concReport}`);
//                                                }
//                                                concReport += (`Linked concession ${row[8]} with project ${row[1]} in the DB.\n`);
//                                                return callback(null, concReport);
//                                            }
//                                        );
//                                    }
//                                });
//                        }
//                        else { //No concession, create and link
//                            var newConcession = {
//                                concession_name: row[8],
//                                concession_established_source: sources[row[0]]._id
//                            };
//                            if (row[10] != "") {
//                                newConcession.concession_country = {country: countries[row[10]]._id, source: sources[row[0]]._id}
//                            }
//                            Concession.create(
//                                newConcession,
//                                function(err, cmodel) {
//                                    if (err) {
//                                        concReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                                        return callback(`Failed: ${concReport}`);
//                                    }
//                                    concReport += (`Created concession ${row[8]}.\n`);
//                                    //Now create Link
//                                    var newConcessionLink = {
//                                        concession: cmodel._id,
//                                        project: projects[row[1]]._id,
//                                        source: sources[row[0]]._id,
//                                        entities:['concession','project']
//                                    };
//                                    Link.create(
//                                        newConcessionLink,
//                                        function(err, model) {
//                                            if (err) {
//                                                concReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                                                return callback(`Failed: ${concReport}`);
//                                            }
//                                            concReport += (`Linked concession ${row[8]} with project ${row[1]} in the DB.\n`);
//                                            return callback(null, concReport);
//                                        }
//                                    );
//                                }
//                            );
//                        }
//                    }
//                );
//            }
//            else return callback(null, "No concession found in row\n");
//        };
//
//        var processCandCRow = function(candcReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
//            if ((row[0] == "#source") || ((row[2] == "") && (row[7] == "") && (row[8] == ""))) {
//                candcReport.add("Concessions and Contracts: Empty row or label.\n");
//                return callback(null); //Do nothing
//            }
//            if (!sources[row[0]] ) {
//                candcReport.add(`Invalid source in row: ${row}. Aborting.\n`);
//                return callback(`Failed: ${candcReport.report}`);
//            }
//            async.parallel([
//                    processCandCRowCompanies.bind(null, row),
//                    processCandCRowContracts.bind(null, row),
//                    processCandCRowConcessions.bind(null, row)
//                ],
//                function (err, resultsarray) {
//                    for (var r=0; r<resultsarray.length; r++) {
//                        if (!resultsarray[r]) {
//                            candcReport.add("** NO RESULT **\n");
//                        }
//                        else candcReport.add(resultsarray[r]);
//                    }
//                    if (err) {
//                        candcReport.add(`Processing of company/contract/concessions caused an error: ${err}\n`);
//                        return callback(`Processing of company/contract/concession caused an error: ${err}\n`, candcReport.report);
//                    }
//                    return callback(null);
//                }
//            );
//        }
//        parseEntity(result, '7. Contracts, concessions and companies', 4, 0, null, processCandCRow, null, null, null, null, null, callback);
//    }
//
//    //TODO: This is definitely a candidate for bringing into genericrow with custom query
//    function parseProduction(result, callback) {
//        var processProductionRow = function(prodReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
//            //This serves 2 purposes, check for blank rows and skip rows with no value
//            if ((row[6] == "") || (row[0] == "#source")) {
//                prodReport.add("Productions: Empty row or label, or no volume data.\n");
//                return callback(null); //Do nothing
//            }
//            //TODO: Currently hard req. for project. Country and Company seem to be optional and unused.
//            //thereby data can only be grabbed via project therefore req. project!
//            if (/*(row[2] == "") || !countries[row[2]] || */(row[3] == "") || !sources[row[0]] || (row[8] == "") || !commodities[row[8]] || (row[5] == "") ) {
//                prodReport += (`Invalid or missing data in row: ${row}. Aborting.\n`);
//                return callback(`Failed: ${prodReport}`);
//            }
//            //Here we depend on links, use controller
//
//            //Production - match (ideally) by (country???) + project (if present???) + year + commodity
//            //BUT (TODO) there is currently no easy way of grabbing country & project
//            Production.findOne(
//                {
//                    production_commodity: commodities[row[8]]._id,
//                    production_year: parseInt(row[5]),
//                },
//                function(err, doc) {
//                    if (err) {
//                        prodReport.add(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
//                        return callback(`Failed: ${prodReport.report}`);
//                    }
//                    else if (doc) {
//                        prodReport.add(`Production ${row[3]}/${row[8]}/${row[5]} already exists in the DB, not adding\n`);
//                        return callback(null);
//                    }
//                    else {
//                        var newProduction = makeNewProduction(row);
//                        Production.create(
//                            newProduction,
//                            function(err, model) {
//                                if (err) {
//                                    prodReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                                    return callback(`Failed: ${prodReport.report}`);
//                                }
//                                //TODO: Link Production<->Project, (Production<->Country ???)
//                                //As productions can only exist with a project (TODO: check), go ahead and create the link
//                                Link.create(
//                                    {project: projects[row[3]]._id, production: model._id, entities: ['project', 'production']},
//                                    function name(err, lmodel) {
//                                        if (err) {
//                                            prodReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                                            return callback(`Failed: ${prodReport.report}`);
//                                        }
//                                        else {
//                                            prodReport.add(`Added production ${row[3]}/${row[8]}/${row[5]} to the DB and linked to project.\n`);
//                                            return callback(null);
//                                        }
//                                    }
//                                );
//                            }
//                        );
//                    }
//                }
//            );
//        };
//        parseEntity(result, '8. Production', 3, 0, null, processProductionRow, null, null, null, null, null, callback);
//    }
//
//    function parseTransfers(result, callback) {
//        var processTransferRow = function(transReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
//            //This serves 2 purposes, check for blank row${util.inspect(query)s and skip rows with no value
//            if (((row[21] == "") && (row[9] == "")) || (row[0] == "#source")) {
//                transReport.add("Transfers: Empty row or label, or no volume data.\n");
//                return callback(null); //Do nothing
//            }
//            //This, in turn is a little harsh to abort of payment type is missing, but it does make for an invalid row
//            if ((row[5] == "") || !projects[row[5]] || !sources[row[0]] || !countries[row[2]] || (row[17] == "") ) {
//                transReport += (`Invalid or missing data in row: ${row}. Aborting.\n`);
//                return callback(`Failed: ${transReport}`);
//            }
//            //Transfer - many possible ways to match
//            //Determine if payment or receipt
//            var transfer_audit_type = "";
//            if (row[21] != "") {
//                transfer_audit_type = "government_receipt"
//                transfer_type = "receipt";
//            }
//            else if (row[9] != "") {
//                transfer_audit_type = "company_payment";
//                transfer_type = "payment";
//            }
//            else returnInvalid();
//
//            //TODO: How to match without projects in the transfers any more?
//            var query = {transfer_country: countries[row[2]]._id, transfer_audit_type: transfer_audit_type};
//            if (row[5] != "") {
//                //query.transfer_project = projects[row[5]]._id;
//                query.transfer_level = "project";
//            }
//            else query.transfer_level = "country";
//
//            if (row[3] != "") {
//                query.transfer_company = companies[row[3]]._id;
//            }
//
//            if (transfer_type == "payment") {
//                query.transfer_year = parseInt(row[6]);
//                query.transfer_type = row[8];
//            }
//            else {
//                query.transfer_year = parseInt(row[13]);
//                query.transfer_type = row[17];
//                if (row[15] != "") {
//                    query.transfer_gov_entity = row[15];
//                }
//                if (row[16] != "") {
//                    query.transfer_gov_entity_id = row[16];
//                }
//            }
//
//            Transfer.findOne(
//                query,
//                function(err, doc) {
//                    if (err) {
//                        transReport.add(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
//                        return callback(`Failed: ${transReport.report}`);
//                    }
//                    else if (doc) {
//                        transReport.add(`Transfer (${util.inspect(query)}) already exists in the DB, not adding\n`);
//                        return callback(null);
//                    }
//                    else {
//                        var newTransfer = makeNewTransfer(row, transfer_audit_type);
//                        if (!newTransfer) {
//                            transReport += (`Invalid or missing data in row: ${row}. Aborting.\n`);
//                            return callback(`Failed: ${transReport}`);
//                        }
//                        Transfer.create(
//                            newTransfer,
//                            function(err, model) {
//                                if (err) {
//                                    transReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                                    return callback(`Failed: ${transReport.report}`);
//                                }
//                                //TODO: Link Transfer<->Project, (Transfer<->Company ???)
//                                //Can't find the transfer without a project (if there is one), so go ahead and create it without checks
//                                if (row[5] != "") {
//                                    Link.create(
//                                        {project: projects[row[5]]._id, transfer: model._id, entities: ['project', 'transfer']},
//                                        function name(err, lmodel) {
//                                            if (err) {
//                                                transReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
//                                                return callback(`Failed: ${transReport.report}`);
//                                            }
//                                            else {
//                                                transReport.add(`Added transfer (${util.inspect(query)}) with project link to the DB.\n`);
//                                                return callback(null);
//                                            }
//                                        }
//                                    );
//                                }
//                                else {
//                                    transReport.add(`Added transfer (${util.inspect(query)}) to the DB without project link.\n`);
//                                    return callback(null);
//                                }
//                            }
//                        );
//                    }
//                }
//            );
//        };
//        parseEntity(result, '10. Payments and receipts', 3, 0, null, processTransferRow, null, null, null, null, null, callback);
//    }
//
//    function parseReserves(result, callback) {
//        result += "Reserves IGNORED\n";
//        callback(null, result);
//    }
//}