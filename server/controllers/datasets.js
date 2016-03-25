var Dataset 		= require('mongoose').model('Dataset'),
    Duplicate		= require('mongoose').model('Duplicate'),
    Action 		    = require('mongoose').model('Action'),
    async           = require('async'),
    _               = require("underscore"),
    googlesheets    = require('../dataprocessing/googlesheets.js');
	// companieshouse  = require('../dataprocessing/companieshouse.js');

exports.getDatasets = function(req, res) {
    var dataset_len, limit = null, skip = 0;

    if (req.params.limit) limit = Number(req.params.limit);
    if (req.params.skip) skip = Number(req.params.skip);

    async.waterfall([
        datasetCount,
        getAllDatasets
    ], function (err, result) {
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
            .populate('created_by')
            .populate('actions')
            .lean()
            .exec(function(err, datasets) {
                if(datasets) {
                    async.each(datasets, function (dataset, ecallback) {
                        var action_ids = [];
                        var action_id;
                        //for (action_id of dataset.actions) {
                        //  action_ids.push(action_id);
                        //}
                      Duplicate.find(
                            { created_from: { $in: action_ids } },
                            function (err, duplicates) {
                                if (duplicates.length > 0) {
                                    dataset.hasDuplicates = true;
                                }
                                else dataset.hasDuplicates = false;
                                    ecallback(null); //This one finished
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

exports.createDataset = function(req, res, next) {
	var datasetData = req.body;
	//TODO: uncomment once working //datasetData.created_by = req.user._id;

	Dataset.create(datasetData, function(err, dataset) {
		if(err){
			res.status(400)
			return res.send({reason:err.toString()})
		}
	});
	res.send();
};

exports.createAction = function(req, res, next) {
    var user_id;
    if (!req.user) {
        user_id = null;
    }
    else {
        user_id = req.user._id;
    }
    console.log("Starting an action for dataset " + req.params['id']);
    //Create the action and set status "running"
    Action.create(
        {name: req.body.name, started: Date.now(), status: "Started", started_by: user_id},
        function(err, amodel) {
            if (err) {
                res.status(400);
                console.log(err);
	            return res.send({reason:err.toString()})
            }
            Dataset.findByIdAndUpdate(
                req.params['id'],
                {$push: {"actions": amodel._id}},
                {safe: true, upsert: false, new: true},
                function(err, dmodel) {
			console.log("found: " + dmodel._id);
                    if (!err && dmodel) {
                        if (req.body.name == "Import from Google Sheets") {
                            console.log("Starting import from " + dmodel.name);
                            res.status(200);
                            res.send();
                            console.log("Triggered, res sent\n");
                            googlesheets.processData(dmodel.source_url, function(status, report) {
                                console.log("process finished");
                                console.log("Status: " + status + "\n");
                                console.log("Report: " + report + "\n");
                                Action.findByIdAndUpdate(
                                    amodel._id,
                                    {finished: Date.now(), status: status, details: report},
                                    {safe: true, upsert: false, new: true},
                                    function(err, ramodel) {
                                        if (err) console.log("Failed to update an action: " + err);
                                    }
                                );
                            });
                        }
                        else {
				if (req.body.name == "Import from Companies House API") {
		                        console.log("Starting import from " + dmodel.name);
		                        res.status(200);
		                        res.send();
		                        console.log("Triggered, res sent\n");
		                        // companieshouse.importData(function(status, report) {
						// console.log("process finished");
		                 //            console.log("Status: " + status + "\n");
		                 //            console.log("Report: " + report + "\n");
		                 //            Action.findByIdAndUpdate(
				         //            amodel._id,
				         //            {finished: Date.now(), status: status, details: report},
				         //            {safe: true, upsert: false},
				         //            function(err, amodel) {
						// 	if (err) console.log("Failed to update an action: " + err);
				         //            }
		                 //            );
		                 //        });
	                        }
	                    }
                    }
                    else {  
                        if (err) {
                            res.status(400);
                            return res.send({reason:err.toString()})
                        }
                        else {
                            res.status(404);
                            res.send();
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
                        else req.report = action.details;
                        next();
                   });
}




// simulates the Companies House Extractives API. Dummy controller for not yet existing CH Extractives API data
exports.getTestdata = function(req, res, next) {

	var test = [{
		   "ReportDetails"    : {
		        notes           : "",
		        reportEndDate   : "2015/10/12",
		        reportName      : "TestReport1",
		        companyNumber   : "1",					// country: always GB. from DB: take ID for GB. If new company, add source
		        companyName     : "Shell",
		        currency        : "Dollar",
		        version         : 1,					// check if source for report with current version already exists
		        referenceNumber : "123",
		        dateAdded       : "2015/11/11"
		     }
		   ,
		   "projectTotals"           :  [{ projectTotal : {
		        notes       : "",
		        amount      : "10,000,000",
		        projectCode : "abc",
		        projectName : "secret"			// query DB for projectCode (proj. identifier) first, then project name (might have changed). Deduplication / fuzzy check necessary
		     }
		   }],
		   "governmentPaymentTotals" :  [{ PaymentTotals : {
		        notes           : "",
		        amount          : "12,000,000",						// take only payments (not totals). Totals calculated by controller. Check afterwards if sum matches totals
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
		        projectName : "testproject",		// check if transfer already exists. Source "mandatory...disclosure" must be added to new transfer
		        projectCode : "tp",
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
			        projectCode : "cde",
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
			        projectName : "otherproject",
			        projectCode : "op",
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
