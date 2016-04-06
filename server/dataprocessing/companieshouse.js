var Source = require('mongoose').model('Source'),
Country = require('mongoose').model('Country'),
Commodity = require('mongoose').model('Commodity'),
Company = require('mongoose').model('Company'),
Project = require('mongoose').model('Project'),
Link = require('mongoose').model('Link'),
Contract = require('mongoose').model('Contract'),
Concession = require('mongoose').model('Concession'),
Production = require('mongoose').model('Production'),
Transfer = require('mongoose').model('Transfer'),
Duplicate = require('mongoose').model('Duplicate'),
ObjectId = require('mongoose').Types.ObjectId,
isocountries = require("i18n-iso-countries"),
_ = require("underscore"),
csv     = require('csv'),
async   = require('async'),
moment = require('moment'),
request = require('superagent'),
fusejs = require('fuse.js'),
randomstring = require('just.randomstring');


//TODO: API Key could be set as environment variable
//API_KEY = process.env.CHAPIKEY

// define desired report years here
years = _.range(2000, 2016);

//country code is always GB
countryGBId = '31a7e6c02937581218e16dd8';

//source type is always 'UK Mandatory payment disclosure'
sourceTypeId = '56e8736944442a3824141429';


exports.importData = function(action_id, finalcallback) {	

	var reportString = "";

	var reporter = {
			text: reportString,
			add: function(more) {
				this.text += more;
			}
	}	 

	// loop all years in the given range and call the Companies House Extractives API for each of these years
	async.eachSeries(years, function (year, fcallback) {
		
		console.log("year: " + year);
				
		// Call Companies House Extractives API
		// TODO: At the moment, some fake data are used for testing purposes. This should be changed to the real API URL as soon as data are available.
		
		request
		//.get('https://extractives.companieshouse.gov.uk/api/year'+year.toString()+'/json')
		.get('http://localhost:3030/api/testdata')
		//.auth(API_KEY, '')
		.end(function(err,res) {

			if (err || !res.ok) {
				reporter.add('error in retrieveing data from Companies House');
				return finalcallback(err, reporter.text);	// continue loop
			}
			else {

				if (!res.body || res.body == {}) {
					// no data
					return finalcallback(null, reporter.text);
				}
				else {
					
					// get all reports for this year and handle them one after another
					async.eachSeries(res.body, function (chReportData, icallback) {

						loadChReport(chReportData, year, reporter, action_id, icallback);
						
					},

					function (err) {

						if (err) {
							reporter.add('Error in one retrieved report for year ' + year + '\n');
							return fcallback(err);
						}
						reporter.add('Successfully handled report data for year ' + year + '\n');
						fcallback(null);

					}

					);
				}
			}

		});
		
	}
	,
	function (err) {

		if (err) {
			reporter.add('Error in retrieved data from CH API\n');
			return finalcallback(err,reporter.text);
		}
		reporter.add('Successfully handled all data from CH API\n');
		finalcallback(null,reporter.text);

	}		
	);

}



//Data needed for inter-entity reference
var source, company, projects;


// load report data sequentially from Extractives reports
function loadChReport(chData, year, report, action_id, loadcallback) {

	async.waterfall([
	                 loadSource.bind(null, report),
	                 loadCompany,
	                 loadProjects,
	                 loadTransfers,
	                 ], function (err, report) {
		if (err) {
			console.log("LOAD DATA: Got an error\n");
			return loadcallback(err, report)
		}
		loadcallback(null, report);
	}
	);


	// checks if a source for this combination of year, report version and company already exists, creates a new one otherwise
	function loadSource(report, callback) {
		
		var version = chData.ReportDetails.version
		var company = chData.ReportDetails.companyName

		Source.findOne(
				{source_url: 'https://extractives.companieshouse.gov.uk',
					
					// Source name identifies the new source and is used for this combination of year, report version and company
					source_name: 'Companies House Extractives Disclosure of ' + company + ' for ' + year + ', Version ' + version},
					null, //return everything
					function(err, doc) {
						if (err) {
							report.add('Encountered an error while querying the DB: ' + err + '. Aborting.\n');
							return callback(err, report);
						}
						else if (doc) {
							report.add('Source already exists in the DB (url and name match), not adding\n');
							source = doc;
							return callback(null,report);
						}
						else {

							report.add('Source not found in the DB, creating\n');
							var newSource = makeNewSource(company, year, version);
							Source.create(
									newSource,
									(function(err, model) {
										if (err) {
											report.add('Encountered an error while creating a source in the DB: ' + err + '. Aborting.\n');
											return callback(err, report);
										}
										source = model;
										return callback(null,report);
									})
							);
						}
					}
		);
		source = new Object;
	}


	// checks if the company of this report already exists in the DB, creates a new one otherwise and then checks for potential duplicates 
	function loadCompany(report, callback) {
		
	
		function handleCompanyDuplicates(companiesList, companyName, company_id) {
			
            // use fuse for fuzzy search in nested search results
			
			// tokenize: check for single words AND the complete String
			// threshold: desired exactness of match
            var fuse = new fusejs(companiesList, { keys: ["company_name", "company_aliases"], tokenize: true, threshold: 0.4});
            
            var searchResult = fuse.search(companyName);
            
            if (!searchResult || searchResult == []) {
            	report.add('Found no matching companies in DB for company ' + companyName + ' and thus, no potential duplicate\n');
            	return callback(null, report);								                
            }
            else {
            
            	// potential duplicates for company found								                	
            	report.add('Found '+ searchResult.length-1 + ' matching companies which are potential duplicates\n');

            	notes = 'Found  '+ searchResult.length-1 + ' potentially matching company names for company ' + companyName + ' during Companies House API import. Date: ' + Date.now() 
            	
            	for (originalCompany of searchResult) {
            		
            		// recently created company is not a duplicate to itself
            		// TODO: handle exact match if necessary
            		if (originalCompany.company_name != companyName) {
            		
            			// create a new duplicate object
	            		var newDuplicate = makeNewDuplicate(originalCompany._id, company_id, action_id, "company", notes);
	            		
	            		Duplicate.create(
	            				newDuplicate,
	            				function(err, dmodel) {
									if (err) {
										report.add('Encountered an error while creating a duplicate: ' + err + '. Aborting.\n');
										return callback(err,report);
									}
									report.add('Created duplicate entry for company ' + companyName + ' in the DB.\n');
									return callback(null, report);
									
								}
	            			);   
            		}
            	}
            	            
            }
			
		}
		

		Company.findOne(
				{
					companies_house_id: chData.ReportDetails.companyNumber
				},                   

				function(err, doc) {
					if (err) {
						report.add('Encountered an error (' + err + ') while querying the DB for companies. Aborting.\n');
						return callback(err,report);
					}
					else if (doc) {
						company = doc;
						report.add('company ' + chData.ReportDetails.companyName + ' already exists in the DB (CH ID match), not adding.\n');
						return callback(null,report);
					}
					else {
						var companyquery = Company.findOne(
								{
									company_name: chData.ReportDetails.companyName		// TODO: also check aliases?
								},
								function(err, doc) {
									if (err) {
										report.add('Encountered an error (' + err + ') while querying the DB for companies. Aborting.\n');
										return callback(err,report);
									}
									else if (doc) {										
																				
										// company with this exact name is found. use this and create no duplicate.
										company = doc;
										
										// TODO: add aliases in comment if aliases are considered
										report.add('company ' + chData.ReportDetails.companyName + ' already exists in the DB (name match), not adding.\n');
										callback(null,report);
									}
									else {																				
										
										// company with this exact name is not found in the database. get a list with all companies and handle duplicates via fuzzy search
										// create a company first and then use it as potential duplicate if similar companies exist or otherwise, create and use it as the one and only company with this name.
										
						            	// create a new company
										var newCompany = makeNewCompany(chData);
										if (!newCompany) {
											report.add('Invalid data in data: ' + chData + '. Aborting.\n');
											return callback(null,report);
										}
										Company.create(
												newCompany.obj,
												function(err, cmodel) {
													if (err) {
														report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
														return callback(err,report);
													}
													report.add('Added company ' + chData.ReportDetails.companyName + ' to the DB.\n');
													company = cmodel;
													
													// retrieve a list of all companies in the DB. it is used for checking the project names in the current report for potential duplicates / similar entries.
													// This could potentially be optimized by fuzzy search on the DB instead.  
													var allCompanies = Company.find({}, function (err, cresult) {
														
											            if (err) {
											                report.add('Got an error: ' + err + ' while finding all companies.\n');
											                return callback(err,report);
											            }
											            else {
											            									            									           
															// check for potential duplicates now
															handleCompanyDuplicates(cresult, chData.ReportDetails.companyName, company._id);
															callback(null,report);
																																			                								              												    									                																					                								             
											            }
											        });													
																											
												}														
										);
																														
									
									}
								}
						);
						
						
					}
				}
		);
	}

	// checks if the project entries of this report already exist in the DB, creates new ones otherwise and then checks for potential duplicates
	// So far, only projects from the "project totals" of each report are used
	function loadProjects(report, callback) {
		
		projects = {}
		
		function handleProjectDuplicates(projectsList, projectName, project_id) {
			
            // use fuse for fuzzy search in nested search results
			
            var fuse = new fusejs(projectsList, { keys: ["proj_name", "proj_aliases"], tokenize: true, threshold: 0.4 });
            
            var searchResult = fuse.search(projectName);
            
            if (!searchResult || searchResult == []) {
            	report.add('Found no matching projects in DB for project ' + projectName + ' and thus, no potential duplicate\n');
            	return callback(null, report);								                
            }
            else {
            
            	// potential duplicates for project found								                	
            	report.add('Found '+ (searchResult.length-1) + ' matching projects which are potential duplicates\n');

            	notes = 'Found  '+ (searchResult.length-1) + ' potentially matching project names for project ' + projectName + ' during Companies House API import. Date: ' + Date.now() 
            	
            	for (originalProject of searchResult) {
            		
            		// recently created project is not a duplicate to itself
            		// TODO: handle exact match if necessary            		
            		if (originalProject.proj_name != projectName) {
            		
	            		var newDuplicate = makeNewDuplicate(originalProject._id, project_id, action_id, "project", notes);
	            		
	            		Duplicate.create(
	            				newDuplicate,
	            				function(err, dmodel) {
									if (err) {
										report.add('Encountered an error while creating a duplicate: ' + err + '. Aborting.\n');
										return callback(err,report);
									}
									report.add('Created duplicate entry for project ' + projectName + ' in the DB.\n');
									return callback(null, report);
									
								}
	            			);   
            		}
            	}
            	
            }
			
		}			

		function updateOrCreateProject(projDoc, projName, projId, countryCode) {
			var doc_id = null;
			var newProj = true;

			if (!projDoc) {
				projDoc = makeNewProject(projName, projId, countryCode);
			}
			else {
				newProj = false;
				doc_id = projDoc._id;
				projDoc = projDoc.toObject();
				delete projDoc._id; //Don't send id back in to Mongo
				delete projDoc.__v; //https://github.com/Automattic/mongoose/issues/1933
			}

			if (!doc_id) doc_id = new ObjectId;
			Project.findByIdAndUpdate(
					doc_id,
					projDoc,
					{setDefaultsOnInsert: true, upsert: true, new: true},
					function(err, model) {
						if (err) {
							report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
							return callback(err);
						}
																	
						report.add('Added or updated project ' + projName + ' to the DB.\n');
						projects[projId] = model;
						
						var allProjects = Project.find({}, function (err, cresult) {
							
				            if (err) {
				                report.add('Got an error: ' + err + ' while finding all projects.\n');
				                return callback(err,report);
				            }
				            else {
				            	
				            	if (newProj) {
				            		// check for potentially existing project duplicates now
									handleProjectDuplicates(cresult, projName, model._id);
				            	}
																												                								              												    									                																					                								             
				            }
				        });							

						// create a new link between this project and the referring report company
						createLink(company._id,model._id,source._id, projName);

					}
			);
		}

		function createLink(company_id, project_id, source_id, projName) {

			Link.findOne(
					{
						company: company_id,
						project: project_id,
						source: source_id
					},
					function(err, doc) {  
						if (err) {
							report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
							return callback(err, report);
						}
						else if (doc) {
							report.add('Company is already linked with project ' + projName + ', not adding\n');
							return callback(null, report);
						}
						else {
							var newCompanyLink = {
									company: company_id,
									project: project_id,
									source: source_id,
									entities:['company','project']
							};
							Link.create(
									newCompanyLink,
									function(err, model) {
										if (err) {
											report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
											return callback(err);
										}
										report.add('Linked company with project in the DB.\n');
										return callback(null, report);
									}
							);
						}
					}
			);
		}			
			

		async.eachSeries(chData.projectTotals, function (projectTotalEntry, forcallback) {

			//Projects - check against id and name
			
			// TODO: country code list for countries?

			Project.findOne(
					{
						proj_id: projectTotalEntry.projectTotal.projectCode		// TODO: only projects for project totals or also for single project payments?
					},
					function(err, doc) {
						if (err) {
							report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
							return forcallback(err);
						}
						else if (doc) {
							report.add('Project ' + projectTotalEntry.projectTotal.projectName + ' already exists in the DB (id or name match), not adding but updating project.\n');
							projects[projectTotalEntry.projectTotal.projectCode] = doc;
							updateOrCreateProject(doc, projectTotalEntry.projectTotal.projectName, projectTotalEntry.projectTotal.projectCode, forcallback);
						}
						else {					    		   

							var projectCodefromDB = null; 
							Project.findOne(
									{
										proj_name: projectTotalEntry.projectTotal.projectName
									},
									function(err, doc) {
										if (err) {
											report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
											return forcallback(err);
										}
										else if (doc) {
											report.add('Project ' + projectTotalEntry.projectTotal.projectName + ' already exists in the DB (id or name match), not adding but updating project.\n');

											if (!doc.proj_id) {
												report.add('Project ' + projectTotalEntry.projectTotal.projectName + ' has no project code in DB. Aborting.\n');
												return forcallback(null);
											}

											projectCodefromDB = doc.proj_id;
											projects[projectCodefromDB] = doc;
											// TODO: if country code list is read from data, use here instead of GB
											updateOrCreateProject(doc, projectTotalEntry.projectTotal.projectName, projectCodefromDB, "gb");
										}
										else {					    		   
											// TODO: if country code list is read from data, use here instead of GB
											report.add('Project ' + projectTotalEntry.projectTotal.projectName + ' not found, creating.\n');
											updateOrCreateProject(null,projectTotalEntry.projectTotal.projectName, projectTotalEntry.projectTotal.projectCode, "gb"); //Proj = null = create it please																																
										}
									}
							);

						}
					}
			);
		},   function (err) {

			if (err) {
				return callback(err, report);
			}
			callback(null, report);

		});

		projects = new Object;
	}



	// checks if the transfer entries of this report already exist in the DB, creates new ones otherwise.
	// This is done separately for government payments (transfer level "country") and project payments (transfer level "project")
	// So far, only single transfers are handled. Transfer totals are not yet calculated or validated
	function loadTransfers(report, callback) {

		// Handle transfers from government payments
		async.eachSeries(chData.governmentPayments, function (governmentPaymentsEntry, forcallback) {

			var transfer_audit_type = "company_payment";
			var transfer_level = "country";

			// TODO: transfer_type = Total?
			var transfer_type = "Total";
			var transfer_gov_entity = governmentPaymentsEntry.governmentPayments.government;				

			// TODO: wrong result if point instead of comma for thousands separator
			var transfer_value = parseFloat(governmentPaymentsEntry.governmentPayments.amount.replace(/,/g, ""));
			var transfer_note = governmentPaymentsEntry.governmentPayments.notes;			
			var country = governmentPaymentsEntry.governmentPayments.countryCode;			
			var country_iso2 = null;

			if (country.length == 2) {
				country_iso2 = country.toUpperCase();
			}
			else {
				if (country.length == 3) {

					// convert iso3 to iso2 country codes
					country_iso2 = isocountries.alpha3ToAlpha2(country).toUpperCase();
				}
			}

			var country_id = null;

			Country.findOne(
					{
						iso2: country_iso2,
					},
					function(err, doc) {  
						if (err) {
							report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
							return ccallback(err);
						}
						else if (doc) {
							country_id = doc._id
						}
						else {
							report.add('Country ' + country  + ' could not be found in the DB. Country cannot be assigned to transfer\n');
						}
					}
			);

			var query = {
					country: country_id,
					transfer_gov_entity: transfer_gov_entity, 
					transfer_audit_type: transfer_audit_type, 
					transfer_level: transfer_level, 
					transfer_type: transfer_type, 
					transfer_value: transfer_value, 
					transfer_note: transfer_note, 
					source: source._id
			};

			if (company) {
				query.company = company._id;
			}
			else {
				report.add('Company data could not be retrieved. Aborting.\n');
				return forcallback(null);
			}			

			Transfer.findOne(
					query,
					function(err, doc) {
						if (err) {
							report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
							return forcallback(err);
						}
						else if (doc) {
							report.add('Transfer for government ' + transfer_gov_entity + ' already exists in the DB, not adding\n');
							return forcallback(null);
						}
						else {
							
							// create a new transfer entry in the DB if it does not exist yet
							var newTransfer = makeNewTransfer(governmentPaymentsEntry.governmentPayments, transfer_audit_type, "country", year, country_id)
							if (!newTransfer) {
								report.add('Invalid or missing data for new transfer. Aborting.\n');
								return forcallback(null);
							}
							Transfer.create(
									newTransfer,
									function(err, model) {
										if (err) {
											report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
											return forcallback(err);
										}
										else {
											report.add('Added transfer for government ' + transfer_gov_entity + '\n');
											forcallback(null);
										}
									}
							);
						}
					}
			);			


		},   function (err) {
			if (err) {
				return callback(err,report);
			}
			callback(null, report);

		});

		// Handle transfers from project payments		
		async.eachSeries(chData.projectPayments, function (projectPaymentEntry, forcallback) {

			//If project code for this payment was not yet in the project totals list, then something's wrong in the data, skip.
			if (!projects[projectPaymentEntry.projectPayment.projectCode]) {
				report.add('Invalid or missing project data. Aborting.\n');
				return forcallback(null);
			}

			var transfer_audit_type = "company_payment";
			var transfer_type = projectPaymentEntry.projectPayment.paymentType;			
			var transfer_level = "project";			

			// TODO: wrong result if point instead of comma for thousands-separator
			var transfer_value = parseFloat(projectPaymentEntry.projectPayment.amount.replace(/,/g, ""));

			var transfer_note = projectPaymentEntry.projectPayment.notes;
			var project = projects[projectPaymentEntry.projectPayment.projectCode]._id;

			var query = {
					country: countryGBId, 
					project: project, 
					transfer_audit_type: transfer_audit_type, 
					transfer_level: transfer_level, 
					transfer_type: transfer_type, 
					transfer_value: transfer_value, 
					transfer_note: transfer_note, 
					source: source._id
			};

			if (company) {
				query.company = company._id
			}
			else {
				report.add('Company data could not be retrieved. Aborting.\n');
				return forcallback(null);
			}

			// TODO: transfer year = year of report date?
			//query.transfer_year = year;

			Transfer.findOne(
					query,
					function(err, doc) {
						if (err) {
							report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
							return forcallback(err);
						}
						else if (doc) {
							report.add('Transfer for project' + projectPaymentEntry.projectPayment.projectName + ' already exists in the DB, not adding\n');
							return forcallback(null);
						}
						else {
							// create a new transfer entry in the DB if it does not exist yet
							var newTransfer = makeNewTransfer(projectPaymentEntry.projectPayment, transfer_audit_type, "project", year, countryGBId)
							if (!newTransfer) {
								report.add('Invalid or missing data for new transfer. Aborting.\n');
								return forcallback(null);
							}
							Transfer.create(
									newTransfer,
									function(err, model) {
										if (err) {
											report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
											return forcallback(err);
										}
										else {
											report.add('Added transfer for project ' + projectPaymentEntry.projectPayment.projectName + '\n');
											forcallback(null);
										}
									}
							);
						}
					}
			);
		},   function (err) {
			if (err) {
				return callback(err,report);
			}
			callback(null, report);

		});
	}


}



function makeNewSource(company, year, version) {

	var source = {
			source_name: 'Companies House Extractives Disclosure of ' + company + ' for ' + year + ', Version ' + version,
			source_type_id: '56e873691d1d2a3824141429',
			source_url: 'https://extractives.companieshouse.gov.uk',
			source_notes: 'Source for Companies House Extractive API Import',
			source_date: Date.now(),
			retrieve_date: Date.now()
			/* TODO create_author:, */
	}

	return source;
}


function makeNewCompany (newData) {
	var returnObj = {obj: null, link: null};
	var company = {
			company_name: newData.ReportDetails.companyName
	};

	if (newData.ReportDetails.companyNumber != "") {
		company.open_corporates_id = newData.ReportDetails.companyNumber;
	}

	company.country_of_incorporation = [{country: '31a7e6c02937581218e16dd8'}]; //Fact

	if (source) {
		company.company_established_source = source
	}
	else return false; //error

	returnObj.obj = company;
	return returnObj;
}


function makeNewDuplicate(original_id, duplicate_id, action_id, entity, notes) {

	var duplicate = {
			original: original_id,
			duplicate: duplicate_id,
			created_from: action_id,
			entity: entity,
			resolved: false,
			notes: notes
			// TODO: user
			//resolved_by: user_id,
	}

	return duplicate;
}

function makeNewProject(projectName,projectCode, countryCode) {	

	var project = {
			proj_name: projectName,
			proj_established_source: source._id,

	};

	if (!projectCode) {		

		if (projectName.indexOf(" ") > -1) {
			var spacePos = projectName.indexOf(" ");	
			project.proj_id = countryCode.toLowerCase() + '-' + projectName.toLowerCase().slice(0, 2) + projectName.toLowerCase().slice(spacePos + 1, spacePos + 3) + '-' + randomstring(6).toLowerCase();
		}
		else {
			project.proj_id = countryCode.toLowerCase() + '-' + projectName.toLowerCase().slice(0, 4) + '-' + randomstring(6).toLowerCase();
		}
	}
	else {
		project.proj_id = projectCode;
	}

	return project;
}


function makeNewTransfer(paymentData, transfer_audit_type, transfer_level, year, country_id) {

	var transfer = {
			source: source._id,
			transfer_audit_type: transfer_audit_type,
			// TODO: transfer_year == report year?
			//transfer_year: year,
			transfer_level: transfer_level,
			transfer_type: paymentData.paymentType,
			transfer_audit_type: transfer_audit_type,
			transfer_note: paymentData.notes,
			transfer_value: parseFloat(paymentData.amount.replace(/,/g, ""))
	};	

	// if country could be found in the DB, transfer is created without country information
	if (country_id) {

		transfer.country = country_id;
	}


	if (company) {
		transfer.company = company._id;
	}
	else return false; //error

	if (transfer_level == "project") {
		if (projects[paymentData.projectCode]) {
			transfer.project = projects[paymentData.projectCode]._id;
		}
		else return false; //error
	}

	if (transfer_level == "country") {

		if (paymentData.government != "") {
			transfer.transfer_gov_entity = paymentData.government;
		}

	}

	return transfer;
}
