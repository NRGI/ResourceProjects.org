var Dataset         = require('mongoose').model('Dataset'),
    Duplicate       = require('mongoose').model('Duplicate'),
    Action          = require('mongoose').model('Action'),
    ImportSource    = require('mongoose').model('ImportSource'),
    async           = require('async'),
    _               = require('underscore'),
    
    request         = require('request'),
    csv             = require('csv-parse/lib/sync'),
    googlesheets    = require('../dataprocessing/googlesheets.js'),
    companieshouse  = require('../dataprocessing/companieshouse.js'),
    duplicateHandler= require('../dataprocessing/duplicateHandler.js'),
    unloader        = require('../dataprocessing/unloader.js'),
    util            = require('util');
var fs      = require('fs');
var duplicateHandler =  require('../dataprocessing/duplicateHandler.js');

exports.getDatasets = function(req, res) {
    var limit = null, skip = 0;

    if (req.params.limit) limit = Number(req.params.limit);
    if (req.params.skip) skip = Number(req.params.skip);

    async.waterfall([
        datasetCount,
        getAllDatasets
    ], function (err) {
        if (err) {
            res.send(err);
        }
    });

    function datasetCount(callback) {
        Dataset.find({}).count().exec(function(err, dataset_count) {
            if(dataset_count) {
                callback(null, dataset_count);
            } else {
                callback(err);
            }
        });
    }

    function getAllDatasets(dataset_count, callback) {
        Dataset.find(req.query)
            .sort({
                created: 'desc'
            })
            .skip(skip)
            .limit(limit)
            .populate('actions', '-details')
            .populate('created_by')
            .lean()
            .exec(function(err, datasets) {
                if(err) callback(err);
                if(datasets) {
                    async.each(datasets, function (dataset, ecallback) {
                        var action_ids = _.pluck(dataset.actions, '_id');
                        Duplicate.findOne( //One's enough!
                            {
                                created_from: { $in: action_ids },
                                resolved: false
                            }, //Should be just a list of IDs because not populated
                            function (err, duplicate) {
                                if (err) ecallback(err);
                                else if (duplicate) {
                                    dataset.isLoaded = true; //Must have been loaded
                                    dataset.canBeUnloaded = true; //TODO: suboptimal
                                    dataset.hasDuplicates = true;
                                    dataset.readyForCleaning = false; //Can't be marked cleaned because of duplicates
                                    dataset.canReLoad = false; //First deal with duplicates
                                    ecallback(null); //This one finished
                                }
                                else {
                                    //TODO: It would be good if after reconciliation is complete/started, unload is no longer possible
                                    dataset.hasDuplicates = false; //No duplicates... need to figure out what stage its at
                                    //Figure out if ready for cleaning
                                    Action.find({dataset: dataset._id}) //TODO: only doing this to get actions in date sorted order, even though we could already have them - bad
                                        .sort({started: 'desc'}).lean()
                                        .exec(function(err, actions)
                                        {
                                            if(err) ecallback(err);
                                            else {
                                                var action;
                                                dataset.isLoaded = false;
                                                dataset.readyForCleaning = false;
                                                dataset.canBeUnloaded = false;
                                                dataset.canReLoad = false;
                                                if (dataset.type == "Incremental API") dataset.canReLoad = true;
                                                for (action of actions) { //Remember these are in reverse date order, so we are grabbing the last import/mark cleaned
                                                    if (action.status == 'Started') {
                                                        dataset.isLoaded = true; //Prevent import
                                                        break;
                                                    }
                                                    if ((action.name == 'Unload last import') && (action.status == 'Success')) {
                                                        break;
                                                    }
                                                    if ((action.name == 'Mark as cleaned') && (action.status == 'Success')) {
                                                        dataset.isLoaded = true;
                                                        if (dataset.type === "Incremental API") dataset.canReLoad = true;
                                                        break;
                                                    }
                                                    if ((action.name.indexOf('Import') != -1) && (action.status == 'Success')) {
                                                        dataset.isLoaded = true;
                                                        dataset.readyForCleaning = true;
                                                        dataset.canBeUnloaded = true;
                                                        break;
                                                    }
                                                    if ((action.name.indexOf('Import') != -1) && (action.status == 'Failed')) {
                                                        dataset.isLoaded = true;
                                                        dataset.canBeUnloaded = true; //Only option: unload!
                                                        dataset.canReLoad = false; //Even for CH: if last import failed, force unload first
                                                        break;
                                                    }
                                                }
                                                ecallback(null); //Done with this one
                                            }
                                        });
                                    }
                                }
                            );
                        },
                        function (err) {
                           if (err) callback(err);
                           else {
                            
                               res.send({data:datasets, count:dataset_count});
                           }
                        }
                    );
                }
                else {
                    callback(err);
                }
            });
    }
};


exports.getDatasetByID = function(req, res) {
    Dataset.findOne({_id:req.params.id})
        .populate('created_by')
        .populate('actions.started_by')
        .lean()
        .exec(function(err, dataset) {
            if(dataset) {
                res.send(dataset);
            } else {
                res.send(err);
        }
    });
};

exports.createDataset = function(req, res) {
    var datasetData = req.body;
    //TODO: uncomment once working //datasetData.created_by = req.user._id;

    Dataset.create(datasetData, function(err) {
        if(err){
            res.status(400);
            return res.send({reason:err.toString()});
        }
    });
    res.send();
};

function readProjIds (scallback) {
    var existingProjIds = [];
    console.log("Reading existing project IDs from Google Sheets...");

    var feedurl = "https://spreadsheets.google.com/feeds/worksheets/1xj04qdTxMdPfWWX2l4sM902gtloygwEomWNIzC_BMto/public/full?alt=json";

    request({
        url: feedurl,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            for (var j=0; j<body.feed.entry[0].link.length; j++) {
                if (body.feed.entry[0].link[j].type === "text/csv") {
                    console.log(`Getting data from sheet "${body.feed.entry[0].title.$t}"...\n`);
                    request({
                        url: body.feed.entry[0].link[j].href
                    }, function (error, response, sbody) {
                        if (error) {
                            console.log(`${body.feed.entry[0].title.$t}: Could not retrieve sheet`);
                            return scallback("Failed");
                        }
                        records = csv(sbody, {trim: true, columns: true});
                        for (var r=0; r<records.length; r++) {
                            var newId = {
                                            projName: records[r]['#project'],
                                            projCountry: records[r]['#project+country+identifier'],
                                            projId: records[r]['#project+identifier']
                                        };
                            existingProjIds.push(newId);
                        }
                        return scallback(null, existingProjIds);
                    });
                }
            }
        }
        else {
            console.log("Could not get information from GSheets feed - is the sheet shared?\n");
            return scallback("Failed", reporter.text, createdOrAffectedEntities);
        }
    });
}

exports.createAction = function(req, res) {
    var user_id;
    if (!req.user) {
        user_id = null;
    }
    else {
        user_id = req.user._id;
    }
    console.log("Starting an action for dataset " + req.params.id);
    //Create the action and set status "running"
    Action.create(
        {name: req.body.name, started: Date.now(), status: "Started", started_by: user_id, dataset: req.params.id},
        function(err, amodel) {
            if (err) {
                res.status(400);
                console.log(err);
                return res.send({reason:err.toString()});
            }
            Dataset.findByIdAndUpdate(
                req.params.id,
                {$push: {"actions": amodel._id}},
                {safe: true, upsert: false, new: true},
                function(err, dmodel) {
                    if (!err && dmodel) {
                        if (req.body.name == "Import from Google Sheets") {
                            readProjIds(function(err, projIds) {
                                if (err) {
                                    res.status(400);
                                    err = new Error('Error');
                                    return res.send({reason:err})
                                }
                            
                                console.log("Starting import from " + dmodel.name + '...');
                                res.status(200);
                                res.send();
                                googlesheets.processData(dmodel.source_url, amodel._id, projIds, function(status, report, affectedEntities) {
                                    console.log("Action finished...");
                                    console.log("Status: " + status + "\n");
                                    //console.log("Report: " + report + "\n");
                                    //Save affected entities ad persist IDs (for unloading and reloading)
                                    var keytoend =  dmodel.source_url.substr(dmodel.source_url.indexOf("/d/") + 3, dmodel.source_url.length);
                                    var key = keytoend.substr(0, keytoend.indexOf("/"));
                                    //var gdoc = new GoogleSpreadsheet(key);
                                    var importSources = [];
                                    _.each(affectedEntities, function(value) {
                                        value.action = amodel._id;
                                        importSources.push(value);
                                    });
                                    console.log("There were " + importSources.length + " import sources ");
                                    async.series([
                                        /*function (gscallback) {
                                            gdoc.useServiceAccountAuth(creds, function(err) {
                                                if (err) {
                                                    return gscallback("Failed to auth Google Sheet for project IDs");
                                                }
                                                else {
                                                    console.log('Authed doc');
                                                    return gscallback(null);
                                                }
                                            });
                                        },
                                        function (gscallback) {
                                            gdoc.getInfo(function(err, info) {
                                                if (err) {
                                                    return gscallback("Failed to open Google Sheet for project IDs");
                                                }
                                                else {
                                                    console.log('Loaded doc: '+info.title);
                                                    sheet = info.worksheets[2]; //TODO: Don't hard code this
                                                    console.log("got sheet");
                                                    return gscallback(null);
                                                }
                                            });
                                        },*/
                                        function (gscallback) {
                                            async.eachSeries(
                                                importSources,
                                                function(importSource, icallback) {
                                                    /*if (importSource.entity === 'project' && importSource.newProjId) {
                                                        sheet.getRows({
                                                          offset: importSource.rowNum,
                                                          limit: 1
                                                        }, function( err, rows ){
                                                          // the row is an object with keys set by the column headers
                                                          console.log(util.inspect(rows[0])); //Very curious to see how this works...
                                                          rows[0][null] = importSource.newProjId; //Designed to fail
                                                          rows[0].save(function (err) {
                                                              if (err) console.log("Serious but non-fatal error: could not persist project ID:\n" + err);
                                                              else {
                                                                  console.log("persisted row to sheet");
                                                              }
                                                          });
                                                        });
                                                    }*/
                                                    ImportSource.findOneAndUpdate(
                                                        {obj: importSource.obj},
                                                        {$push: {actions: amodel._id}, entity: importSource.entity},
                                                        {upsert: true},
                                                        function (err) {
                                                            if (err) icallback("Failed to log an importsource");
                                                            else icallback(null);
                                                        }
                                                    );
                                                },
                                                function (err) {
                                                    if (err) console.log(err);
                                                    else {                                            
                                                        //TODO: duplicates detector should only look at the entites of the last things that were inserted
                                                        //TODO: think about whether anything in duplicates is missing from affected entities, may need to update them in case of resolution, on other hand then maybe too late for unload?
                                                        if (status == "Success") { //Only look for dups if success. Otherwise unload will be required and we don't want to use this data to augment other entities.
                                                            duplicateHandler.findAndHandleDuplicates(amodel._id, function(err) {
                                                                 if (err) {
                                                                     status = "Failed";
                                                                     report += "\nDuplicate detection failed with error: " + err;
                                                                 }
                                                                 else report += "\nDuplicate detection completed.";
                                                                 //TODO move to function
                                                                 Action.findByIdAndUpdate(
                                                                     amodel._id,
                                                                     {finished: Date.now(), status: status, details: report},
                                                                     {safe: true, upsert: false},
                                                                     function(err) {
                                                                         if (err) console.log("Failed to update an action: " + err);
                                                                     }
                                                                 );
                                                             });
                                                        }
                                                        else { //TODO dedup code
                                                            Action.findByIdAndUpdate(
                                                                     amodel._id,
                                                                     {finished: Date.now(), status: status, details: report},
                                                                     {safe: true, upsert: false},
                                                                     function(err) {
                                                                         if (err) console.log("Failed to update an action: " + err);
                                                                     }
                                                            );
                                                        }
                                                    }
                                                }
                                            );
                                        }
                                    ],
                                    function (err) {
                                        if (err) console.log("Failure during import POST: " + err);
                                    });
                                });
                            });
                        }
                        else if (req.body.name == "Import from Companies House API") {
                            readProjIds(function(err, projIds) {
                                if (err) {
                                    res.status(400);
                                    err = new Error('Error');
                                    return res.send({reason:err})
                                }
                            
                                console.log("Starting import from " + dmodel.name + '...');
                                res.status(200);
                                res.send();

                                companieshouse.importData(projIds, function(status, report, affectedEntities) {
                                    console.log("Process finished");
                                    console.log("Status: " + status + "\n");
                                    //console.log("Report: " + report + "\n");
                                
                                    //Save affected entities (for unloading) and project ids (for reloading)
                                    var importSources = [];
                                    var sheet = null;
                                    //var gdoc = new GoogleSpreadsheet('1xj04qdTxMdPfWWX2l4sM902gtloygwEomWNIzC_BMto');
                                    _.each(affectedEntities, function(value) {
                                        value.action = amodel._id;
                                        importSources.push(value);
                                    });
                                    async.series([
                                        /*function (gscallback) {
                                            gdoc.useServiceAccountAuth(creds, function(err) {
                                                if (err) {
                                                    return gscallback("Failed to auth Google Sheet for project IDs");
                                                }
                                                else {
                                                    console.log('Authed doc');
                                                    return gscallback(null);
                                                }
                                            });
                                        },
                                        function (gscallback) {
                                            gdoc.getInfo(function(err, info) {
                                                if (err) {
                                                    return gscallback("Failed to open Google Sheet for project IDs");
                                                }
                                                else {
                                                    console.log('Loaded doc: '+info.title);
                                                    sheet = info.worksheets[0];
                                                    console.log("got sheet");
                                                    return gscallback(null);
                                                }
                                            });
                                        },*/
                                        function (gscallback) {
                                            async.eachSeries(
                                                importSources,
                                                function(importSource, icallback) {
                                                    /*if (importSource.entity === 'project' && importSource.newProjId) {
                                                        var newRow = {
                                                            'project': importSource.projName,
                                                            'country': importSource.projCountry,
                                                            'projId': importSource.newProjId
                                                        };
                                                        console.log("add row to sheet");
                                                        //In theory any rows here don't exist yet in the sheet, so just add
                                                        sheet.addRow(newRow, function(err) {
                                                            if (err) console.log("Serious but non-fatal error: could not persist project ID:\n" + err);
                                                            else {
                                                                console.log("persisted row to sheet");
                                                            }*/
                                                            ImportSource.findOneAndUpdate(
                                                                      {obj: importSource.obj},
                                                                      {$push: {actions: amodel._id}, entity: importSource.entity},
                                                                      {upsert: true},
                                                                      function (err) {
                                                                          if (err) icallback("Failed to log an importsource");
                                                                          else icallback(null);
                                                                      }
                                                            );
                                                        /*});
                                                    }*/
                                                
                                                },
                                                function (err) {
                                                    if (err) return gscallback(err); //TODO: close the action properly
                                                    else {
                                                        if (status == "Success") {
                                                            console.log("Searching for duplicates...");
                                                            duplicateHandler.findAndHandleDuplicates(amodel._id, function(err) {
                                                                if (err) {
                                                                    status = "Failed";
                                                                    report += "\nDuplicate detection failed with error: " + util.inspect(err.errors, {depth: 4});
                                                                }
                                                                else report += "\nDuplicate detection completed.";
                                                                Action.findByIdAndUpdate(
                                                                    amodel._id,
                                                                    {finished: Date.now(), status: status, details: report},
                                                                    {safe: true, upsert: false},
                                                                    function(err) {
                                                                        if (err) return gscallback(err);
                                                                        else gscallback(null);
                                                                    }
                                                                );
                                                            });
                                                        }
                                                        else { //TODO dedup code
                                                            Action.findByIdAndUpdate(
                                                                amodel._id,
                                                                {finished: Date.now(), status: status, details: report},
                                                                {safe: true, upsert: false},
                                                                function(err) {
                                                                    if (err) return gscallback(err);
                                                                    else gscallback(null);
                                                                }
                                                            );
                                                        }
                                                    }
                                                }
                                            );
                                        }
                                    ],
                                    function (err) {
                                            if (err) console.log("Failure during import POST: " + err);                 
                                    });
                                });
                            });
                        }
                        else if (req.body.name == "Mark as cleaned") {
                            console.log(dmodel.name + " marked as cleaned");
                            res.status(200);
                            res.send();
                            Action.findByIdAndUpdate(
                                amodel._id,
                                {finished: Date.now(), status: "Success", details: "Cleaned."},
                                {safe: true, upsert: false},
                                function(err) {
                                    if (err) console.log("Failed to update an action: " + err);
                                }
                            );
                        }
                        else if (req.body.name == "Unload last import") {
                            console.log("Starting unload for " + dmodel.name);

                            Action.find({dataset: dmodel._id}) //TODO: only doing this to get actions in date sorted order, even though we could already have them - bad
                                .sort({started: 'desc'}).lean()
                                .exec(function(err, actions)
                                {
                                    var action_id = null;
                                    if (err) {
                                        res.status(400);
                                        return res.send({reason: err.toString()});
                                    }
                                    else {
                                        var action;
                                        for (action of actions) { //Remember these are in reverse date order, so we are grabbing the last import/mark cleaned
                                            if (action.name.indexOf('Import') != -1) {
                                                action_id = action._id;
                                                break;
                                            }
                                        }
                                        if (action_id) {
                                            res.status(200);
                                            res.send();
                                            unloader.unloadActionData(action_id, function(error, status, report) {
                                                console.log("Process finished");
                                                console.log("Status: " + status + "\n");
                                                Action.findByIdAndUpdate(
                                                    amodel._id,
                                                    {finished: Date.now(), status: status, details: report},
                                                    {safe: true, upsert: false},
                                                    function(err) {
                                                        if (err) console.log("Failed to update an action: " + err);
                                                    }
                                                );
                                            });
                                        }
                                        else {
                                            res.status(400);
                                            return res.send({reason:"No import to unload"});
                                        }
                                    }
                                });
                        }
                    }
                    else {
                        if (err) {
                            res.status(400);
                            return res.send({reason:err.toString()});
                        }
                        else {
                            res.status(404);
                            res.send({reason:"Couldn't find dataset"});
                        }
                    }
                }
            );
        }
    );

};

exports.getActionReport = function(req, res, next) {
    Action.findOne({_id: req.params.action_id},
                   function (err, action) {
                        if (err) {
                            return next(err);
                        }
                        else if (action) {
                            req.report = action.details;
                        }
                        else {
                            res.status(404);
                            return res.send({reason:"Couldn't find dataset"});
                        }
                        next();
                   });
};




// simulates the Companies House Extractives API. Dummy controller for not yet existing CH Extractives API data
exports.getTestdata = function(req, res, next) {

    var test = [{
           "ReportDetails"    : {
                notes           : "",
                reportEndDate   : "2015/10/12",
                reportName      : "TestReport1",
                companyNumber   : "1",                  // country: always GB. from DB: take ID for GB. If new company, add source
                companyName     : "company 2f",
                currency        : "Dollar",
                version         : 1,                    // check if source for report with current version already exists
                referenceNumber : "123",
                dateAdded       : "2015/11/11"
             }
           ,
           "projectTotals"           :  [{ projectTotal : {
                notes       : "",
                amount      : "10,000,000",
                projectCode : "tose",
                projectName : "Top Secret"          // query DB for projectCode (proj. identifier) first, then project name (might have changed). Deduplication / fuzzy check necessary
             }
           }],
           "governmentPaymentTotals" :  [{ PaymentTotals : {
                notes           : "",
                amount          : "12,000,000",                     // take only transfers (not totals). Totals calculated by controller. Check afterwards if sum matches totals
                government      : "USA",
                countryCodeList : "US",
             }
           }] ,
           "governmentPayments"      :  [{ governmentPayments : {
                 notes       : "",
                 amount      : "5,000,000",
                 government  : "USA",
                 countryCode : "US",
                 unitVolume  : {
                    valuationMethod  : "estimated",
                    volume           : "10",
                    unitMeasure      : "Dollar",
                 }
              }
            },
            { governmentPayments : {
                 notes       : "",
                 amount      : "7,000,000",
                 government  : "USA",
                 countryCode : "US",
                 unitVolume  : {
                    valuationMethod  : "estimated",
                    volume           : "10",
                    unitMeasure      : "Dollar",
                 }
              }
            }],
           "projectPayments"         :  [{ projectPayment : {
                notes       : "",
                paymentType : "transfer",
                amount      : "8,000,000",
                projectName : "Top Secret",     // check if transfer already exists. Source "UK mandatory...disclosure" must be added to new transfer
                projectCode : "tose",
                unitVolume  : {
                    valuationMethod  : "estimated",
                    volume           : "200",
                    unitMeasure      : "Dollar",
                 },
                CountryCodeList :"US"
             }
           }]
        },
        {
               "ReportDetails"    : {
                    notes           : "",
                    reportEndDate   : "2015/07/22",
                    reportName      : "TestReport2",
                    companyNumber   : "2",
                    companyName     : "Exxon",
                    currency        : "Dollar",
                    version         : 1,
                    referenceNumber : "123",
                    dateAdded       : "2015/08/03"
                 }
               ,
               "projectTotals"           :  [{ projectTotal : {
                    notes       : "",
                    amount      : "4,000,000",
                    projectCode : "newp",
                    projectName : "newproject"
                 }
               }],
               "governmentPaymentTotals" :  [{ PaymentTotals : {
                    notes           : "",
                    amount          : "30,000,000",
                    government      : "Germany",
                    countryCodeList : "DE",
                 }
               }] ,
               "governmentPayments"      :  [{ governmentPayments : {
                     notes       : "",
                     amount      : "10,000,000",
                     government  : "Germany",
                     countryCode : "DE",
                     unitVolume  : {
                        valuationMethod  : "estimated",
                        volume           : "5000",
                        unitMeasure      : "Euro",
                     }
                  }
                }],
               "projectPayments"         :  [{ projectPayment : {
                    notes       : "",
                    paymentType : "Transfer",
                    amount      : "2,000,000",
                    projectName : "newproject",
                    projectCode : "newp",
                    unitVolume  : {
                        valuationMethod  : "estimated",
                        volume           : "2345",
                        unitMeasure      : "Euro",
                     },
                    CountryCodeList :"DE"
                 }
               }]
            }]

    res.send(test)
};

// simulates the Companies House Extractives API. Dummy for duplicate entries (companies, projects)
exports.getDuplicatesTestData = function(req, res, next) {
  var file = 'files/ch_duplicates.json';
  var obj = JSON.parse(fs.readFileSync(file, 'utf8'));
  res.send(obj);
};

exports.identifyDuplicates = function(req, res, next) {
  var callback = function(message) {
    res.send(message);
  };
  duplicateHandler.findAndHandleDuplicates(req.params.action_id, callback);
};
