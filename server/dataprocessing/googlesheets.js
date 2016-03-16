var Source = require('mongoose').model('Source'),
    Country = require('mongoose').model('Country'),
    Commodity = require('mongoose').model('Commodity'),
    Company = require('mongoose').model('Company'),
    async   = require('async'),
    csv     = require('csv'),
    request = require('request'),
    moment = require('moment');

exports.processData = function(link, callback) {
    var report = "";
    var keytoend =  link.substr(link.indexOf("/d/") + 3, link.length);
    var key = keytoend.substr(0, keytoend.indexOf("/"));
    report += 'Using link ${link}\n';
    if (key.length != 44) {
        report += "Could not detect a valid spreadsheet key in URL\n";
        callback("Failed", report);
        return;
    }
    else {
        report += 'Using GS key ${key}\n';
    }
    var feedurl = 'https://spreadsheets.google.com/feeds/worksheets/${key}/public/full?alt=json';
    
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
                        report += 'Getting data from sheet "${body.feed.entry[i].title.$t}"...\n';
                        request({
                            url: body.feed.entry[i].link[j].href
                        }, function (error, response, sbody) {
                            if (error) {
                                report += "${}: Could not retrieve sheet\n";
                                callback("Failed", report);
                                return;
                            }
                            csv.parse(sbody, function(err, rowdata){
                                if (error) {
                                    report += "${skey}: Could not parse sheet\n";
                                    callback("Failed", report);
                                    return;
                                }
                                var item = new Object;
                                var cd = response.headers['content-disposition'];
                                console.log(cd);
                                item.title = cd.substring(cd.indexOf("\"") + 1, cd.indexOf(".csv\"")).slice(mainTitle.length -1);
                                item.link = response.request.uri.href;
                                item.data = rowdata;
                                report += '${item.title}: Stored ${rowdata.length} rows\n';
                                sheets[item.title] = item;
                                numProcessed++;
                                if (numProcessed == numSheets) {
                                    parseData(sheets, report, callback);
                                }
                            });
                        });
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
    if (!input || input.trim() == "") return null;
    else result = moment(input, "DD/MM/YYYY").format();
    //Hope for the best
    if (result == "Invalid date") return input;
    else return result;
}

//Data needed for inter-entity reference
var sources, countries, commodities, companies;
    

var makeNewSource = function(flagDuplicate, newRow, duplicateId) {
    newRow[7] = parseGsDate(newRow[7]);
    newRow[8] = parseGsDate(newRow[8]);
   
    var source = {
        source_name: newRow[0],
        source_type: newRow[2], //TODO: unnecessary?
        /* TODO? source_type_id: String, */
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

var makeNewCountry = function(newRow) {
    var country = {
        iso2: newRow[1],
        name: newRow[0]
    }
    return country;
}

var makeNewCommodity = function(newRow) {
    var commodity = {
        commodity_name: newRow[9],
        commodity_type: newRow[8]
    }
    return commodity;
}

var makeNewCompany = function(newRow) {
    var company = {
        company_name: newRow[3]
    };

    if (newRow[5].trim() != "") {
        company.open_corporates_id = newRow[5];
    }
    if (newRow[2].trim() != "") {
        company.country_of_incorporation = {country: newRow[2]}; //Fact, will have comp. id added later
    }
    if (newRow[6].trim() != "") {
        company.company_website = {string: newRow[6]}; //Fact, will have comp. id added later
    }
    if (newRow[0].trim() != "") {
        if (sources[newRow[0]]) { //Must be here due to lookups in sheet
            company.company_established_source = sources[newRow[0]]._id;
        }
        else return false; //error
    }
    return company;
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

function parseData(sheets, report, finalcallback) {
    async.waterfall([
        parseBasis,
        parseCompanies,
        parseProjects,
        parseConcessionsAndContracts,
        parseProduction,
        parseTransfers,
        parseReserves
    ], function (err, report) {
        if (err) {
            console.log("PARSE: Got an error\n");
            return finalcallback("Failed", report)
        }
        finalcallback("Success", report);
        }
    );
    
    function parseEntity(sheetname, dropRowsStart, dropRowsEnd, entityObj, processRow, callback) {
        var intReport = {
            report: "",
            add: function(text) {
                this.report += text;
            }
        }
        
        //Drop first X, last Y rows
        sheets[sheetname].data = sheets[sheetname].data.slice(dropRowsStart, (sheets[sheetname].data.length - 1 - dropRowsEnd));
        //TODO: for some cases parallel is OK: differentiate
        async.eachSeries(sheets[sheetname].data, processRow.bind(null, intReport), function (err) { //"A callback which is called when all iteratee functions have finished, or an error occurs."
            if (err) return callback(err, intReport.report); //Giving up
            callback(null, intReport.report); //All good
        });
    }
    
    function parseBasis(callback) {
        var basisReport = report + "Processing basis info\n";
        
        async.parallel([
            parseSources,
            parseCountries,
            parseCommodities
        ], (function (err, resultsarray) {            
            console.log("PARSE BASIS: Finished parallel tasks OR got an error");
            for (var r=0; r<resultsarray.length; r++) {
                if (!resultsarray[r]) {
                    basisReport += "** NO RESULT **\n";
                }
                else basisReport += resultsarray[r];
            }
            if (err) {
                console.log("PARSE BASIS: Got an error");
                basisReport += 'Processing of basis info caused an error: ${err}\n';
                return callback('Processing of basis info caused an error: ${err}\n', basisReport);
            }
            console.log("Finished parse basis");
            callback(null, basisReport);
        }));

        function parseCountries(callback) {
            var processCountryRow = function(countriesReport, row, callback) {
                if (row[0].trim() == "") {
                    return callback(null); //Do nothing
                }
                //As we always take country data from some authoritative source,
                //duplicate checking is straightforward and duplicates are not added
                //Currently not checking using aliases (TODO?)
                Country.findOne(
                    {iso2: row[1].trim().toUpperCase()},
                    function(err, doc) {  
                        if (err) {
                            countriesReport.add("Encountered an error while querying the DB. Aborting.\n");
                            return callback('Failed: ${countriesReport.report}');
                        }
                        else if (doc) {
                            countriesReport.add('Country ${row[0]} already exists in the DB (iso match), not adding\n');
                            countries[row[1]] = doc; //Identify by code, this is present in (almost - TODO(?)) all sheets
                            return callback(null);
                        }
                        else {
                            Country.create(
                                makeNewCountry(row),
                                function(err, model) {
                                    if (err) {
                                        countriesReport.add('Encountered an error while updating the DB: ${err}. Aborting.\n');
                                        return callback('Failed: ${countriesReport.report}');
                                    }
                                    countriesReport.add('Added country ${row[0]} to the DB.\n'); 
                                    countries[row[1]] = model;
                                    return callback(null);
                                }
                            );
                        }
                    }
                );
            };
            countries = new Object;
            //The list of countries of relevance for this dataset is taken from the project list
            parseEntity('1.ProjectList', 4, 2, countries, processCountryRow, callback);
        }

        function parseSources(callback) {
            var processSourceRow = function(sourcesReport, row, callback) {
                if (row[0].trim() == "") {
                    return callback(null); //Do nothing
                }
                //TODO: Find OLDEST (use that for comparison instead of some other duplicate - important where we create duplicates)
                //TODO - may need some sort of sophisticated duplicate detection here
                Source.findOne(
                    {source_url: row[4].trim().toLowerCase()},
                    function(err, doc) {  
                        if (err) {
                            sourcesReport.add("Encountered an error while querying the DB. Aborting.\n");
                            return callback('Failed: ${sourcesReport.report}');
                        }
                        else if (doc) {
                            sourcesReport.add('Source ${row[0]} already exists in the DB (url match), checking content\n');
                            if (equalDocs(doc, makeNewSource(false, row))) {
                                sourcesReport.add('Source ${row[0]} already exists in the DB (url match), not adding\n');
                                sources[row[0]] = doc;
                                return callback(null);
                            }
                            else {
                                sourcesReport.add('Source ${row[0]} already exists in the DB (url match),flagging as duplicate\n');
                                Source.create(
                                    makeNewSource(true, row, doc._id),
                                    function(err, model) {
                                        if (err) {
                                                sourcesReport.add('Encountered an error while updating the DB: ${err}. Aborting.\n');
                                                return callback('Failed: ${sourcesReport.report}');
                                        }
                                        sources[row[0]] = model;
                                        return callback(null);
                                    }
                                );
                            }
                        }
                        else {
                            Source.findOne(
                                {source_name: row[0].trim()},
                                (function(err, doc) {
                                    if (err) {
                                        sourcesReport.add('Encountered an error while querying the DB: ${err}. Aborting.\n');
                                        return callback('Failed: ${sourcesReport.report}');
                                    }
                                    else if (doc) {
                                        sourcesReport.add('Source ${row[0]} already exists in the DB (name match), will flag as possible duplicate\n');
                                        Source.create(
                                            makeNewSource(true, row, doc._id),
                                            (function(err, model) {
                                                if (err) {
                                                    sourcesReport.add('Encountered an error while creating a source in the DB: ${err}. Aborting.\n');
                                                    return callback('Failed: ${sourcesReport.report}');
                                                }
                                                sources[row[0]] = model;
                                                return callback(null);
                                            })
                                        );
                                    }
                                    else {
                                        sourcesReport.add('Source ${row[0]} not found in the DB, creating\n');
                                        Source.create(
                                            makeNewSource(false, row),
                                            (function(err, model) {
                                                if (err) {
                                                    sourcesReport.add('Encountered an error while creating a source in the DB: ${err}. Aborting.\n');
                                                    return callback('Failed: ${sourcesReport.report}');
                                                }
                                                sources[row[0]] = model;
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
            parseEntity('2.SourceList', 4, 0, sources, processSourceRow, callback);          
        }
        
        function parseCommodities(callback) {
            var processCommodityRow = function(commoditiesReport, row, callback) {
                if (row[9].trim() == "") {
                    return callback(null); //Do nothing
                }
                //Commodities are fairly simple, assume main id is correct and unique
                Commodity.findOne(
                    {commodity_name: row[9].trim()},
                    function(err, doc) {  
                        if (err) {
                            commoditiesReport.add("Encountered an error while querying the DB. Aborting.\n");
                            return callback('Failed: ${commoditiesReport.report}');
                        }
                        else if (doc) {
                            commoditiesReport.add('Commodity ${row[9]} already exists in the DB (name match), not adding\n');
                            commodities[row[9]] = doc;
                            return callback(null);
                        }
                        else {
                            Commodity.create(
                                makeNewCommodity(row),
                                function(err, model) {
                                    if (err) {
                                        commoditiesReport.add('Encountered an error while updating the DB: ${err}. Aborting.\n');
                                        return callback('Failed: ${commoditiesReport.report}');
                                    }
                                    commoditiesReport.add('Added commodity ${row[9]} to the DB.\n'); 
                                    commodities[row[9]] = model;
                                    return callback(null);
                                }
                            );
                        }
                    }
                );
            };
            commodities = new Object;
            //The list of commodities of relevance for this dataset is taken from the location/status/commodity list
            parseEntity('5.Projectlocationstatuscommodity', 4, 0, commodities, processCommodityRow, callback);
        }
    }
    
    function parseCompanies(result, callback) {
        var processCompanyRow = function(companiesReport, row, callback) {
            if (row[3].trim() == "") {
                return callback(null); //Do nothing
            }
            //Companies - check against name and aliases
            //TODO - may need some sort of sophisticated duplicate detection here
            Company.findOne(
                {$or: [
                    {company_name: row[3].trim()},
                    {"aliases.alias": row[3].trim()}
                ]},
                function(err, doc) {  
                    if (err) {
                        companiesReportReport.add("Encountered an error while querying the DB. Aborting.\n");
                        return callback('Failed: ${companiesReportReport.report}');
                    }
                    else if (doc) {
                        companiesReport.add('Company ${row[3]} already exists in the DB (name or alias match), not adding\n');
                        companies[row[3]] = doc;
                        return callback(null);
                    }
                    else {
                        var newCompany = makeNewCompany(row);
                        if (!newCompany) {
                            companiesReport.add('Invalid data in row: ${row}. Aborting.\n');
                            return callback('Failed: ${companiesReport.report}');
                        }
                        Company.create(
                            newCompany,
                            function(err, model) {
                                if (err) {
                                    companiesReport.add('Encountered an error while updating the DB: ${err}. Aborting.\n');
                                    return callback('Failed: ${companiesReport.report}');
                                }
                                //Update any created facts
                                if (model.country_of_incorporation) model.country_of_incorporation.company = model._id;
                                if (model.company_website) model.company_website.company = model._id;
                                companiesReport.add('Added company ${row[3]} to the DB.\n'); 
                                companies[row[3]] = model;
                                return callback(null);
                            }
                        );
                    }
                }
            );
        };
        companies = new Object;
        parseEntity('6.CompaniesandGroups', 4, 0, companies, processCompanyRow, callback);
    }
    
    function parseProjects(result, callback) {
        //send back an error like this: return callback("ERROR");
        result += "Projects READ\n";
        callback(null, result);
    }
    
    function parseConcessionsAndContracts(result, callback) {
        //send back an error like this: return callback("ERROR");
        result += "ConcessionsAndContracts READ\n";
        callback(null, result);
    }
    
    function parseProduction(result, callback) {
        //send back an error like this: return callback("ERROR");
        result += "Production READ\n";
        callback(null, result);
    }
    
    function parseTransfers(result, callback) {
        //send back an error like this: return callback("ERROR");
        result += "Transfers READ\n";
        callback(null, result);
    }
    
    function parseReserves(result, callback) {
        result += "Reserves READ\n";
        callback(null, result);
    }
}