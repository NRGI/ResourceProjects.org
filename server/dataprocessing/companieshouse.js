//var Source = require('mongoose').model('Source'),
//	Country = require('mongoose').model('Country'),
//	Commodity = require('mongoose').model('Commodity'),
//	Company = require('mongoose').model('Company'),
//	Project = require('mongoose').model('Project'),
//	Link = require('mongoose').model('Link'),
//	Contract = require('mongoose').model('Contract'),
//	Concession = require('mongoose').model('Concession'),
//	Production = require('mongoose').model('Production'),
//	Transfer = require('mongoose').model('Transfer'),
//	ObjectId = require('mongoose').Types.ObjectId,
//	_ = require("underscore"),
//	csv     = require('csv'),
//	async   = require('async'),
//	moment = require('moment'),
//	request = require('superagent'),
//
//
////TODO: API Key
////API_KEY = process.env.CHAPIKEY
//
//	years = _.range(2000, 2016);
//
////country code is always GB
//countryGBId = '31a7e6c02937581218e16dd8';
//
////source type is always 'UK Mandatory payment disclosure'
//sourceTypeId = '56e8736944442a3824141429';
//
//
//exports.importData = function(finalcallback) {
//
//	var reportString = "";
//
//	var reporter = {
//		text: reportString,
//		add: function(more) {
//			this.text += more;
//		}
//	}
//
//	async.forEachOf(years, function (year, key, fcallback) {
//
//			console.log("year: " + year);
//			request			// for every year since 2000
//			//.get('https://extractives.companieshouse.gov.uk/api/year'+year.toString()+'/json')
//				.get('http://localhost:3030/api/testdata')
//				//.auth(API_KEY, '')
//				.end(function(err,res) {
//
//					if (err || !res.ok) {
//						reporter.add('error in retrieveing data from Companies House');
//						return finalcallback(err, reporter.text);	// continue loop
//					}
//					else {
//
//						if (!res.body || res.body == {}) {
//							// no data
//							return finalcallback(null, reporter.text);	// continue loop
//						}
//						else {
//
//							async.forEachOf(res.body, function (chReportData, key, icallback) {
//
//									loadChReport(chReportData, year, reporter, icallback);
//
//								},
//
//								function (err) {
//
//									if (err) {
//										reporter.add('Error in one retrieved report for year ' + year + '\n');
//										return fcallback(err);
//									}
//									reporter.add('Successfully handled report data for year ' + year + '\n');
//									fcallback(null);
//
//								}
//
//							);
//						}
//					}
//
//				});
//
//		},
//		function (err) {
//
//			if (err) {
//				reporter.add('Error in retrieved data from CH API\n');
//				return finalcallback(err,reporter.text);
//			}
//			reporter.add('Successfully handeled all data from CH API\n');
//			finalcallback(null,reporter.text);
//
//		}
//	);
//
//}
//
//
//
//function loadChReport(chData, year, report, loadcallback) {
//
//	async.waterfall([
//			loadSources.bind(null, report),
//			loadCompanies,
//			loadProjects,
//			loadTransfers,
//			//links throughout!//
//		], function (err, report) {
//			if (err) {
//				console.log("LOAD DATA: Got an error\n");
//				return loadcallback(err, report)
//			}
//			loadcallback(null, report);
//		}
//	);
//
//
//	function loadSources(report, callback) {
//
//		var version = chData.ReportDetails.version
//		var company = chData.ReportDetails.companyName
//
//		//TODO - may need some sort of sophisticated duplicate detection here
//		Source.findOne(
//			{source_url: 'https://extractives.companieshouse.gov.uk',
//				source_name: 'Companies House Extractives Disclosure of ' + company + ' for ' + year + ', Version ' + version},
//			null, //return everything
//			function(err, doc) {
//				if (err) {
//					report.add('Encountered an error while querying the DB: ' + err + '. Aborting.\n');
//					callback(err, report);
//				}
//				else if (doc) {
//					report.add('Source already exists in the DB (url and name match), not adding\n');
//					source = doc;
//					callback(null,report);
//				}
//				else {
//
//					report.add('Source not found in the DB, creating\n');
//					var newSource = makeNewSource(company, year, version);
//					Source.create(
//						newSource,
//						(function(err, model) {
//							if (err) {
//								report.add('Encountered an error while creating a source in the DB: ' + err + '. Aborting.\n');
//								return callback(err, report);
//							}
//							source = model;
//							callback(null,report);
//						})
//					);
//				}
//			}
//		);
//		source = new Object;
//	}
//
//
//	function loadCompanies(report, callback) {
//
//		// TODO: links
//
//		Company.findOne(
//			{$or: [
//				{companies_house_id: chData.ReportDetails.companyNumber},// TODO: is it enough when one of these two are found?
//				{company_name: chData.ReportDetails.companyName}				// erst nach ID suchen, wenn ID nicht gefunden wird, dann nach Name suchen. Dann deduplication flag
//			]},
//			function(err, doc) {
//				if (err) {
//					report.add('Encountered an error (' + err + ') while querying the DB for companies. Aborting.\n');
//					callback(err,report);
//				}
//				else if (doc) {
//					company = doc;
//					report.add('company already exists in the DB (name or alias match), not adding.\n');
//					callback(null,report);
//				}
//				else {
//					var newCompany = makeNewCompany(chData);
//					if (!newCompany) {
//						report.add('Invalid data in data: ' + chData + '. Aborting.\n');
//						return callback(null,report);
//					}
//					Company.create(
//						newCompany.obj,
//						function(err, cmodel) {
//							if (err) {
//								report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
//								return callback(err,report);
//							}
//							report.add('Added company ' + chData.ReportDetails.companyName + ' to the DB.\n');
//							company = cmodel;
//
//							// TODO: create links?
////				    					   if (newCompany.link) {
////				    					   testAndCreateLink(true, newCompany.link, cmodel._id);
////				    					   }
////				    					   else return callback(null);
//
//							callback(null,report);
//						}
//					);
//				}
//			}
//		);
//	}
//
//
//
//	function loadProjects(report, callback) {
//
//		projects = {}
//
//		function updateOrCreateProject(projDoc, projName, projId) {
//			var doc_id = null;
//
//			if (!projDoc) {
//				projDoc = makeNewProject(projName);
//			}
//			else {
//				doc_id = projDoc._id;
//				projDoc = projDoc.toObject();
//				delete projDoc._id; //Don't send id back in to Mongo
//				delete projDoc.__v; //https://github.com/Automattic/mongoose/issues/1933
//			}
//
//			// TODO: Project facts? cannot be updated, there are no data in CH API
//
//			if (!doc_id) doc_id = new ObjectId;
//			Project.findByIdAndUpdate(
//				doc_id,
//				projDoc,
//				{setDefaultsOnInsert: true, upsert: true, new: true},
//				function(err, model) {
//					if (err) {
//						report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
//						return callback(err,report);
//					}
//					report.add('Added or updated project ' + projName + ' to the DB.\n');
//					projects[projId] = model;
//
//					//return wcallback(null,report);
//
//				}
//			);
//		}
//
//		// TODO: create Links?
//
//		async.forEachOf(chData.projectTotals, function (projectTotalEntry, key, forcallback) {
//
//			//Projects - check against id and name
//			//TODO - may need some sort of sophisticated duplicate detection here
//			Project.findOne(
//				{$or: [
//					{proj_id: projectTotalEntry.projectTotal.projectCode},		// TODO: only projects for project totals or also for single project payments?
//					{proj_name: projectTotalEntry.projectTotal.projectName} //TODO: check both: project name and/or code ?
//				]},
//				function(err, doc) {
//					if (err) {
//						report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
//						return callback(err, report);
//					}
//					else if (doc) { //Project already exists, entry might represent a new site
//						report.add('Project ' + projectTotalEntry.projectTotal.projectName + ' already exists in the DB (id or name match), not adding but updating project\n');
//						projects[projectTotalEntry.projectTotal.projectCode] = doc; //Basis data is always the same, OK if this gets called multiple times
//						updateOrCreateProject(doc, projectTotalEntry.projectTotal.projectName, projectTotalEntry.projectTotal.projectCode);
//						// TODO: also create/update links here?
//						return callback(null, report);
//					}
//					else {
//						report.add('Project ' + projectTotalEntry.projectTotal.projectName + ' not found, creating.\n');
//						updateOrCreateProject(null,projectTotalEntry.projectTotal.projectName, null); //Proj = null = create it please
//						// TODO: also create/update links here?
//						return callback(null, report);
//					}
//				}
//			);
//		},   function (err, report) {
//
//			if (err) {
//				return callback(err, report);
//			}
//			callback(null, report);
//
//		});
//
//		projects = new Object;
//	}
//
//
//
//
//	function loadTransfers(report, callback) {
//
//		// TODO: check all project payments in list in for loop? Or async?
//		for (governmentPaymentEntry of chData.governmentPayments) {
//
//			// TODO: is a government payment always a "government_receipt?"
//			transfer_audit_type = "government_receipt"
//			transfer_type = "receipt";
//
//		}
//
//		async.forEachOf(chData.projectPayments, function (projectPaymentEntry, key, forcallback) {
//			//for (projectPaymentEntry of chData.projectPayments) {
//
//			//If project name for this payment was not yet in the project totals list, then something's wrong in the data, skip.
//			// TODO: check something else?
//			if (projects[projectPaymentEntry.projectPayment.projectName]) {
//				report.add('Invalid or missing data. Aborting.\n');
//				return callback(null,report);
//			}
//
//			var transfer_audit_type = "company_payment";
//			var transfer_type = projectPaymentEntry.projectPayment.paymentType;
//
//			var query = {transfer_country: countryGBId, transfer_audit_type: transfer_audit_type};
//			query.transfer_level = "project";
//
//			if (company) {
//				query.transfer_company = company._id
//			}
//			else {
//				report.add('Company data could not be retrieved. Aborting.\n');
//				return callback(null,report);
//			}
//
//
//			// Notice: assumption here is: transfer year = year of report date
//			query.transfer_year = year;
//			query.transfer_type = transfer_type;
//
//			Transfer.findOne(
//				query,
//				function(err, doc) {
//					if (err) {
//						report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
//						return callback(err,report);
//					}
//					else if (doc) {
//						report.add('Transfer for project' + projectPaymentEntry.projectPayment.projectName + ' already exists in the DB, not adding\n');
//						return callback(null,report);
//					}
//					else {
//						var newTransfer = makeNewTransfer(projectPaymentEntry.projectPayment, transfer_audit_type, "project", year)
//						if (!newTransfer) {
//							report.add('Invalid or missing data for new transfer. Aborting.\n');
//							return callback(null,report);
//						}
//						Transfer.create(
//							newTransfer,
//							function(err, model) {
//								if (err) {
//									report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
//									return callback(err,report);
//								}
//								else {
//									report.add('Added transfer for project ' + projectPaymentEntry.projectPayment.projectName + '\n');
//									callback(null,report);
//								}
//							}
//						);
//					}
//				}
//			);
//		},   function (err) {
//			if (err) {
//				callback(err,report);
//			}
//			callback(null, report);
//
//		});
//	}
//
//
//
//}
//
//
//
//function makeNewSource(company, year, version) {
//
//	var source = {
//		source_name: 'Companies House Extractives Disclosure of ' + company + ' for ' + year + ', Version ' + version,
//		source_type_id: '56e873691d1d2a3824141429',
//		source_url: 'https://extractives.companieshouse.gov.uk',
//		source_notes: 'Source for Companies House Extractive API Import',
//		source_date: Date.now(),
//		retrieve_date: Date.now()
//		/* TODO create_author:, */
//	}
//
//	// TODO: handle duplicates?
////	if (flagDuplicate) {
////	source.possible_duplicate = true;
////	source.duplicate = duplicateId
////	}
//	return source;
//}
//
//
//var makeNewCompany = function(newData) {
//	var returnObj = {obj: null, link: null};
//	var company = {
//		company_name: newData.ReportDetails.companyName
//	};
//
//	if (newData.ReportDetails.companyNumber != "") {
//		company.open_corporates_id = newData.ReportDetails.companyNumber;
//	}
//
//	company.country_of_incorporation = [{country: '31a7e6c02937581218e16dd8'}]; //Fact
//
//	if (source) {
//		company.company_established_source = source
//	}
//	else return false; //error
//
//	// company groups not relevant here
//
//	returnObj.obj = company;
//	return returnObj;
//}
//
//var makeNewProject = function(projectName,projectCode) {
//
//	var project = {
//		proj_name: projectName,
//		proj_established_source: source._id,
//		proj_id: projectCode
//	};
//	return project;
//}
//
//
//function makeNewTransfer(paymentData, transfer_audit_type, transfer_level, year) {
//
//	var transfer = {
//		source: source._id,
//		country: countryGBId,
//		transfer_audit_type: transfer_audit_type
//	};
//
//
//	if (company) {
//		transfer.company = company._id;
//	}
//	else return false; //error
//
//	// project or country
//	transfer.transfer_level = transfer_level
//
//	// TODO: report year = transfer year?
//	transfer.transfer_year = year
//	transfer.transfer_type = paymentData.paymentType;
//	transfer.transfer_unit = paymentData.unitVolume.UnitMeasure;
//
//	transfer.transfer_audit_type = transfer_audit_type
//
//	// TODO: amount or unitVolume.volume??
//	transfer.transfer_value = paymentData.amount.replace(/,/g, "");
//
//	if (projects[paymentData.projectCode]) {
//		transfer.project = projects[paymentData.projectCode]._id
//	}
//	else return false; //error
//
//	if (transfer_audit_type == "government_receipt") {
//
//		if (paymentData.government != "") transfer.transfer_gov_entity = paymentData.government;
//
//	}
//
//	return transfer;
//}