var Source 			= require('mongoose').model('Source'),
	Country 		= require('mongoose').model('Country'),
	Commodity 		= require('mongoose').model('Commodity'),
	Company 		= require('mongoose').model('Company'),
	Project 		= require('mongoose').model('Project'),
	Link 			= require('mongoose').model('Link'),
	Contract 		= require('mongoose').model('Contract'),
	Concession 		= require('mongoose').model('Concession'),
	Production 		= require('mongoose').model('Production'),
	Transfer 		= require('mongoose').model('Transfer'),
	Duplicate 		= require('mongoose').model('Duplicate'),
	ObjectId 		= require('mongoose').Types.ObjectId,
	isocountries 	= require("i18n-iso-countries"),
	_ 				= require("underscore"),
	csv     		= require('csv'),
	async  			= require('async'),
	moment 			= require('moment'),
	request 		= require('superagent'),
	fusejs 			= require('fuse.js'),
	randomstring	= require('just.randomstring');

API_KEY = process.env.CHAPIKEY;

//define desired report years here
years = _.range(2014, 2016);

//source type is always 'UK Mandatory payment disclosure'
var sourceTypeId = '56e8736944442a3824141429';

//Data needed for inter-entity reference
var source, company, projects, countries, currency;

exports.importData = function(action_id, finalcallback) {

	var reportString = "";

	var reporter = {
		text: reportString,
		add: function(more) {
			this.text += more;
		}
	}

	if (!API_KEY || (API_KEY == '')) {
		reporter.add("API key must be set as environment variable CHAPIKEY! Aborting.")
		return finalcallback("Failed", reporter.text);
	}

	// loop all years in the given range and call the Companies House Extractives API for each of these years
	var processYears = function() {
		async.eachSeries(years, function (year, fcallback) {

				projects = {};

				reporter.add('Processing year ' + year);

				// Call Companies House Extractives API

				request
					.get('https://extractives.companieshouse.gov.uk/api/year/'+year.toString()+'/json')
					// .get('http://localhost:3030/api/testdata')
					.auth(API_KEY, '')
					.end(function(err,res) {

						if (err || !res.ok) {
							reporter.add('error in retrieving data from Companies House: ' + err);
							return finalcallback("Failed", reporter.text);	// continue loop
						}
						else {

							if (!res.body || res.body == {}) {
								// no data
								return finalcallback("Failed", reporter.text);
							}
							else {

								// get all reports for this year and handle them one after another
								async.eachSeries(res.body, function (chReportData, icallback) {
										//Set currency for this report
										currency = chReportData.reportDetails.currency;
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
			},
			function (err) {

				if (err) {
					reporter.add('Error in retrieved data from CH API: \n' + err);
					return finalcallback("Failed",reporter.text);
				}
				reporter.add('Successfully handled all data from CH API\n');
				finalcallback("Success", reporter.text);

			}
		);
	};

	// Get all countries from the DB
	reporter.add("Getting countries from database...\n");
	countries = new Object;
	Country.find({}, function (err, cresult) {
		if (err) {
			reporter.add(`Got an error: ${err}\n`);
			return finalcallback("Failed", reporter.text);
		}
		else {
			reporter.add(`Found ${cresult.length} countries\n`);
			var ctry;
			for (ctry of cresult) {
				country_iso3 = isocountries.alpha2ToAlpha3(ctry.iso2).toUpperCase();
				countries[country_iso3] = ctry;
			}
			processYears();
		}
	});
};

//load report data sequentially from Extractives reports
function loadChReport(chData, year, report, action_id, loadcallback) {
	async.waterfall([
			loadSource.bind(null, report),
			loadCompany,
			loadProjects,
			loadTransfers,
		], function (err, report) {
			if (err) {
				if (err === "source exists") {
					report.add("Done. Not importing data for existing source.\n");
					return loadcallback(null, report);
				}
				else {
					report.add("LOAD DATA: Got an error\n");
					return loadcallback(err, report);
				}
			}
			loadcallback(null, report);
		}
	);


	// checks if a source for this combination of year, report version and company already exists, creates a new one otherwise
	function loadSource(report, callback) {

		var version = chData.reportDetails.version;
		var company = chData.reportDetails.companyName;

		Source.findOne(
			{source_url: 'https://extractives.companieshouse.gov.uk',

				// Source name identifies the new source and is used for this combination of year, report version and company
				source_name: 'Companies House Extractives Disclosure of ' + company + ' for ' + year + ', Version ' + version},
			null, // return everything
			function(err, doc) {
				if (err) {
					report.add('Encountered an error while querying the DB: ' + err + '. Aborting.\n');
					return callback(err, report);
				}
				else if (doc) {
					report.add('Source already exists in the DB (url and name match), not adding\n');
					source = doc;
					return callback("source exists",report);
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
		source = {};
	}


	// checks if the company of this report already exists in the DB, creates a new one otherwise and then checks for potential duplicates
	function loadCompany(report, callback) {


		function handleCompanyDuplicates(companiesList, companyName, company_id) {

			// use fuse for fuzzy search in nested search results

			// tokenize: check for single words AND the complete String
			// threshold: desired exactness of match
			var fuse = new fusejs(companiesList, { keys: ["company_name", "company_aliases"], tokenize: true, threshold: 0.4});

			// TODO: temporarily disabling Fuse as it chokes on a company name
			var searchResult = false;// fuse.search(companyName);

			if (!searchResult || searchResult == []) {
				report.add('Found no matching companies in DB for company ' + companyName + ' and thus, no potential duplicate\n');
				return callback(null, report);
			}
			else {

				// potential duplicates for company found
				report.add('Found '+ searchResult.length-1 + ' matching companies which are potential duplicates\n');

				notes = 'Found  '+ searchResult.length-1 + ' potentially matching company names for company ' + companyName + ' during Companies House API import. Date: ' + Date.now();

				var originalCompany;
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
				companies_house_id: chData.reportDetails.companyNumber
			},

			function(err, doc) {
				if (err) {
					report.add('Encountered an error (' + err + ') while querying the DB for companies. Aborting.\n');
					return callback(err,report);
				}
				else if (doc) {
					company = doc;
					report.add('company ' + chData.reportDetails.companyName + ' already exists in the DB (CH ID match), not adding.\n');
					return callback(null,report);
				}
				else {
					Company.findOne(
						{
							company_name : new RegExp(chData.reportDetails.companyName, "i")  // TODO: also check aliases?
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
								report.add('company ' + chData.reportDetails.companyName + ' already exists in the DB (name match), not adding.\n');
								return callback(null,report);
							}
							else {

								// company with this exact name is not found in the database. get a list with all companies and handle duplicates via fuzzy search
								// create a company first and then use it as potential duplicate if similar companies exist or otherwise, create and use it as the one and only company with this name.

								// create a new company
								var newCompany = makeNewCompany(chData);
								if (!newCompany) {
									report.add('Invalid data in data: ' + chData + '. Aborting.\n');
									return callback("Invalid data in data",report);
								}
								Company.create(
									newCompany.obj,
									function(err, cmodel) {
										if (err) {
											report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
											return callback(err,report);
										}
										report.add('Added company ' + chData.reportDetails.companyName + ' to the DB.\n');
										company = cmodel;

										// retrieve a list of all companies in the DB. it is used for checking the project names in the current report for potential duplicates / similar entries.
										// This could potentially be optimized by fuzzy search on the DB instead.
										Company.find({}, function (err, cresult) {

											if (err) {
												report.add('Got an error: ' + err + ' while finding all companies.\n');
												return callback(err,report);
											}
											else {

												// check for potential duplicates now - this function does the callback
												handleCompanyDuplicates(cresult, chData.reportDetails.companyName, company._id);
												//callback(null,report);

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

		var updateOrCreateProject = function (projDoc, projectName, callback) {
			var doc_id = null;
			var newProj = true;

			if (!projDoc) {
				report.add('Project ' + projectName + ' not found, creating.\n');
				projDoc = makeNewProject(projectName);
			}
			else {
				newProj = false;
				doc_id = projDoc._id;
				projDoc = projDoc.toObject();
				delete projDoc._id; // Don't send id back in to Mongo
				delete projDoc.__v; // https://github.com/Automattic/mongoose/issues/1933
			}

			if (projectName.indexOf(" ") > -1) {
				var spacePos = projectName.indexOf(" ");
				projDoc.proj_id = projectName.toLowerCase().replace("/","").slice(0, 2) + projectName.toLowerCase().slice(spacePos + 1, spacePos + 3) + '-' + randomstring(6).toLowerCase();
			}
			else {
                projDoc.proj_id = projectName.toLowerCase().replace("/","").slice(0, 4) + '-' + randomstring(6).toLowerCase();
			}

			if (!doc_id) doc_id = new ObjectId();
			Project.findByIdAndUpdate(
				doc_id,
				projDoc,
				{setDefaultsOnInsert: true, upsert: true, new: true},
				function(err, model) {
					if (err) {
						report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
						return callback(err);
					}

					report.add('Added or updated project ' + projectName + ' to the DB.\n');
					projects[projectName] = model;

					Project.find({}, function (err, cresult) {

						if (err) {
							report.add('Got an error: ' + err + ' while finding all projects.\n');
							return callback(err);
						}
						else if (!cresult || cresult.length === 0) {
							return callback(null, project_id, projectName, null, newProj);
						}
						else {

							return callback(null, model._id, projectName, cresult, newProj);
						}
					});


				}
			);
		};

		var createLink = function(project_id, projectName, projectsList, newProj, callback) {

			Link.findOne(
				{
					company: company._id,
					project: project_id,
					source: source._id
				},
				function(err, doc) {
					if (err) {
						report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
						return callback(err);
					}
					else if (doc) {
						report.add('Company is already linked with project ' + projectName + ', not adding\n');
						return callback(null, projectsList, projectName, project_id, newProj);
					}
					else {
						var newCompanyLink = {
							company: company._id,
							project: project_id,
							source: source._id,
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
								return callback(null, projectsList, projectName, project_id, newProj);
							}
						);
					}
				}
			);
		};

		var handleProjectDuplicates = function (projectsList, projectName, project_id, newProj, callback) {

			if (!projectsList || _.isEmpty(projectsList)) {
				report.add('Found no projects, thus no potential duplicates\n');
				return callback(null);
			}

			// TODO fuzzy search handling (fix match index problem)

			// use fuse for fuzzy search in nested search results
			// var fuse = new fusejs(projectsList, { keys: ["proj_name", "proj_aliases"], tokenize: true, threshold: 0.4 });

			// TEMP TODO match index problem
			// var searchResult = fuse.search(projectName);

//    if (!searchResult || _.isEmpty(searchResult)) {
//    report.add('Found no matching projects in DB for project ' + projectName + ' and thus, no potential duplicate\n');
//    return callback(null);
//    }

			searchResult = false;
			// END TEMP

			if (!searchResult || _.isEmpty(searchResult)) {
				report.add('Found no matching projects in DB for project ' + projectName + ' and thus, no potential duplicate\n');
				return callback(null);
			}
			else {

				// potential duplicates for project found
				report.add('Found '+ (searchResult.length-1) + ' matching projects which are potential duplicates\n');

				notes = 'Found  '+ (searchResult.length-1) + ' potentially matching project names for project ' + projectName + ' during Companies House API import. Date: ' + Date.now();

				async.each(searchResult,  function(originalProject, ecallback) {

					// recently created project is not a duplicate to itself
					// TODO: handle exact match if necessary
					if (originalProject.proj_name != projectName) {

						var newDuplicate = makeNewDuplicate(originalProject._id, project_id, action_id, "project", notes);

						Duplicate.create(
							newDuplicate,
							function(err, dmodel) {
								if (err) {
									report.add('Encountered an error while creating a duplicate: ' + err + '. Aborting.\n');
									return ecallback(err);
								}
								report.add('Created duplicate entry for project ' + projectName + ' in the DB.\n');

								ecallback(null);
							}
						);
					}
					if( err ) {
						return callback(err);
					} else {
						return callback(null);
					}
				});

			}

		};

		var counter = 0;
		async.eachSeries(chData.projectTotals.projectTotal, function (projectTotalEntry, forcallback) {
			// Projects - check against id and name
			Project.findOne(
				{
					proj_id: projectTotalEntry.projectCode		// TODO: only projects for project totals or also for single project payments?
				},
				function(err, projDoc) {
					if (err) {
						report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
						return forcallback(err);
					}
					else if (projDoc) {
						report.add('Project ' + projectTotalEntry.projectName + ' already exists in the DB (id or name match), not adding but updating project.\n');
						projects[projectTotalEntry.projectName] = projDoc;

						// TODO: Move into function
						// TODO: Cope with lack of country in totals?
						async.waterfall([
							// update the project if exists, otherwise create a new one
							async.apply(updateOrCreateProject, projects[projectTotalEntry.projectName], projectTotalEntry.projectName),
							// then create a new link between this project and the referring report company
							createLink,
							// search potential duplicates for this project
							handleProjectDuplicates,
						], function (err, result) {
							return forcallback(null);
						});
						//TODO End move into function
					}
					else {
						Project.findOne(
							{
								proj_name: projectTotalEntry.projectName
							},
							function(err, doc) {
								if (err) {
									report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
									return forcallback(err);
								}
								else if (doc) {
									report.add('Project ' + projectTotalEntry.projectName + ' already exists in the DB (id or name match), not adding but updating project.\n');

									if (!doc.proj_id) {
										report.add('Project ' + projectTotalEntry.projectName + ' has no project code in DB. Aborting.\n');
										return forcallback('Project ' + projectTotalEntry.projectName + ' has no project code in DB. Aborting.');
									}

									projectNamefromDB = doc.proj_name;
									projects[projectNamefromDB] = doc;
									// TODO: Move into function
									// TODO: Cope with lack of country in totals?
									async.waterfall([
										// update the project if exists, otherwise create a new one
										async.apply(updateOrCreateProject, projects[projectTotalEntry.projectName], projectTotalEntry.projectName),
										// then create a new link between this project and the referring report company
										createLink,
										// search potential duplicates for this project
										handleProjectDuplicates,
									], function (err, result) {
										return forcallback(null);
									});
									// TODO: End Move into function
								}
								else {
									// TODO: Move into function
									// TODO: Cope with lack of country in totals?
									async.waterfall([
										// update the project if exists, otherwise create a new one
										async.apply(updateOrCreateProject, projects[projectTotalEntry.projectName], projectTotalEntry.projectName),
										// then create a new link between this project and the referring report company
										createLink,
										// search potential duplicates for this project
										handleProjectDuplicates,
									], function (err, result) {
										return forcallback(null);
									});
									// TODO: End Move into function
								}
							}
						);
					}
				}
			);
		}, function (err) {
			if (err) {
				return callback(err, report);
			}
			return callback(null, report);
		});
	}



	// checks if the transfer entries of this report already exist in the DB, creates new ones otherwise.
	// This is done separately for government payments (transfer level "country") and project payments (transfer level "project")
	// So far, only single transfers are handled. Transfer totals are not yet calculated or validated
	function loadTransfers(report, callback) {

		// Handle transfers from government payments
		async.eachSeries(chData.governmentPayments.payment, function (governmentPaymentsEntry, fcallback) {

			var transfer_audit_type = "company_payment";
			var transfer_level = "country";

			// TODO: transfer_type = Total?
			var transfer_type = "Total";
			var transfer_gov_entity = governmentPaymentsEntry.government;

			// TODO: wrong result if point instead of comma for thousands separator
			var transfer_value = parseFloat(governmentPaymentsEntry.amount.replace(/,/g, ""));
			var transfer_note = governmentPaymentsEntry.notes;
			var country = governmentPaymentsEntry.countryCode;
			var country_id = null;

			if (country.length == 3) {
				country_id = countries[country]._id;
			}

			if (!country_id) { // If not 3 letters or if not found
				report.add('Invalid country code. Aborting.\n');
				return fallback(true);
			}

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
				return fcallback(null);
			}

			Transfer.findOne(
				query,
				function(err, doc) {
					if (err) {
						report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
						return fcallback(err);
					}
					else if (doc) {
						report.add('Transfer for government ' + transfer_gov_entity + ' already exists in the DB, not adding\n');
						return fcallback(null);
					}
					else {

						// create a new transfer entry in the DB if it does not exist yet
						var newTransfer = makeNewTransfer(governmentPaymentsEntry, transfer_audit_type, "country", year, country_id);
						if (!newTransfer) {
							report.add('Invalid or missing data for new transfer. Aborting.\n');
							return fcallback(null);
						}
						Transfer.create(
							newTransfer,
							function(err, model) {
								if (err) {
									report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
									return fcallback(err);
								}
								else {
									report.add('Added transfer for government ' + transfer_gov_entity + '\n');
									fcallback(null);
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
		async.eachSeries(chData.projectPayments.projectPayment, function (projectPaymentEntry, forcallback) {

			// If project code for this payment was not yet in the project totals list, then something's wrong in the data, skip.
			if (!projects[projectPaymentEntry.projectName]) {

				report.add('Invalid or missing project data. Aborting.\n');
				return forcallback(err);

			}


			// Add in country information for the project
			var update = {};

			// Update project ID
			var iso2country = countries[projectPaymentEntry.countryCodeList].iso2.toLowerCase();

			var projName = projectPaymentEntry.projectName;

			if (projName.indexOf(" ") > -1) {
				var spacePos = projName.indexOf(" ");
				update.proj_id = iso2country + '-' + projName.toLowerCase().slice(0, 2) + projName.toLowerCase().slice(spacePos + 1, spacePos + 3) + '-' + randomstring(6).toLowerCase();

			}
			else {
				update.proj_id = iso2country + '-' + projName.toLowerCase().slice(0, 4) + '-' + randomstring(6).toLowerCase();
			}

			// Enforce only one country per project...
			update.proj_country = [{country: countries[projectPaymentEntry.countryCodeList]._id, source: source._id}];
			// In theory this only adds the country if not already there
			Project.update({proj_name: projectPaymentEntry.projectName}, update, {}, function(err, numAffected) {
				if (err) console.log(err);
			});




			var transfer_audit_type = "company_payment";
			var transfer_type = projectPaymentEntry.paymentType;
			var transfer_level = "project";

			// TODO: wrong result if point instead of comma for-separator
			var transfer_value = parseFloat(projectPaymentEntry.amount.replace(/,/g, ""));

			var transfer_note = projectPaymentEntry.notes;
			var project = projects[projectPaymentEntry.projectName]._id;
			var country = countries[projectPaymentEntry.countryCodeList]._id;

			var query = {
				country: country,
				project: project,
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

			// TODO: transfer year = year of report date?
			// query.transfer_year = year;

			Transfer.findOne(
				query,
				function(err, doc) {
					if (err) {
						report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
						return forcallback(err);
					}
					else if (doc) {
						report.add('Transfer for project ' + projectPaymentEntry.projectName + ' already exists in the DB, not adding\n');
						return forcallback(null);
					}
					else {
						// create a new transfer entry in the DB if it does not exist yet
						var newTransfer = makeNewTransfer(projectPaymentEntry, transfer_audit_type, "project", year, country);
						if (!newTransfer) {

							report.add('Invalid or missing data for new transfer. Aborting.\n');
							return forcallback(err);
						}
						Transfer.create(
							newTransfer,
							function(err, model) {
								if (err) {
									report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
									return forcallback(err);
								}
								else {
									report.add('Added transfer for project ' + projectPaymentEntry.projectName + '\n');
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
		source_type_id: sourceTypeId,
		source_url: 'https://extractives.companieshouse.gov.uk',
		source_notes: 'Source for Companies House Extractive API Import',
		source_date: Date.now(),
		retrieve_date: Date.now()
		/* TODO create_author:, */
	};

	return source;
}


function makeNewCompany (newData) {
	var returnObj = {obj: null, link: null};
	var company = {
		company_name: newData.reportDetails.companyName
	};

	if (newData.reportDetails.companyNumber !== "") {
		company.open_corporates_id = "gb/" + newData.reportDetails.companyNumber;
	}

	company.country_of_incorporation = [{country: countries['GBR']._id}]; // Only have UK companies

	if (source) {
		company.company_established_source = source;
	}
	else return false; // error

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
		// resolved_by: user_id,
	};

	return duplicate;
}

function makeNewProject(projectName) {

	var project = {
		proj_name: projectName,
		proj_established_source: source._id,
	};

	return project;
}


function makeNewTransfer(paymentData, transfer_audit_type, transfer_level, year, country_id) {

	var transfer = {
		source: source._id,
		country: country_id,
		transfer_audit_type: transfer_audit_type,
		// TODO: transfer_year == report year?
		transfer_year: year,
		transfer_unit: currency,
		transfer_level: transfer_level,
		transfer_type: paymentData.paymentType,
		transfer_note: paymentData.notes,
		transfer_value: parseFloat(paymentData.amount.replace(/,/g, ""))
	};

	if (company) {
		transfer.company = company._id;
	}

	else return false; // error

	if (transfer_level == "project") {
		if (projects[paymentData.projectName]) {
			transfer.project = projects[paymentData.projectName]._id;
		}
		else return false; // error
	}

	if (transfer_level == "country") {

		if (paymentData.government !== "") {
			transfer.transfer_gov_entity = paymentData.government;
		}

	}

	return transfer;
}