var Source = require('mongoose').model('Source'),
    async   = require('async'),
    csv     = require('csv'),
    request = require('request'),
    moment = require('moment');

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
                                report += `${item.title}: Stored ${rowdata.length} rows\n`;
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

makeNewSource = function(flagDuplicate, newRow, duplicateId) {
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
    
    function parseBasis(callback) {
        var basisReport = report + "Processing basis info\n";
        
        async.parallel([
            parseSources,
            parseCountries,
            parseCommodities,
            parseCompanies
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
                basisReport += `Processing of basis info caused an error: ${err}\n`;
                return callback(`Processing of basis info caused an error: ${err}\n`, basisReport);
            }
            console.log("Finished parse basis");
            callback(null, basisReport);
        }));

        function parseSources(callback) {
            var sourcesReport = "";
            var sources = new Object;
            var sourceCount = sheets['2.SourceList'].data.length - 4;
            var processedSources = 0;
            
            //Drop first 4 rows
            sheets['2.SourceList'].data = sheets['2.SourceList'].data.slice(4, sheets['2.SourceList'].data.length - 1);
            async.each(sheets['2.SourceList'].data, processRow, function (err) { //"A callback which is called when all iteratee functions have finished, or an error occurs."
                if (err) return callback(err, sourcesReport); //GIving up
                callback(null, sourcesReport); //All good
            });
            
            function processRow(row, callback) {
                var source = new Object;
                Source.findOne(
                    {source_url: row[4].trim().toLowerCase()},
                    function(err, doc) {  
                        if (err) {
                            sourcesReport += "Encountered an error while querying the DB. Aborting.\n";
                            return callback(`Failed: ${sourcesReport}`);
                        }
                        else if (doc) {
                            sourcesReport += `Source ${row[0]} already exists in the DB (url match), merging and flagging\n`;
                            if (equalDocs(doc, makeNewSource(false, row))) {
                                sources[row[0]] = doc;
                                return callback(null);
                            }
                            else {
                                Source.create(
                                    makeNewSource(true, row, doc._id),
                                    function(err, model) {
                                        if (err) {
                                                sourcesReport += `Encountered an error while updating the DB: ${err}. Aborting.\n`;
                                                return callback(`Failed: ${sourcesReport}`);
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
                                        sourcesReport += `Encountered an error while querying the DB: ${err}. Aborting.\n`;
                                        return callback(`Failed: ${sourcesReport}`);
                                    }
                                    else if (doc) {
                                        sourcesReport += `Source ${row[0]} already exists in the DB (name match), will flag as possible duplicate\n`;
                                        Source.create(
                                            makeNewSource(true, row, doc._id),
                                            (function(err, model) {
                                                if (err) {
                                                    sourcesReport += `Encountered an error while creating a source in the DB: ${err}. Aborting.\n`;
                                                    return callback(`Failed: ${sourcesReport}`);
                                                }
                                                sources[row[0]] = model;
                                                return callback(null);
                                            })
                                        );
                                    }
                                    else {
                                        sourcesReport += `Source ${row[0]} not found in the DB, creating\n`;
                                        Source.create(
                                            makeNewSource(false, row),
                                            (function(err, model) {
                                                if (err) {
                                                    sourcesReport += `Encountered an error while creating a source in the DB: ${err}. Aborting.\n`;
                                                    return callback(`Failed: ${sourcesReport}`);
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
            }
        }
        
        function parseCountries(callback) {
            console.log("STUB COUNTRIES READ\n");
            callback(null, "STUB COUNTRIES READ\n");
        }
        
        function parseCommodities(callback) {
            console.log("STUB COmm READ\n");
            callback(null, "STUB COMMODITIES READ\n");
        }
        
        function parseCompanies(callback) {
            console.log("STUB COmp READ\n");
            callback(null, "STUB COMPANIES READ\n");
        }
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
        console.log("parsing reserves, res so far:" + result);
        result += "Reserves READ\n";
        callback(null, result);
    }
}