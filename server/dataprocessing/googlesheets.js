var Source = require('mongoose').model('Source'),
    Country = require('mongoose').model('Country'),
    Commodity = require('mongoose').model('Commodity'),
    Company = require('mongoose').model('Company'),
    Project = require('mongoose').model('Project'),
    Link = require('mongoose').model('Link'),
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
var sources, countries, commodities, companies, projects;

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
        company.country_of_incorporation = {country: countries[newRow[2]]._id}; //Fact, will have comp. id added later
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

var makeNewProject = function(newRow) {
    var source;
    if (newRow[0].trim() != "") {
        if (sources[newRow[0]]) { //Must be here due to lookups in sheet
            source = sources[newRow[0]]._id;
        }
        else return false; //error
    }
    else return false; //We need a source
    var project = {
        proj_name: newRow[1],
    };
    //Proj. ID will be added later
    if (newRow[5].trim() != "") project.proj_country = [{country: countries[newRow[5]]._id, source: sources[newRow[0]]._id}];
    if (newRow[2].trim() != "") project.proj_site_name = [{string: newRow[2].trim(), source: sources[newRow[0]]._id}];
    if (newRow[3].trim() != "") project.proj_address = [{string: newRow[3].trim(), source: sources[newRow[0]]._id}];
    if (newRow[6].trim() != "") project.proj_coordinates = [{loc: [parseFloat(newRow[6].trim()), parseFloat(newRow[7].trim())], source: sources[newRow[0]]._id}];
    if (newRow[9].trim() != "") project.proj_commodity = [{commodity: commodities[newRow[9].trim()]._id, source: sources[newRow[0]]._id}];

    return project;
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

processGenericRow = function(report, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
    if ((row[rowIndex].trim() == "") || (row[rowIndex].trim()[0] == "#")) {
        report.add(entityName + ": Empty row or label.\n");
        return callback(null); //Do nothing
    }
    var finderObj = {};
    finderObj[modelKey] = row[rowIndex].trim();
    model.findOne(
        finderObj,
        function(err, doc) {
            if (err) {
                report.add("Encountered an error while querying the DB. Aborting.\n");
                return callback(`Failed: ${report.report}`);
            }
            else if (doc) {
                report.add(`${entityName} ${row[rowIndex]} already exists in the DB (name match), not adding\n`);
                destObj[row[rowIndex]] = doc;
                return callback(null);
            }
            else {
                model.create(
                    makerFunction(row),
                    function(err, createdModel) {
                        if (err) {
                            report.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                            return callback(`Failed: ${report.report}`);
                        }
                        report.add(`Added ${entityName} ${row[rowIndex]} to the DB.\n`);
                        destObj[row[rowIndex]] = createdModel;
                        return callback(null);
                    }
                );
            }
        }
    );
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

    ;

    function parseEntity(reportSoFar, sheetname, dropRowsStart, dropRowsEnd, entityObj, processRow, entityName, rowIndex, model, modelKey, rowMaker, callback) {
        var intReport = {
            report: reportSoFar, //Relevant for the series waterfall - report gets passed along
            add: function(text) {
                this.report += text;
            }
        }

        //Drop first X, last Y rows
        sheets[sheetname].data = sheets[sheetname].data.slice(dropRowsStart, (sheets[sheetname].data.length - dropRowsEnd));
        //TODO: for some cases parallel is OK: differentiate
        async.eachSeries(sheets[sheetname].data, processRow.bind(null, intReport, entityObj, entityName, rowIndex, model, modelKey, rowMaker), function (err) { //"A callback which is called when all iteratee functions have finished, or an error occurs."
            if (err) {
                return callback(err, intReport.report); //Giving up
            }
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
            countries = new Object;
            //The list of countries of relevance for this dataset is taken from the project list
            parseEntity("", '1.ProjectList', 3, 2, countries, processGenericRow, "Country", 1, Country, "iso2", makeNewCountry, callback);
        }

        function parseCommodities(callback) {
            //TODO: In some sheets only a group is named...
            commodities = new Object;
            //The list of commodities of relevance for this dataset is taken from the location/status/commodity list
            parseEntity("", '5.Projectlocationstatuscommodity', 3, 0, commodities, processGenericRow, "Commodity", 9, Commodity, "commodity_name", makeNewCommodity, callback);
        }

        function parseSources(callback) {
            var processSourceRow = function(sourcesReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
                if ((row[0].trim() == "") || (row[0].trim() == "#source")) {
                    sourcesReport.add("Sources: Empty row or label.\n");
                    return callback(null); //Do nothing
                }
                //TODO: Find OLDEST (use that for comparison instead of some other duplicate - important where we create duplicates)
                //TODO - may need some sort of sophisticated duplicate detection here
                Source.findOne(
                    {source_url: row[4].trim().toLowerCase()},
                    function(err, doc) {
                        if (err) {
                            sourcesReport.add(`Encountered an error while querying the DB: ${err}. Aborting.\n`);
                            return callback(`Failed: ${sourcesReport.report}`);
                        }
                        else if (doc) {
                            sourcesReport.add(`Source ${row[0]} already exists in the DB (url match), checking content\n`);
                            if (equalDocs(doc, makeNewSource(false, row))) {
                                sourcesReport.add(`Source ${row[0]} already exists in the DB (url match), not adding\n`);
                                sources[row[0]] = doc;
                                return callback(null);
                            }
                            else {
                                sourcesReport.add(`Source ${row[0]} already exists in the DB (url match),flagging as duplicate\n`);
                                Source.create(
                                    makeNewSource(true, row, doc._id),
                                    function(err, model) {
                                        if (err) {
                                            sourcesReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                            return callback(`Failed: ${sourcesReport.report}`);
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
                                        sourcesReport.add(`Encountered an error while querying the DB: ${err}. Aborting.\n`);
                                        return callback(`Failed: ${sourcesReport.report}`);
                                    }
                                    else if (doc) {
                                        sourcesReport.add(`Source ${row[0]} already exists in the DB (name match), will flag as possible duplicate\n`);
                                        Source.create(
                                            makeNewSource(true, row, doc._id),
                                            (function(err, model) {
                                                if (err) {
                                                    sourcesReport.add(`Encountered an error while creating a source in the DB: ${err}. Aborting.\n`);
                                                    return callback(`Failed: ${sourcesReport.report}`);
                                                }
                                                sources[row[0]] = model;
                                                return callback(null);
                                            })
                                        );
                                    }
                                    else {
                                        sourcesReport.add(`Source ${row[0]} not found in the DB, creating\n`);
                                        Source.create(
                                            makeNewSource(false, row),
                                            (function(err, model) {
                                                if (err) {
                                                    sourcesReport.add(`Encountered an error while creating a source in the DB: ${err}. Aborting.\n`);
                                                    return callback(`Failed: ${sourcesReport.report}`);
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
            //TODO - refactor processSourceRow to use generic row or similar?
            parseEntity("", '2.SourceList', 3, 0, sources, processSourceRow, "Source", 0, Source, "source_name", makeNewSource, callback);
        }

    }

    function parseCompanies(result, callback) {
        var processCompanyRow = function(companiesReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
            if ((row[3].trim() == "") || (row[3].trim() == "#company")) {
                companiesReport.add("Companies: Empty row or label.\n");
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
                        companiesReport.add("Encountered an error while querying the DB. Aborting.\n");
                        return callback(`Failed: ${companiesReport.report}`);
                    }
                    else if (doc) {
                        companiesReport.add(`Company ${row[3]} already exists in the DB (name or alias match), not adding\n`);
                        companies[row[3]] = doc;
                        return callback(null);
                    }
                    else {
                        var newCompany = makeNewCompany(row);
                        if (!newCompany) {
                            companiesReport.add(`Invalid data in row: ${row}. Aborting.\n`);
                            return callback(`Failed: ${companiesReport.report}`);
                        }
                        Company.create(
                            newCompany,
                            function(err, model) {
                                if (err) {
                                    companiesReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                    return callback(`Failed: ${companiesReport.report}`);
                                }
                                //Update any created facts
                                if (model.country_of_incorporation) model.country_of_incorporation.company = model._id;
                                if (model.company_website) model.company_website.company = model._id;
                                companiesReport.add(`Added company ${row[3]} to the DB.\n`);
                                companies[row[3]] = model;
                                return callback(null);
                            }
                        );
                    }
                }
            );
        };
        companies = new Object;
        //TODO - refactor processCompanyRow to use generic row by allowing custom queries
        parseEntity(result, '6.CompaniesandGroups', 3, 0, companies, processCompanyRow, "Company", 3, Company, "company_name", makeNewCompany, callback);
    }

    function parseProjects(result, callback) {
        var processProjectRow = function(projectsReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
            if ((row[rowIndex].trim() == "") || (row[1].trim() == "#project")) {
                projectsReport.add("Projects: Empty row or label.\n");
                return callback(null); //Do nothing
            }
            //Projects - check against name and aliases
            //TODO - may need some sort of sophisticated duplicate detection here
            Project.findOne(
                {$or: [
                    {proj_name: row[rowIndex].trim()},
                    {"proj_aliases.alias": row[rowIndex].trim()} //TODO: FIX POPULATE ETC.
                ]},
                function(err, doc) {
                    if (err) {
                        projectsReport.add("Encountered an error while querying the DB. Aborting.\n");
                        return callback(`Failed: ${projectsReport.report}`);
                    }
                    else if (doc) {
                        projectsReport.add(`Project ${row[rowIndex]} already exists in the DB (name or alias match), not adding but checking for new sites\n`);
                        projects[row[rowIndex]] = doc;
                        if (row[2].trim() != "") {
                            var notfound = true;
                            for (fact in doc.proj_site_name) {
                                if (row[2].trim() == fact.string) {
                                    notfound = false;
                                    projectsReport.add(`Project site ${row[2]} already exists in project, not adding\n`);
                                    break;
                                }
                            }
                            if (notfound)
                            {
                                //TODO: Do project IDs (etc.) need to be in facts?
                                if (countries[row[5]] && sources[row[0]]) {
                                    doc.proj_country.push({project: doc._id, country: countries[row[5]]._id, source: sources[row[0]]._id});
                                }
                                else {
                                    projectsReport.add(`Invalid data in row: ${row}. Aborting.\n`);
                                    return callback(`Failed: ${projectsReport.report}`);
                                }
                                projectsReport.add(`Project site ${row[2]} added to project\n`);
                                doc.proj_site_name.push({project: doc._id, string: row[2].trim(), source: sources[row[0]]._id});
                                doc.proj_address.push({project: doc._id, string: row[3].trim(), source: sources[row[0]]._id});
                                doc.proj_coordinates.push({project: doc._id, loc: [parseFloat(row[6].trim()), parseFloat(row[7].trim())], source: sources[row[0]]._id});
                            }
                        }
                        if (row[9].trim() != "") {
                            var notfound = true;
                            for (fact in doc.proj_commodity) {
                                //No need to check if exist as commodities are taken from here
                                if (commodities[row[9].trim()]._id == fact.commodity._id) {
                                    notfound = false;
                                    projectsReport.add(`Project commodity ${row[9]} already exists in project, not adding\n`);
                                    break;
                                }
                                if (notfound) { //Commodity must be here, as based on this sheet
                                    if (sources[row[0]]) {
                                        doc.proj_commodity.push({project: doc._id, commodity: commodities[row[9].trim()]._id, source: sources[row[0]]._id});
                                        projectsReport.add(`Project commodity ${row[9]} added to project\n`);
                                    }
                                    else {
                                        projectsReport.add(`Invalid data in row: ${row}. Aborting.\n`);
                                        return callback(`Failed: ${projectsReport.report}`);
                                    }
                                }
                            }
                        }
                        if (row[10].trim() != "") {
                            var notfound = true;
                            for (fact in doc.proj_status) {
                                if (row[10].trim() == fact.string) {
                                    notfound = false;
                                    projectsReport.add(`Project status ${row[10]} already exists in project, not adding\n`);
                                    break;
                                }
                                if (notfound) {
                                    doc.proj_status.push({project: doc._id, string: row[10].trim(), date: parseGsDate(row[11].trim()), source: sources[row[0]]._id});
                                    projectsReport.add(`Project commodity ${row[9]} added to project\n`);
                                }
                            }
                        }
                        return callback(null);
                    }
                    else {
                        var newProject = makeNewProject(row);
                        if (!newProject) {
                            projectsReport.add(`Invalid data in row: ${row}. Aborting.\n`);
                            return callback(`Failed: ${projectsReport.report}`);
                        }
                        Project.create(
                            newProject,
                            function(err, model) {
                                if (err) {
                                    projectsReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                    return callback(`Failed: ${projectsReport.report}`);
                                }
                                //Update any created facts
                                if (model.proj_country.length > 0) for (fact in model.proj_country) { fact.project = model._id; }
                                if (model.proj_type.length > 0) for (fact in model.proj_type) { fact.project = model._id; }
                                if (model.proj_commodity.length > 0) for (fact in model.proj_commodity) { fact.project = model._id; }
                                if (model.proj_site_name.length > 0) for (fact in model.proj_site_name) { fact.project = model._id; }
                                if (model.proj_address.length > 0) for (fact in model.proj_address) { fact.project = model._id; }
                                if (model.proj_coordinates.length > 0) for (fact in model.proj_coordinates) { fact.project = model._id; }
                                if (model.proj_status.length > 0) for (fact in model.proj_status) { fact.project = model._id; }
                                projectsReport.add(`Added project ${row[rowIndex]} to the DB.\n`);
                                projects[row[rowIndex]] = model;
                                return callback(null);
                            }
                        );
                    }
                }
            );
        };
        projects = new Object;
        parseEntity(result, '5.Projectlocationstatuscommodity', 1, 0, projects, processProjectRow, "Project", 1, Project, "proj_name", makeNewProject, callback);
    }

    function parseConcessionsAndContracts(result, callback) {
        var processCandCRow = function(candcReport, destObj, entityName, rowIndex, model, modelKey, makerFunction, row, callback) {
            if ((row[0].trim() == "#source") || ((row[2].trim() == "") && (row[7].trim() == "") && (row[8].trim() == ""))) {
                candcReport.add("Concessions and Contracts: Empty row or label.\n");
                return callback(null); //Do nothing
            }
            //First linked companies
            if (row[2].trim() != "") {
                console.log("-----");
                console.log(companies[row[2].trim()]);
                console.log(projects[row[1].trim()]);
                console.log(sources[row[0].trim()]);
                console.log("-----");
                if (!companies[row[2].trim()] || !projects[row[1].trim()] || !sources[row[0].trim()] ) {
                    candcReport.add(`Invalid data in row: ${row}. Aborting.\n`);
                    return callback(`Failed: ${candcReport.report}`);
                }
                Link.findOne(
                    {
                        company: companies[row[2].trim()]._id,
                        project: projects[row[1].trim()]._id
                    },
                    function(err, doc) {
                        if (err) {
                            candcReport.add("Encountered an error while querying the DB. Aborting.\n");
                            return callback(`Failed: ${candcReport.report}`);
                        }
                        else if (doc) {
                            candcReport.add(`Company ${row[2]} is already linked with project ${row[1]}, not adding\n`);
                            return callback(null);
                        }
                        else {
                            var newCompanyLink = {
                                company: companies[row[2].trim()]._id,
                                project: projects[row[1].trim()]._id,
                                source: sources[row[0].trim()]._id
                            };
                            Link.create(
                                newCompanyLink,
                                function(err, model) {
                                    if (err) {
                                        candcReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                                        return callback(`Failed: ${candcReport.report}`);
                                    }
                                    candcReport.add(`Linked company ${row[2]} with project ${row[1]} in the DB.\n`);
                                    return callback(null);
                                }
                            );
                        }
                    }
                );
            }
            //Then linked contracts - all based on ID (for API look up)
            if (row[7].trim() != "") {
                if (!sources[row[0].trim()] ) {
                    candcReport.add(`Invalid source in row: ${row}. Aborting.\n`);
                    return callback(`Failed: ${candcReport.report}`);
                }
                Contract.findOne({
                        contract_id: row[7].trim()
                    },
                    function(err, doc) {
                        if (err) {
                            candcReport.add("Encountered an error while querying the DB. Aborting.\n");
                            return callback(`Failed: ${candcReport.report}`);
                        }
                        else if (doc) { //Found contract, now see if its linked TODO
                            candcReport.add(`Company ${row[2]} is already linked with project ${row[1]}, not adding\n`);
                            return callback(null);
                        }
                        else { //No contract, create and link TODO
                            /* var newCompanyLink = {
                             company: companies[row[2].trim()]._id,
                             project: projects[row[1].trim()]._id,
                             source: sources[row[0].trim()]._id
                             };
                             Link.create(
                             newCompanyLink,
                             function(err, model) {
                             if (err) {
                             candcReport.add(`Encountered an error while updating the DB: ${err}. Aborting.\n`);
                             return callback(`Failed: ${candcReport.report}`);
                             }
                             //Update any created facts
                             companiesReport.add(`Linked company ${row[2]} with project ${row[1]} in the DB.\n`);
                             return callback(null);
                             }
                             );*/
                            return callback(null);
                        }
                    }
                );
            }
        };
        parseEntity(result, '7.Contractsconcessionsandcompanies', 4, 0, null, processCandCRow, null, null, null, null, null, callback);
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