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
    csv     = require('csv'),
    request = require('request'),
    moment = require('moment'),
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
            var numSheets = body.feed.entry.length;
            var mainTitle = body.feed.title.$t;
            var numProcessed = 0;
            for (var i=0; i<body.feed.entry.length; i++) {
                for (var j=0; j<body.feed.entry[i].link.length; j++) {
                    if (body.feed.entry[i].link[j].type == "text/csv") {
                        report += `Getting data from sheet "${body.feed.entry[i].title.$t}"...\n`;
                        request({
                            url: body.feed.entry[i].link[j].href
                        }, (function (i, error, response, sbody) {
                            if (error) {
                                report += `${body.feed.entry[i].title.$t}: Could not retrieve sheet\n`;
                                callback("Failed", report);
                                return;
                            }
                            csv.parse(sbody, {trim: true}, function(err, rowdata){
                                if (error) {
                                    report += `${skey}: Could not parse sheet\n`;
                                    callback("Failed", report);
                                    return;
                                }
                                var item = new Object;
                                var cd = response.headers['content-disposition'];
                                
                                item.title = body.feed.entry[i].title.$t;
                                item.link = response.request.uri.href;
                                item.data = rowdata;
                                report += `${item.title}: Stored ${rowdata.length} rows\n`;
                                sheets[item.title] = item;
                                numProcessed++;
                                if (numProcessed == numSheets) {
                                    var reporter = {
                                        report: report,
                                        add: function(more) {
                                            this.report += more;
                                        }
                                    }
                                    parseData(sheets, reporter, callback);
                                }
                            });
                        }).bind(null, i));
                    }
                }
            }
        }
        else {
            report += "Could not get information from GSheets feed - is the sheet shared?\n"
            callback("Failed", report);
            return;
        }
    });
}

function parseGsDate(input) {
    /* In general format should appear as DD/MM/YYYY or empty but sometimes GS has it as a date internally */
    var result;
    if (!input || input == "") return null;
    else result = moment(input, "DD/MM/YYYY").format();
    //Hope for the best
    if (result == "Invalid date") return input;
    else return result;
}

//Data needed for inter-entity reference
var sourceTypes, sources, countries, commodities, commoditiesById, companies, company_groups, projects, contracts;

//TODO: Move to new duplicates model
var makeNewSource = function(flagDuplicate, newRow, duplicateId) {
    newRow[7] = parseGsDate(newRow[7]);
    newRow[8] = parseGsDate(newRow[8]);
   
   if (!sourceTypes[newRow[2]]) {
       console.log("SERIOUS ERROR: Missing source type in the DB");
       return false;
   }
   
    var source = {
        source_name: newRow[0],
        source_type_id: sourceTypes[newRow[2]]._id,
        source_url: newRow[4],
        source_url_type: newRow[5], //TODO: unnecessary?
        /* TODO? source_url_type_id: String, */
        source_archive_url: newRow[6],
        source_notes: newRow[9],
        source_date: newRow[7],
        retrieve_date: newRow[8]
        /* TODO create_author:, */
    }
    if (flagDuplicate) {
        source.possible_duplicate = true;
        source.duplicate = duplicateId
    }
    return source;
}

var makeNewCommodity = function(newRow) {
    var commodity = {
        commodity_name: newRow[9],
        commodity_type: newRow[8].toLowerCase().replace(/ /g, "_")
    }
    return commodity;
}

var makeNewCompanyGroup = function(newRow) {
    //TODO: https://github.com/NRGI/rp-org-frontend/issues/34
    var returnObj = {obj: null, link: null};
    var companyg = {
        company_group_name: newRow[7]
    };

    if (newRow[0] != "") {
        if (sources[newRow[0].toLowerCase()]) { //Must be here due to lookups in sheet
            companyg.company_group_record_established = sources[newRow[0].toLowerCase()]._id;
        }
        else return false; //error
    }
    returnObj.obj = companyg;
    //console.log("new company group: " + util.inspect(returnObj));
    return returnObj;
}

var makeNewCompany = function(newRow) {
    //TODO: https://github.com/NRGI/rp-org-frontend/issues/34
    var returnObj = {obj: null, link: null};
    var company = {
        company_name: newRow[3]
    };

    if (newRow[5] != "") {
        company.open_corporates_id = newRow[5].split('/').pop(); //URL in 0.5. May change to ID in 0.6.
    }
    if (newRow[2] != "") {
        //TODO: This is not very helpful for the end user
        if (!countries[newRow[2]]) {
            console.log("SERIOUS ERROR: Missing country in the DB");
            return false;
        }
        company.country_of_incorporation = [{country: countries[newRow[2]]._id}]; //Fact
    }
    if (newRow[6] != "") {
        company.company_website = {string: newRow[6]}; //Fact, will have comp. id added later
    }
    if (newRow[0] != "") {
        if (sources[newRow[0].toLowerCase()]) { //Must be here due to lookups in sheet
            company.company_established_source = sources[newRow[0].toLowerCase()]._id;
        }
        else return false; //error
    }
    
    if (newRow[7] != "") {
        //TODO: Also should check aliases in each object
        returnObj.link = {company_group: company_groups[newRow[7].toLowerCase()]._id, source: sources[newRow[0].toLowerCase()]._id};
    }
    
    returnObj.obj = company;
    return returnObj;
}

var makeNewProject = function(newRow) {
    var project = {
        proj_name: newRow[1],
    };
    return project;
}

var updateProjectFacts = function(doc, row, report)
{
    //TODO:
    //-- Test addtoset operator thing and check that duplicate facts don't get added
    //In general should be allowing duplicates unless coming from same source
    //Then, insert this code to properly insert operated_by and company_share:
    /*                                  if ((row[2] != "") && (row[4] != "") && (row[4] != "TRUE")) {
                                            newConcession.concession_operated_by = [{company: companies[row[2].toLowerCase()]._id, source: sources[row[0].toLowerCase()]._id}]
                                        }
                                        if ((row[2] != "") && (row[3] != "")) {
                                            var share = parseInt(row[3].replace("%", ""))/100.0;
                                            newConcession.concession_company_share = [{company: companies[row[2].toLowerCase()]._id, number: share, source: sources[row[0].toLowerCase()]._id}]
                                        }
    */
    //Then check that no arrays of arrays etc are getting created

    var fact;
    //Update status and commodity           
    if (row[9] != "") {
        var notfound = true;
        if (doc.proj_commodity) {
            for (fact of doc.proj_commodity) {
                //No need to check if commodity exists as commodities are taken from here
                //TODO: In general, do we want to store multiple sources for the same truth? [from GS]
                if (commodities[row[9]]._id == fact.commodity._id) {
                    notfound = false;
                    report.add(`Project commodity ${row[9]} already exists in project, not adding\n`);
                    break;
                }
            }
        }
        else doc.proj_commodity = [];
        if (notfound) { //Commodity must be here, as based on this sheet
            //Don't push but add, existing values will not be removed
            //console.log(row[9]);
            doc.proj_commodity = [{commodity: commodities[row[9]]._id, source: sources[row[0].toLowerCase()]._id}];
            report.add(`Project commodity ${row[9]} added to project\n`);
        }
    }
    else if (doc.proj_commodity) delete doc.proj_commodity; //Don't push
    
    if (row[10] != "") {
        var notfound = true;
        if (doc.proj_status) {
            for (fact of doc.proj_status) {
                if (row[10] == fact.string) {
                    notfound = false;
                    report.add(`Project status ${row[10]} already exists in project, not adding\n`);
                    break;
                }
            }
        }
        else doc.proj_status = [];
        if (notfound) {
            //Don't push but add, existing values will not be removed
            var status;
            if (row[10].indexOf('/') != -1) {
                status = row[10].split('/')[1]; //Workaround to cope with "construction/development"
            }
            else status = row[10];
            status = status.toLowerCase().replace(/ /g, '_');
            doc.proj_status = [{string: status, timestamp: parseGsDate(row[11]), source: sources[row[0].toLowerCase()]._id}];
            report.add(`Project status ${row[10]} added to project\n`);
        }
    }
    else if (doc.proj_status) delete doc.proj_status; //Don't push
    
    //TODO... projects with mulitple countries, really?
    //TODO: This can probably be simplified with $addToSet!
    if (row[5] != "") {
        var notfound = true;
        if (doc.proj_country) { //TODO: project without a country???
            for (fact of doc.proj_country) {
                if (countries[row[5]]._id == fact.country._id) {
                    notfound = false;
                    report.add(`Project country ${row[5]} already exists in project, not adding\n`);
                    break;
                }
            }
        }
        else doc.proj_country = [];
        if (notfound) {
            //Don't push but add, existing values will not be removed
            doc.proj_country = [{country: countries[row[5]]._id, source: sources[row[0].toLowerCase()]._id}];
            report.add(`Project country ${row[5]} added to project\n`);
        }
    }
    else if (doc.proj_country) delete doc.proj_country; //Don't push
    return doc;
}

var makeNewSite = function(newRow, projDoc) {
    var site = {
        site_name: newRow[2],
        site_established_source: sources[newRow[0].toLowerCase()]._id,
        site_country: [{country: countries[newRow[5]]._id, source: sources[newRow[0].toLowerCase()]._id}] //TODO: How in the world can there multiple versions of country
    }
    if (newRow[3] != "") site.site_address = [{string: newRow[3], source: sources[newRow[0].toLowerCase()]._id}];
    if (newRow[6] != "") site.site_coordinates = [{loc: [parseFloat(newRow[6]), parseFloat(newRow[7])], source: sources[newRow[0].toLowerCase()]._id}];
    if (newRow[9] != "") site.site_commodity = [{commodity: commodities[newRow[9]]._id, source: sources[newRow[0].toLowerCase()]._id}]; 
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
    
    if (newRow[10] != "") {
        var status;
        if (newRow[10].indexOf('/') != -1) {
            status = newRow[10].split('/')[1]; //Workaround to cope with "construction/development"
        }
        else status = newRow[10];
        status = status.toLowerCase().replace(/ /g, '_');
        site.site_status = [{string: status, timestamp: parseGsDate(newRow[11]), source: sources[newRow[0].toLowerCase()]._id}];
    }
    
    return site;
}

var makeNewProduction = function(newRow) {
    var production = {
        production_commodity: commodities[newRow[8]]._id,
        production_year: parseInt(newRow[5]),
        production_country: countries[newRow[2]]._id,
        source: sources[newRow[0].toLowerCase()]._id
    }
    if (newRow[3] != "") {
        production.project = projects[newRow[3].toLowerCase()]._id;
    }
    if (newRow[4] != "") {
        production.company = companies[newRow[4].toLowerCase()]._id;
    }
    if (newRow[7] != "") {
        production.production_unit = newRow[7];
    }
    if (newRow[6] != "") {
        production.production_volume = newRow[6].replace(/,/g, "");
    }
    if (newRow[9] != "") {
        production.production_price = newRow[9].replace(/,/g, "");
    }
    if (newRow[10] != "") {
        production.production_price_unit = newRow[10];
    }
    
    return production;
}

var makeNewTransfer = function(newRow, transfer_audit_type) {
    var transfer = {
        source: sources[newRow[0].toLowerCase()]._id,
        country: countries[newRow[2]]._id,
        transfer_audit_type: transfer_audit_type
    };
    
    if (newRow[3] != "") {
        transfer.company = companies[newRow[3].toLowerCase()]._id;
    }
    
    if (newRow[4] != "") {
        transfer.transfer_line_item = newRow[4];
    }
    
    if (newRow[5] != "") {
        transfer.transfer_level = "project";
        transfer.project = projects[newRow[5].toLowerCase()]._id;
    }
    else {
        transfer.transfer_level = "country";
    }
    
    if (transfer_audit_type == "government_receipt") {
        transfer.transfer_year = parseInt(newRow[13]);
        transfer.transfer_type = newRow[17];
        transfer.transfer_unit = newRow[19];
        transfer.transfer_value = newRow[21].replace(/,/g, "");
        if (newRow[20] != "") transfer.transfer_accounting_basis = newRow[20];
        if (newRow[15] != "") transfer.transfer_gov_entity = newRow[15];
        if (newRow[16] != "") transfer.transfer_gov_entity_id = newRow[16];
    }
    else if (transfer_audit_type == "company_payment") {
        transfer.transfer_audit_type = "company_payment";
        transfer.transfer_year = parseInt(newRow[6]);
        transfer.transfer_type = newRow[8];
        transfer.transfer_unit = newRow[10];
        transfer.transfer_value = newRow[12].replace(/,/g, "");
        if (newRow[11] != "") transfer.transfer_accounting_basis = newRow[11];
    }
    else return false;
    
    return transfer;
}

//TODO: This needs some more work, specifically which properties to compare
equalDocs = function(masterDoc, newDoc) {
    for (property in newDoc) {
        if (masterDoc[property]) {
            if (newDoc[property] != masterDoc[property]) {
                return false;
            }
        }
        else return false;
    }
    return true;
}

//This handles companies and company groups
//Not the maker function returns an object with a sub-object
processCompanyRow = function(companiesReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
    if ((row[rowIndex] == "") || (row[rowIndex][0] == "#")) {
        companiesReport.add(entityName + ": Empty row or label.\n");
        return callback(null); //Do nothing
    }
    //Check against name and aliases
    //TODO - may need some sort of sophisticated duplicate detection here
    var queryEntry1 = {};
    queryEntry1[modelKey] = row[rowIndex];
    var queryEntry2 = {};
    queryEntry2[modelKey+'_aliases.alias'] = row[rowIndex]; //TODO!!! Cannot be searched this way (no pre-population)
    
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
            }
            if (err) {
                companiesReport.add(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                return callback(`Failed: ${companiesReport.report}`);
            }
            else if (doc) {
                destObj[row[rowIndex].toLowerCase()] = doc;
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
                    companiesReport.add(`Invalid data in row: ${row}. Aborting.\n`);
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
        parseConcessionsAndContracts,
        parseProduction,
        parseTransfers,
        parseReserves
        //links throughout!//
    ], function (err, report) {
        if (err) {
            console.log(err);
            console.log("PARSE: Got an error\n");
            return finalcallback("Failed", report.report);
        }
        finalcallback("Success", report.report);
        }
    );

    function parseEntity(reportSoFar, sheetname, dropRowsStart, dropRowsEnd, entityObj, processRow, entityName, rowIndex, model, modelKey, rowMaker, callback) {
        //Drop first X, last Y rows
        var data = sheets[sheetname].data.slice(dropRowsStart, (sheets[sheetname].data.length - dropRowsEnd));
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
        sourceTypes = new Object;
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
    };

    function parseCountries(result, callback) {
        //Complete country list is in the DB
        result.add("Getting countries from database...\n");
        countries = new Object;
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
                    commoditiesById[cmty._id] = cmty;
                }
                callback(null, result);
            }
        });
    }

    function parseSources(result, callback) {
        var processSourceRow = function(sourcesReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
            if ((row[0] == "") || (row[0] == "#source")) {
                sourcesReport.add("Sources: Empty row or label.\n");
                return callback(null); //Do nothing
            }
            //TODO - may need some sort of sophisticated duplicate detection here
            Source.findOne(
                {source_url: row[4].toLowerCase()},
                null, //return everything
                { sort: { create_date: 1 } }, //Find OLDEST (use that for comparison instead of some other duplicate - important where we create duplicates)
                function(err, doc) {  
                    if (err) {
                        sourcesReport.add(`Encountered an error while querying the DB: ${err}. Aborting.\n`);
                        return callback(`Failed: ${sourcesReport.report}`);
                    }
                    else if (doc) {
                        sourcesReport.add(`Source ${row[0]} already exists in the DB (url match), checking content\n`);
                        var newSource = makeNewSource(false, row);
                        if (!newSource) {
                            sourcesReport.add(`Invalid data in row: ${row}. Aborting.\n`);
                            return callback(`Failed: ${sourcesReport.report}`);
                        }
                        if (equalDocs(doc, newSource)) {
                            sourcesReport.add(`Source ${row[0]} already exists in the DB (url match), not adding\n`);
                            sources[row[0].toLowerCase()] = doc;
                            return callback(null);
                        }
                        else {
                            sourcesReport.add(`Source ${row[0]} already exists in the DB (url match),flagging as duplicate\n`);
                            var newSource = makeNewSource(true, row, doc._id);
                            if (!newSource) {
                                sourcesReport.add(`Invalid data in row: ${row}. Aborting.\n`);
                                return callback(`Failed: ${sourcesReport.report}`);
                            }
                            Source.create(
                                newSource,
                                function(err, model) {
                                    if (err) {
                                            sourcesReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                            return callback(`Failed: ${sourcesReport.report}`);
                                    }
                                    sources[row[0].toLowerCase()] = model;
                                    return callback(null);
                                }
                            );
                        }
                    }
                    else {
                        Source.findOne(
                            {source_name: row[0]},
                            null,
                            { sort: { create_date: 1 } }, //Find OLDEST (use that for comparison instead of some other duplicate - important where we create duplicates)
                            (function(err, doc) {
                                if (err) {
                                    sourcesReport.add(`Encountered an error while querying the DB: ${err}. Aborting.\n`);
                                    return callback(`Failed: ${sourcesReport.report}`);
                                }
                                else if (doc) {
                                    sourcesReport.add(`Source ${row[0]} already exists in the DB (name match), will flag as possible duplicate\n`);
                                    var newSource = makeNewSource(true, row, doc._id);
                                    if (!newSource) {
                                        sourcesReport.add(`Invalid data in row: ${row}. Aborting.\n`);
                                        return callback(`Failed: ${sourcesReport.report}`);
                                    }
                                    Source.create(
                                        newSource,
                                        (function(err, model) {
                                            if (err) {
                                                sourcesReport.add(`Encountered an error while creating a source in the DB: ${err}. Aborting.\n`);
                                                return callback(`Failed: ${sourcesReport.report}`);
                                            }
                                            sources[row[0].toLowerCase()] = model;
                                            return callback(null);
                                        })
                                    );
                                }
                                else {
                                    sourcesReport.add(`Source ${row[0]} not found in the DB, creating\n`);
                                    var newSource = makeNewSource(false, row);
                                    if (!newSource) {
                                        sourcesReport.add(`Invalid data in row: ${row}. Aborting.\n`);
                                        return callback(`Failed: ${sourcesReport.report}`);
                                    }
                                    Source.create(
                                        newSource,
                                        (function(err, model) {
                                            if (err) {
                                                sourcesReport.add(`Encountered an error while creating a source in the DB: ${err}. Aborting.\n`);
                                                return callback(`Failed: ${sourcesReport.report}`);
                                            }
                                            sources[row[0].toLowerCase()] = model;
                                            return callback(null);
                                        })
                                    );
                                }
                            })
                        );
                    }
                }
            );
        };
        sources = new Object;
        parseEntity(result, '2. Source List', 3, 0, sources, processSourceRow, "Source", 0, Source, "source_name", makeNewSource, callback);          
    }

    function parseCompanyGroups(result, callback) {
        company_groups = new Object;
        parseEntity(result, '6. Companies and Groups', 3, 0, company_groups, processCompanyRow, "CompanyGroup", 7, CompanyGroup, "company_group_name", makeNewCompanyGroup, callback);
    }
    
    function parseCompanies(result, callback) {
        companies = new Object;
        parseEntity(result, '6. Companies and Groups', 3, 0, companies, processCompanyRow, "Company", 3, Company, "company_name", makeNewCompany, callback);
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
            if ((row[rowIndex] == "") || (row[1] == "#project")) {
                projectsReport.add("Projects: Empty row or label.\n");
                return callback(null); //Do nothing
            }
            
            function updateOrCreateProject(projDoc, wcallback) {
                    var doc_id = null;
                    
                    if (!projDoc) {
                        projDoc = makeNewProject(row);
                    }
                    else {
                        doc_id = projDoc._id;
                        projDoc = projDoc.toObject();
                        delete projDoc._id; //Don't send id back in to Mongo
                        delete projDoc.__v; //or __v: https://github.com/Automattic/mongoose/issues/1933
                    }
                    
                    final_doc = updateProjectFacts(projDoc, row, projectsReport);
                    
                    if (!final_doc) {
                        projectsReport.add(`Invalid data in row: ${row}. Aborting.\n`);
                        return wcallback(`Failed: ${projectsReport.report}`);
                    }

                    //console.log("Sent:\n" + util.inspect(final_doc));
                    
                    if (!doc_id) doc_id = new ObjectId;
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
                            if (row[5] != "") {  //Projects must have countries even if sites come afterwards
                                if (!model.proj_id) {
                                    model.update({proj_id: row[5].toLowerCase() + '-' + model.proj_name.toLowerCase().slice(0, 4) + '-' + randomstring(6).toLowerCase()},
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
                                projectsReport.add(`Invalid data in row - projects and sites must have a country (${row}). Aborting.\n`);
                                return wcallback(`Failed: ${projectsReport.report}`);
                            }
                            
                        }
                    );
            }
            
            function createSiteAndLink(projDoc, wcallback) {
                if (row[2] != "") {
                    Site.findOne(
                        {$or: [
                            {site_name: row[2]},
                            {"site_aliases.alias": row[2]} //TODO: FIX POPULATE ETC.?
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
                                if (row[3] != "") update.site_address = {string: row[3], source: sources[row[0].toLowerCase()]._id};
                                if (row[6] != "") update.site_coordinates = {loc: [parseFloat(row[6]), parseFloat(row[7])], source: sources[row[0].toLowerCase()]._id};
                                sitemodel.update({$addToSet: update});
                                //TODO: check $addToSet
                                var found = false;
                                Link.find({project: projDoc._id, site: sitemodel._id, source: sources[row[0].toLowerCase()]._id},
                                    function (err, sitelinkmodel) {
                                        if (err) {
                                            projectsReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                            return wcallback(`Failed: ${projectsReport.report}`);
                                        }
                                        else if (sitelinkmodel) {
                                            projectsReport.add(`Link to ${row[2]} already exists in the DB, not adding\n`);
                                            return wcallback(null);
                                        }
                                        else {
                                            createSiteProjectLink(sitemodel._id, projDoc._id, sources[row[0].toLowerCase()]._id, projectsReport, wcallback);  
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
                                            createSiteProjectLink(newsitemodel._id, projDoc._id, sources[row[0].toLowerCase()]._id, projectsReport, wcallback);
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
            
            //Projects - check against name and aliases
            //TODO - may need some sort of sophisticated duplicate detection here
            Project.findOne(
                {$or: [
                    {proj_name: row[rowIndex]},
                    {"proj_aliases.alias": row[rowIndex]} //TODO: FIX POPULATE ETC.?
                ]},
                function(err, doc) {
                    //console.log(doc);
                    if (err) {
                        projectsReport.add(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                        return callback(`Failed: ${projectsReport.report}`);
                    }
                    else if (doc) { //Project already exists, row might represent a new site
                        projectsReport.add(`Project ${row[rowIndex]} already exists in the DB (name or alias match), not adding but updating facts and checking for new sites\n`);
                        projects[row[rowIndex].toLowerCase()] = doc; //Basis data is always the same, OK if this gets called multiple times              
                        async.waterfall( //Waterfall because we want to be able to cope with a result or error being returned
                            [updateOrCreateProject.bind(null, doc),
                             createSiteAndLink], //Gets proj. id passed as result
                            function (err, result) {
                                if (err) {
                                    return callback(`Failed: ${projectsReport.report}`);
                                }
                                else {
                                    //All done
                                    return callback(null);
                                }
                            }
                        );
                    }
                    else {
                        projectsReport.add(`Project ${row[rowIndex]} not found, creating.\n`);
                        async.waterfall( //Waterfall because we want to be able to cope with a result or error being returned
                            [updateOrCreateProject.bind(null, null), //Proj = null = create it please
                             createSiteAndLink], //Gets proj. id passed as result
                            function (err, result) {
                                if (err) {
                                    return callback(`Failed: ${projectsReport.report}`);
                                }
                                else {
                                    //All done
                                    return callback(null);
                                }
                            }
                        );
                    }
                }
            );
        };
        projects = new Object;
        parseEntity(result, '5. Project location, status, commodity', 3, 0, projects, processProjectRow, "Project", 1, Project, "proj_name", makeNewProject, callback);
    }
    
    function parseConcessionsAndContracts(result, callback) {
        //First linked companies
        var processCandCRowCompanies = function(row, callback) {
            var compReport = "";
            if (row[2] != "") {
                if (!companies[row[2].toLowerCase()] || !projects[row[1].toLowerCase()] || !sources[row[0].toLowerCase()] ) {
                    compReport += (`Invalid data in row: ${row}. Aborting.\n`);
                    return callback(`Failed: ${compReport}`);
                }
                Link.findOne(
                    {
                        company: companies[row[2].toLowerCase()]._id,
                        project: projects[row[1].toLowerCase()]._id,
                        source: sources[row[0].toLowerCase()]._id
                    },
                    function(err, doc) {  
                        if (err) {
                            compReport += (`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                            return callback(`Failed: ${compReport}`);
                        }
                        else if (doc) {
                            compReport += (`Company ${row[2]} is already linked with project ${row[1]}, not adding\n`);
                            return callback(null, row, compReport);
                        }
                        else {
                            var newCompanyLink = {
                                company: companies[row[2].toLowerCase()]._id,
                                project: projects[row[1].toLowerCase()]._id,
                                source: sources[row[0].toLowerCase()]._id,
                                entities:['company','project']
                            };
                            Link.create(
                                newCompanyLink,
                                function(err, model) {
                                    if (err) {
                                        compReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                        return callback(`Failed: ${compReport}`);
                                    }
                                    compReport += (`Linked company ${row[2]} with project ${row[1]} in the DB.\n`); 
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
            if (row[7] != "") {
                Contract.findOne({
                        contract_id: row[7]
                    },
                    function(err, doc) {  
                        if (err) {
                            contReport += (`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                            return callback(`Failed: ${contReport}`);
                        }
                        else if (doc) { //Found contract, now see if its linked
                            contracts[row[7]] = doc;
                            contReport += (`Contract ${row[7]} exists, checking for links\n`);
                            async.series(
                                [
                                    function (linkcallback) { //Contract <-> Project Link
                                        Link.findOne(
                                        {
                                            contract: doc._id,
                                            project: projects[row[1].toLowerCase()]._id,
                                            source: sources[row[0].toLowerCase()]._id
                                        },
                                        function(err, ldoc) {  
                                            if (err) return linkcallback(err);
                                            else if (ldoc) {
                                                contReport += (`Contract ${row[7]} is already linked with project ${row[1]}, not adding\n`);
                                                return linkcallback(null);
                                            }
                                            else {
                                                var newContractLink = {
                                                    contract: doc._id,
                                                    project: projects[row[1].toLowerCase()]._id,
                                                    source: sources[row[0].toLowerCase()]._id,
                                                    entities:['contract','project']
                                                };
                                                Link.create(
                                                    newContractLink,
                                                    function(err, model) {
                                                        if (err) return linkcallback(err);
                                                        contReport += (`Linked contract ${row[7]} with project ${row[1]} in the DB.\n`); 
                                                        return linkcallback(null);
                                                    }
                                                );
                                            }
                                        });
                                    },
                                    function (linkcallback) { //Contract <-> Company Link
                                        if (row[2] != "") {
                                            Link.findOne(
                                            {
                                                contract: doc._id,
                                                company: companies[row[2].toLowerCase()]._id,
                                                source: sources[row[0].toLowerCase()]._id
                                            },
                                            function(err, ldoc) {  
                                                if (err) return linkcallback(err);
                                                else if (ldoc) {
                                                    contReport += (`Contract ${row[7]} is already linked with company ${row[2]}, not adding\n`);
                                                    return linkcallback(null);
                                                }
                                                else {
                                                    var newContCompLink = {
                                                        contract: doc._id,
                                                        company: companies[row[2].toLowerCase()]._id,
                                                        source: sources[row[0].toLowerCase()]._id,
                                                        entities:['contract','company']
                                                    };
                                                    Link.create(
                                                        newContCompLink,
                                                        function(err, model) {
                                                            if (err) return linkcallback(err);
                                                            contReport += (`Linked contract ${row[7]} with company ${row[2]} in the DB.\n`); 
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
                                contract_id: row[7]
                            };
                            Contract.create(
                                newContract,
                                function(err, cmodel) {
                                    if (err) {
                                        contReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                        return callback(`Failed: ${contReport}`);
                                    }
                                    contracts[row[7]] = cmodel;
                                    contReport += (`Created contract ${row[7]}.\n`);
                                    //Now create Link
                                    var newContractLink = {
                                        contract: cmodel._id,
                                        project: projects[row[1].toLowerCase()]._id,
                                        source: sources[row[0].toLowerCase()]._id,
                                        entities:['contract','project']
                                    };
                                    Link.create( // Contract <-> Project
                                        newContractLink,
                                        function(err, model) {
                                            if (err) {
                                                contReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                                return callback(`Failed: ${contReport}`);
                                            }
                                            contReport += (`Linked contract ${row[7]} with project ${row[1]} in the DB.\n`);
                                            if (row[2] != "") {
                                                var newContCompLink = {
                                                    contract: cmodel._id,
                                                    company: companies[row[2].toLowerCase()]._id,
                                                    source: sources[row[0].toLowerCase()]._id,
                                                    entities:['contract','company']
                                                };
                                                Link.create( // Contract <-> Company
                                                    newContCompLink,
                                                    function(err, model) {
                                                        if (err) {
                                                            contReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                                            return callback(`Failed: ${contReport}`);
                                                        }
                                                        contReport += (`Linked contract ${row[7]} with company ${row[2]} in the DB.\n`); 
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
            if (row[8] != "") {
                Concession.findOne(
                    {$or: [
                        {concession_name: row[8]},
                        {"concession_aliases.alias": row[8]} //TODO, alias population
                        ]
                    },
                    function(err, doc) {  
                        if (err) {
                            concReport += (`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                            return callback(`Failed: ${concReport}`);
                        }
                        else if (doc) { //Found concession, now see if its linked to project, company, contract
                            concReport += (`Concession ${row[8]} exists, updating facts and checking for links\n`);
                            async.series(
                                [
                                    function (linkcallback) {
                                        //TODO to change it for 0.6 as it is a bit more explicit there
                                        newConcession = {}; //Holder for potentially new fact; in theory don't need to check if it exists
                                        if ((row[2] != "") && (row[4] != "") && (row[4] != "TRUE")) {
                                            newConcession.concession_operated_by = {company: companies[row[2].toLowerCase()]._id, source: sources[row[0].toLowerCase()]._id}
                                        }
                                        if ((row[2] != "") && (row[3] != "")) {
                                            var share = parseInt(row[3].replace("%", ""))/100.0;
                                            newConcession.concession_company_share = {company: companies[row[2].toLowerCase()]._id, number: share, source: sources[row[0].toLowerCase()]._id}
                                        }
                                        if (row[10] != "") {
                                            newConcession.concession_country = {country: countries[row[10]]._id, source: sources[row[0].toLowerCase()]._id}
                                        }
                                        Concession.update(
                                            {_id: doc._id},
                                            {$addToSet: //Only create new fact if wasn't here before
                                                newConcession,
                                            },
                                            {},
                                            function (err, cmodel) {
                                                if (err) return linkcallback(err);
                                                linkcallback(null);
                                            }
                                        );
                                    },
                                    function (linkcallback) { //Concession <-> Project Link
                                        Link.findOne(
                                        {
                                            concession: doc._id,
                                            project: projects[row[1].toLowerCase()]._id,
                                            source: sources[row[0].toLowerCase()]._id
                                        },
                                        function(err, ldoc) {  
                                            if (err) return linkcallback(err);
                                            else if (ldoc) {
                                                concReport += (`Concession ${row[8]} is already linked with project ${row[1]}, not adding\n`);
                                                return linkcallback(null);
                                            }
                                            else {
                                                var newConcessionLink = {
                                                    concession: doc._id,
                                                    project: projects[row[1].toLowerCase()]._id,
                                                    source: sources[row[0].toLowerCase()]._id,
                                                    entities:['concession','project']
                                                };
                                                Link.create(
                                                    newConcessionLink,
                                                    function(err, model) {
                                                        if (err) return linkcallback(err);
                                                        concReport += (`Linked concession ${row[8]} with project ${row[1]} in the DB.\n`); 
                                                        return linkcallback(null);
                                                    }
                                                );
                                            }
                                        });
                                    },
                                    function (linkcallback) { //Concession <-> Company Link
                                        if (row[2] != "") {
                                            Link.findOne(
                                            {
                                                concession: doc._id,
                                                company: companies[row[2].toLowerCase()]._id,
                                                source: sources[row[0].toLowerCase()]._id
                                            },
                                            function(err, ldoc) {  
                                                if (err) return linkcallback(err);
                                                else if (ldoc) {
                                                    concReport += (`Concession ${row[8]} is already linked with company ${row[2]}, not adding\n`);
                                                    return linkcallback(null);
                                                }
                                                else {
                                                    var newConcessionCompLink = {
                                                        concession: doc._id,
                                                        company: companies[row[2].toLowerCase()]._id,
                                                        source: sources[row[0].toLowerCase()]._id,
                                                        entities:['concession','company']
                                                    };
                                                    Link.create(
                                                        newConcessionCompLink,
                                                        function(err, model) {
                                                            if (err) return linkcallback(err);
                                                            concReport += (`Linked concession ${row[8]} with company ${row[2]} in the DB.\n`); 
                                                            return linkcallback(null);
                                                        }
                                                    );
                                                }
                                            });
                                        }
                                        else return linkcallback(null);
                                    },
                                    function (linkcallback) { //Concession <-> Contract Link
                                        if (row[7] != "") {
                                            Link.findOne(
                                            {
                                                concession: doc._id,
                                                contract: contracts[row[7]]._id,
                                                source: sources[row[0].toLowerCase()]._id
                                            },
                                            function(err, ldoc) {  
                                                if (err) return linkcallback(err);
                                                else if (ldoc) {
                                                    concReport += (`Concession ${row[8]} is already linked with contract ${row[7]}, not adding\n`);
                                                    return linkcallback(null);
                                                }
                                                else {
                                                    var newConcessionContLink = {
                                                        concession: doc._id,
                                                        contract: contracts[row[7]]._id,
                                                        source: sources[row[0].toLowerCase()]._id,
                                                        entities:['concession','contract']
                                                    };
                                                    Link.create(
                                                        newConcessionContLink,
                                                        function(err, model) {
                                                            if (err) return linkcallback(err);
                                                            concReport += (`Linked concession ${row[8]} with contract ${row[7]} in the DB.\n`); 
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
                                concession_name: row[8],
                                concession_established_source: sources[row[0].toLowerCase()]._id
                            };
                            if ((row[2] != "") && (row[4] != "") && (row[4] != "TRUE")) {
                                newConcession.concession_operated_by = [{company: companies[row[2].toLowerCase()]._id, source: sources[row[0].toLowerCase()]._id}]
                            }
                            if ((row[2] != "") && (row[3] != "")) {
                                var share = parseInt(row[3].replace("%", ""))/100.0;
                                newConcession.concession_company_share = [{company: companies[row[2].toLowerCase()]._id, number: share, source: sources[row[0].toLowerCase()]._id}]
                            }
                            if (row[10] != "") {
                                newConcession.concession_country = [{country: countries[row[10]]._id, source: sources[row[0].toLowerCase()]._id}]
                            }
                            Concession.create(
                                newConcession,
                                function(err, cmodel) {
                                    if (err) {
                                        concReport += (`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                        return callback(`Failed: ${concReport}`);
                                    }
                                    concReport += (`Created concession ${row[8]}.\n`);
                                    async.series(
                                        [
                                            function (linkcallback) { // concession <-> project
                                                var newConcessionLink = {
                                                    concession: cmodel._id,
                                                    project: projects[row[1].toLowerCase()]._id,
                                                    source: sources[row[0].toLowerCase()]._id,
                                                    entities:['concession','project']
                                                };
                                                Link.create(
                                                    newConcessionLink,
                                                    function(err, model) {
                                                        if (err) return linkcallback(err);
                                                        concReport += (`Linked concession ${row[8]} with project ${row[1]} in the DB.\n`); 
                                                        return linkcallback(null);
                                                    }
                                                );
                                            },
                                            function (linkcallback) { // concession <-> contract
                                                if (row[7] != "") {
                                                    var newConcessionContLink = {
                                                        concession: cmodel._id,
                                                        contract: contracts[row[7]]._id,
                                                        source: sources[row[0].toLowerCase()]._id,
                                                        entities:['concession','contract']
                                                    };
                                                    Link.create(
                                                        newConcessionContLink,
                                                        function(err, model) {
                                                            if (err) return linkcallback(err);
                                                            concReport += (`Linked concession ${row[8]} with contract ${row[7]} in the DB.\n`); 
                                                            return linkcallback(null);
                                                        }
                                                    );
                                                }
                                                else return linkcallback(null);
                                            },
                                            function (linkcallback) { // concession <-> company
                                                if (row[2] != "") {
                                                    var newConcessionCompLink = {
                                                        concession: cmodel._id,
                                                        company: companies[row[2].toLowerCase()]._id,
                                                        source: sources[row[0].toLowerCase()]._id,
                                                        entities:['concession','company']
                                                    };
                                                    Link.create(
                                                        newConcessionCompLink,
                                                        function(err, model) {
                                                            if (err) return linkcallback(err);
                                                            concReport += (`Linked concession ${row[8]} with company ${row[2]} in the DB.\n`); 
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
            if ((row[0] == "#source") || ((row[2] == "") && (row[7] == "") && (row[8] == ""))) {
                candcReport.add("Concessions and Contracts: Empty row or label.\n");
                return callback(null); //Do nothing
            }
            if (!sources[row[0].toLowerCase()] ) {
                candcReport.add(`Invalid source in row: ${row}. Aborting.\n`);
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
        parseEntity(result, '7. Contracts, concessions and companies', 4, 0, null, processCandCRow, null, null, null, null, null, callback);
    }
    
    function parseProduction(result, callback) {
        var processProductionRow = function(prodReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
            //This serves 2 purposes, check for blank rows and skip rows with no value
            if ((row[6] == "") || (row[0] == "#source")) {
                prodReport.add("Productions: Empty row or label, or no volume data.\n");
                return callback(null); //Do nothing
            }
            //TODO?: Currently hard req. for country, commodity, if proj or company there should be valid
            if ((row[2] == "") || !countries[row[2]] || ((row[3] != "") && !projects[row[3].toLowerCase()] ) || ((row[4] != "") && !companies[row[4].toLowerCase()] ) || !sources[row[0].toLowerCase()] || (row[8] == "") || !commodities[row[8]] || (row[5] == "") ) {
                prodReport.add(`Invalid or missing data in row: ${row}. Aborting.\n`);
                return callback(`Failed: ${prodReport.report}`);
            }
            //Production - match by country + project/company (if present) + year + commodity
            //TODO extend for sites later
            //TODO extend for concessions later if this makes it into template
            var query = {
                    production_commodity: commodities[row[8]]._id,
                    production_year: parseInt(row[5]),
                    country: countries[row[2]]._id
                };
            if (row[3] != "") {
                query.project = projects[row[3].toLowerCase()]._id;
            }
            if (row[4] != "") {
                query.company = companies[row[4].toLowerCase()]._id;
            }
            Production.findOne(
                query,
                function(err, doc) {  
                    if (err) {
                        prodReport.add(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                        return callback(`Failed: ${prodReport.report}`);
                    }
                    else if (doc) {
                        prodReport.add(`Production ${row[3]}/${row[4]}/${row[8]}/${row[5]} already exists in the DB, not adding\n`);
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
                                return callback(null)
                            }
                        );
                    }
                }
            );
        };
        parseEntity(result, '8. Production', 3, 0, null, processProductionRow, null, null, null, null, null, callback);
    }
    
    function parseTransfers(result, callback) {
        var processTransferRow = function(transReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {         
            //This serves 2 purposes, check for blank rows and skip rows with no value
            if (((row[21] == "") && (row[12] == "")) || (row[0] == "#source")) {
                transReport.add("Transfers: Empty row or label, or no volume data.\n");
                return callback(null); //Do nothing
            }
            //Hard req. for country at this point
            if (((row[5] != "") && !projects[row[5].toLowerCase()]) || !sources[row[0].toLowerCase()] || row[2] == "" || !countries[row[2]] ) {
                transReport.add(`Invalid or missing data in row: ${row}. Aborting.\n`);
                return callback(`Failed: ${transReport.report}`);
            }
            //Transfer - many possible ways to match
            //Determine if payment or receipt
            var transfer_audit_type = "";
            if (row[21] != "") {
                transfer_audit_type = "government_receipt"
                transfer_type = "receipt";
            }
            else if (row[12] != "") {
                transfer_audit_type = "company_payment";
                transfer_type = "payment";
            }
            else returnInvalid();
            
            //TODO: How to match without projects in the transfers any more?
            var query = {country: countries[row[2]]._id, transfer_audit_type: transfer_audit_type};
            if (row[5] != "") {
                query.project = projects[row[5].toLowerCase()]._id;
                query.transfer_level = "project";
            }
            else query.transfer_level = "country";
            
            //console.log(row);
            if (row[3] != "") {
                query.company = companies[row[3].toLowerCase()]._id;
            }
            //TODO (0.6): site, concession
            if (transfer_type == "payment") {
                query.transfer_year = parseInt(row[6]);
                query.transfer_type = row[8];
            }
            else {
                query.transfer_year = parseInt(row[13]);
                query.transfer_type = row[17];
                if (row[15] != "") {
                    query.transfer_gov_entity = row[15];
                }
                if (row[16] != "") {
                    query.transfer_gov_entity_id = row[16];
                }
            }

            Transfer.findOne(
                query,
                function(err, doc) {  
                    if (err) {
                        transReport.add(`Encountered an error (${err}) while querying the DB. Aborting.\n`);
                        return callback(`Failed: ${transReport.report}`);
                    }
                    else if (doc) {
                        transReport.add(`Transfer (${util.inspect(query)}) already exists in the DB, not adding\n`);
                        return callback(null);
                    }
                    else {
                        var newTransfer = makeNewTransfer(row, transfer_audit_type);
                        if (!newTransfer) {
                            transReport.add(`Invalid or missing data in row: ${row}. Aborting.\n`);
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
                    }
                }
            );
        };
        parseEntity(result, '10. Payments and receipts', 3, 0, null, processTransferRow, null, null, null, null, null, callback);
    }
    
    function parseReserves(result, callback) {
        result.add("Reserves IGNORED\n");
        callback(null, result);
    }
}
