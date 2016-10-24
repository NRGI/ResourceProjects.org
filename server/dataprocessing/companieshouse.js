var Source 			= require('mongoose').model('Source'),
	Country 		= require('mongoose').model('Country'),
	Company 		= require('mongoose').model('Company'),
	Project 		= require('mongoose').model('Project'),
	Link 			= require('mongoose').model('Link'),
	Transfer 		= require('mongoose').model('Transfer'),
	ObjectId 		= require('mongoose').Types.ObjectId,
	isocountries 	= require("i18n-iso-countries"),
	_ 				= require("underscore"),
	async  			= require('async'),
	request 		= require('superagent'),
	randomstring	= require('just.randomstring');

API_KEY = process.env.CHAPIKEY;

//define desired report years here
years = _.range(2014, 2016);

var createdOrAffectedEntities = {};

//source type is always 'UK Mandatory payment disclosure'
var sourceTypeId = '56e8736944442a3824141429';

//Data needed for inter-entity reference
var countries;

function generate_source_url(companyNumber, referenceNumber) {
	if (companyNumber) return "https://extractives.companieshouse.gov.uk/company/" + companyNumber;
	else return "https://extractives.companieshouse.gov.uk/company/" + referenceNumber.substr(0, 8);
}

function makeProjId (countryIso, name) {
	var pid = countryIso.toLowerCase() + name.toLowerCase().replace(" ","").replace("/","").slice(0, 4) + '-' + randomstring(6).toLowerCase();
	//console.log(pid + ": " + countryIso);
	return pid;
}

exports.importData = function(finalcallback) {

	var reportString = "";

	var reporter = {
		text: reportString,
		add: function(more) {
			this.text += more;
		}
	};

	if (!API_KEY || (API_KEY === '')) {
		reporter.add("API key must be set as environment variable CHAPIKEY! Aborting.");
		return finalcallback("Failed", reporter.text, createdOrAffectedEntities);
	}

	// loop all years in the given range and call the Companies House Extractives API for each of these years
	var processYears = function() {
		async.eachSeries(years, function (year, fcallback) {
				reporter.add('Processing year ' + year + '\n');

				// Call Companies House Extractives API

				request
					.get('https://extractives.companieshouse.gov.uk/api/year/'+year.toString()+'/json')
					// testing with local duplicates
					//.get('http://localhost:3030/api/duplicatestestdata')

					.auth(API_KEY, '')
					.end(function(err,res) {

						if (err || !res.ok) {
							reporter.add('error in retrieving data from Companies House: ' + err);
							return finalcallback("Failed", reporter.text, createdOrAffectedEntities);	// continue loop
						}
						else {

							if (!res.body || res.body == {}) {
								// no data
								return finalcallback("Failed", reporter.text, createdOrAffectedEntities);
							}
							else {

								// get all reports for this year and handle them one after another
								console.log(res.body);
								async.eachSeries(res.body, function (chReportData, icallback) {
										//Set currency for this report
										loadChReport(chReportData, year, reporter, icallback);
									},

									function (err) {

										if (err) {
											reporter.add('Error in one retrieved report for year ' + year + '\n');
											return fcallback(err);
										}
										reporter.add('Successfully handled report data for year ' + year + '\n');
										async.nextTick(function(){ fcallback(null); });

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
				finalcallback("Success", reporter.text, createdOrAffectedEntities);

			}
		);
	};

	// Get all countries from the DB
	reporter.add("Getting countries from database...\n");
	countries = {};
	countries_iso2 = {};
	Country.find({}, function (err, cresult) {
		if (err) {
			reporter.add(`Got an error: ${err}\n`);
			return finalcallback("Failed", reporter.text, createdOrAffectedEntities);
		}
		else {
			reporter.add(`Found ${cresult.length} countries\n`);
			var ctry;
			for (ctry of cresult) {
				country_iso3 = isocountries.alpha2ToAlpha3(ctry.iso2).toUpperCase();
				countries[country_iso3] = ctry;
				countries_iso2[ctry.iso2.toUpperCase()] = ctry;
			}
			processYears();
		}
	});
};

//load report data sequentially from Extractives reports
function loadChReport(chData, year, report, loadcallback) {
	async.waterfall([
			loadSource.bind(null, report),
			loadCompany,
			loadProjects,
			loadTransfers,
		], function (err, report) {
			if (err) {
				if (err === "source exists") {
					report.add("Done. Not importing data for existing source.\n");
					return async.nextTick(function(){ loadcallback(null, report); });
				}
				else {
					report.add("LOAD DATA: Got an error\n");
					return async.nextTick(function(){ loadcallback(err, report); });
				}
			}
			return async.nextTick(function(){ loadcallback(null, report); });
		}
	);


	// checks if a source for this combination of year, report version and company already exists, creates a new one otherwise
	function loadSource(report, callback) {

		var version = chData.reportDetails.version;
		var source_company = chData.reportDetails.companyName;
		var currency = chData.reportDetails.currency;
        Source.findOne(
			{
				source_url: generate_source_url(chData.reportDetails.companyNumber, chData.reportDetails.referenceNumber),
                // Source name identifies the new source and is used for this combination of year, report version and company
				source_name: 'Companies House Extractives Disclosure of ' + source_company + ' for ' + year + ', Version ' + version},
			null, // return everything
			function(err, doc) {
				if (err) {
					report.add('Encountered an error while querying the DB: ' + err + '. Aborting.\n');
					return callback(err, report, null, null);
				}
				else if (doc) {
					report.add('Source already exists in the DB (url and name match), not adding\n');
					source = doc;
					//Note that we DON'T add to created/affected as the data from this source will be ignored
					return callback("source exists",report, source, currency);
				}
				else {

					report.add('Source not found in the DB, creating\n');
					var newSource = makeNewSource(source_company, year, version);
					Source.create(
						newSource,
						(function(err, model) {
							if (err) {
								report.add('Encountered an error while creating a source in the DB: ' + err + '. Aborting.\n');
								return callback(err, report, null, null);
							}
							createdOrAffectedEntities[model._id] = {entity: "source", obj: model._id};
							source = model;
							return async.nextTick(function(){ callback(null,report, source, currency); });
						})
					);
				}
			});
	}


	// checks if the company of this report already exists in the DB, creates a new one otherwise
	function loadCompany(report, source, currency, callback) {

	    Company.findOne(
			{
				 open_corporates_id: "gb/" + chData.reportDetails.companyNumber
			},

			function(err, doc) {
				if (err) {
					report.add('Encountered an error (' + err + ') while querying the DB for companies. Aborting.\n');
					return callback(err,report, null);
				}
				else if (doc) {
					company = doc;
					//projects[company._id] = {}
					report.add('company ' + chData.reportDetails.companyName + ' already exists in the DB (CH ID match), not adding.\n');
					return async.nextTick(function(){ callback(null, report, source, company, currency); });
				}
				else {
					Company.findOne(
						{
							company_name : new RegExp(chData.reportDetails.companyName, "i")  // TODO: also check aliases?
						},
						function(err, doc) {
							if (err) {
								report.add('Encountered an error (' + err + ') while querying the DB for companies. Aborting.\n');
								return callback(err,report, null, null);
							}
							else if (doc) {
								// company with this exact name is found. use this and create no duplicate.
								company = doc;
								createdOrAffectedEntities[doc._id] = {entity: "company", obj: doc._id};
								//Update OC id if not present
								if (!doc.open_corporates_id) {
									Company.findByIdAndUpdate(doc._id, {open_corporates_id: "gb/" + chData.reportDetails.companyNumber}, {}, function (err) {
										if (err) {
											report.add('Encountered an error (' + err + ') while updating the DB. Aborting.\n');
											return async.nextTick(function(){ callback(err,report, null, null); });
										}
										else {
											report.add('company ' + chData.reportDetails.companyName + ' already exists in the DB (name match), not adding.\n');
											return async.nextTick(function(){ callback(null, report, source, company, currency); });
										}
									});
							    }
                                else {
									report.add('company ' + chData.reportDetails.companyName + ' already exists in the DB (name match), not adding.\n');
									return async.nextTick(function(){ callback(null, report, source, company, currency); });
								}
								// TODO: add aliases in comment if aliases are considered
							}
							else {

								// company with this exact name is not found in the database. get a list with all companies and handle duplicates via fuzzy search
								// create a company first and then use it as potential duplicate if similar companies exist or otherwise, create and use it as the one and only company with this name.

								// create a new company
								var newCompany = makeNewCompany(chData);
								if (!newCompany) {
									report.add('Invalid data in data: ' + chData + '. Aborting.\n');
									return callback("Invalid data in data",report, company, currency);
								}
								Company.create(
									newCompany.obj,
									function(err, cmodel) {
										if (err) {
											report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
											return callback(err,report, null, null, null);
										}
										report.add('Added company ' + chData.reportDetails.companyName + ' to the DB.\n');
										createdOrAffectedEntities[cmodel._id] = {entity: "company", obj: cmodel._id};
										company = cmodel;
                                        async.nextTick(function(){ callback(null, report, source, company, currency); });
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
	function loadProjects(report, source, company, currency, callback) {

	  var projects = {};

		var updateOrCreateProject = function (projDoc, projectName, ucallback) {
			var doc_id = null;
			var newProj = true;

			if (!projDoc) {
				report.add('Project ' + projectName + ' not found, creating.\n');
				projDoc = makeNewProject(projectName, source);
				//TODO: Can't create ID without country...
				//projDoc.proj_id = makeProjId( countryIso, projectName );
			}
			else {
				newProj = false;
				doc_id = projDoc._id;
				projDoc = projDoc.toObject();
				delete projDoc._id; // Don't send id back in to Mongo
				delete projDoc.__v; // https://github.com/Automattic/mongoose/issues/1933
			}

            // projDoc.proj_id = projectName.toLowerCase().replace("/","").replace(" ","").slice(0, 2) + projectName.toLowerCase().slice(spacePos + 1, spacePos + 3) + '-' + randomstring(6).toLowerCase();
            
			// if (projectName.indexOf(" ") > -1) {
			// 	var spacePos = projectName.indexOf(" ");
			// 	projDoc.proj_id = projectName.toLowerCase().replace("/","").slice(0, 2) + projectName.toLowerCase().slice(spacePos + 1, spacePos + 3) + '-' + randomstring(6).toLowerCase();
			// }
			// else {
             //    projDoc.proj_id = projectName.toLowerCase().replace("/","").slice(0, 4) + '-' + randomstring(6).toLowerCase();
			// }

			if (!doc_id) doc_id = new ObjectId();
			Project.findByIdAndUpdate(
				doc_id,
				projDoc,
				{setDefaultsOnInsert: true, upsert: true, new: true},
				function(err, model) {
					if (err) {
						report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
						return ucallback(err);
					}

					createdOrAffectedEntities[model._id] = {entity: "project", obj: model._id};
					report.add('Added or updated project ' + projectName + ' to the DB.\n');
					projects[projectName] = model;

					Project.find({}, function (err, cresult) {

							if (err) {
									report.add('Got an error: ' + err + ' while finding all projects.\n');
									return ucallback(err);
							}
							else if (!cresult || cresult.length === 0) {
									return async.nextTick(function(){ ucallback(null, project_id, projectName, null, newProj); });
							}
							else {
									return async.nextTick(function(){ ucallback(null, model._id, projectName, cresult, newProj); });
							}
					});

				}
			);
		};

		var createLink = function(project_id, projectName, projectsList, newProj, lcallback) {

			Link.findOne(
				{
					company: company._id,
					project: project_id,
					source: source._id
				},
				function(err, doc) {
					if (err) {
						report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
						return lcallback(err);
					}
					else if (doc) {
						createdOrAffectedEntities[doc._id] = {entity: "link", obj: doc._id};
						report.add('Company is already linked with project ' + projectName + ', not adding\n');
						return async.nextTick(function(){ lcallback(null, projectsList, projectName, project_id, newProj); });
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
							function(err, lmodel) {
								if (err) {
									report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
									return lcallback(err);
								}
								createdOrAffectedEntities[lmodel._id] = {entity: "link", obj: lmodel._id};
								report.add('Linked company with project in the DB.\n');
								return async.nextTick(function(){ lcallback(null, projectsList, projectName, project_id, newProj); });
							}
						);
					}
				}
			);
		};

		async.eachSeries(chData.projectTotals.projectTotal, function (projectTotalEntry, forcallback) {
			//TODO: Remove, transfers are better and this doesn't always work
			var countryId = null; //Allow setting of fact "CH API doesn't state a country". Makes searching a bit easier.
			var ckey;
			if (isNaN(projectTotalEntry.projectCode[2])) { //Sometimes 2 letter code is used, sometimes 3, sometimes none
				ckey = projectTotalEntry.projectCode.slice(0,3).toUpperCase();
				if (countries[ckey]) {
					countryId = countries[ckey]._id;
					report.add("Project uses a 3 letter ISO code\n"); }
				else {
					report.add("Project does not contain a country code\n");
				}
			}
			else {
				ckey = projectTotalEntry.projectCode.slice(0,2).toUpperCase().replace("UK", "GB");
				if (countries_iso2[ckey]) {
					countryId = countries_iso2[ckey]._id;
					report.add("2letter");
				}
			    else {
					report.add("missingcountry");
				}
			
			}
			
			//TODO: Add the actual API project code to the model and check against this instead: sure bet
			
			// Projects - check against <strike>id and </strike>name+country
			//we don't know the proj_id out of the API	
			/*Project.findOne(
				{
					proj_id: //we don't know the proj_id out of the API		// TODO: only projects for project totals or also for single project transfers?
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
							async.apply(updateOrCreateProject, projects[projectTotalEntry.projectName], projectTotalEntry.projectName, countryId),
							// then create a new link between this project and the referring report company
							createLink,
							// search potential duplicates for this project
							handleProjectDuplicates,
						], function () {
							return forcallback(null);
						});
						//TODO End move into function
					}
					else {
				*/
			            if (countryId !== null) {
							Project.findOne( //match case-insensitive
								{
									$or:
										[
											{
												"proj_name":  { $regex : new RegExp(projectTotalEntry.projectName, "i") }
											},
											{
												"proj_aliases.alias": { $regex : new RegExp(projectTotalEntry.projectName, "i") }
											}
										],
									"proj_country.country": countryId
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
										async.waterfall([
											// update the project if exists, otherwise create a new one
											async.apply(updateOrCreateProject, projects[projectTotalEntry.projectName], projectTotalEntry.projectName),
											// then create a new link between this project and the referring report company
											createLink,
											// search potential duplicates for this project
											//handleProjectDuplicates,
										], function () {
											return async.nextTick(function(){ forcallback(null); });
										});
										// TODO: End Move into function
									}
									else {
										// TODO: Move into function
										async.waterfall([
											// update the project if exists, otherwise create a new one
											async.apply(updateOrCreateProject, projects[projectTotalEntry.projectName], projectTotalEntry.projectName),
											// then create a new link between this project and the referring report company
											createLink,
											// search potential duplicates for this project
											//handleProjectDuplicates,
										], function () {
											return async.nextTick(function(){ forcallback(null); });
										});
										// TODO: End Move into function
									}
								}
							);
						}
						else { //No country info so just create duplicate, will be picked up later
							// TODO: Move into function
							async.waterfall([
								// update the project if exists, otherwise create a new one
								async.apply(updateOrCreateProject, projects[projectTotalEntry.projectName], projectTotalEntry.projectName),
								// then create a new link between this project and the referring report company
								createLink,
								// search potential duplicates for this project
								//handleProjectDuplicates,
							], function () {
								return async.nextTick(function(){ forcallback(null); });
							});
						}
					//}
				//}
			//);
		}, function (err) {
			if (err) {
				return callback(err, report, projects, company, currency);
			}
			return async.nextTick(function(){ callback(null, report, projects, company, currency); });
		});
	}



	// checks if the transfer entries of this report already exist in the DB, creates new ones otherwise.
	// This is done separately for government transfers (transfer level "country") and project transfers (transfer level "project")
	// So far, only single transfers are handled. Transfer totals are not yet calculated or validated
	function loadTransfers(report, projects, company, currency, callback) {

		// Handle transfers from government transfers
		async.eachSeries(chData.governmentPayments.payment, function (governmentPaymentsEntry, fcallback) {

			var transfer_gov_entity = governmentPaymentsEntry.government;

			var country = governmentPaymentsEntry.countryCode;
			var country_id = null;
			
			var transfer_audit_type = "company_payment";

			if (country.length == 3) {
				country_id = countries[country]._id;
			}

			if (!country_id) { // If not 3 letters or if not found
				report.add('Invalid country code. Aborting.\n');
				return fallback(true);
			}
			
			var newTransfer = makeNewTransfer(governmentPaymentsEntry, projects, company, currency, transfer_audit_type, "country", year, country_id);
			if (!newTransfer) {
				report.add('Invalid or missing data for new transfer. Aborting.\n');
				return async.nextTick(function(){ fcallback(null); });
			}

			Transfer.create(
				newTransfer,
				function(err, tmodel) {
					if (err) {
						report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
						return fcallback(err);
					}
					else {
						createdOrAffectedEntities[tmodel._id] = {entity: "transfer", obj: tmodel._id};
						report.add('Added transfer for government ' + transfer_gov_entity + '\n');
						return async.nextTick(function(){ fcallback(null); });
					}
				}
			);



		},   function (err) {
			if (err) {
				return callback(err,report);
			}
			return async.nextTick(function(){ callback(null, report); });

		});

		// Handle transfers from project transfers
		async.eachSeries(chData.projectPayments.projectPayment, function (projectPaymentEntry, forcallback) {

			// If project code for this payment was not yet in the project totals list, then something's wrong in the data, skip.
			if (!projects[projectPaymentEntry.projectName]) {

				report.add('Invalid or missing project data. Aborting.\n');
				return forcallback(null);

			}
			
			// Update project countries and set ID if not set
			// We assume that every project in the API has transfers. Otherwise it wouldn't make much sense.
			var countryIso = countries[projectPaymentEntry.countryCodeList].iso2;
			// Only adds the country if not already there
			var update = {$addToSet: {proj_country: {country: countries[projectPaymentEntry.countryCodeList]._id, source: source._id}}};
			if (!projects[projectPaymentEntry.projectName].proj_id) {
				//console.log("Project ID not set, setting...");
				update.proj_id = makeProjId( countryIso, projectPaymentEntry.projectName );
			}
			//else console.log("Project ID already set, not setting...");

 			Project.findByIdAndUpdate(projects[projectPaymentEntry.projectName]._id, update, {'new': true}, function(err, uproject) {
 				if (err) {
					console.log(err);
					report.add('Could not update project. Aborting.\n');
					return forcallback(err);
				}
				else {
					projects[projectPaymentEntry.projectName] = uproject;
				}
 			});
 
			var transfer_audit_type = "company_payment";

			var country = countries[projectPaymentEntry.countryCodeList]._id;

			// TODO: transfer year = year of report date?
			// query.transfer_year = year;

			var newTransfer = makeNewTransfer(projectPaymentEntry, projects, company, currency, transfer_audit_type, "project", year, country);
			if (!newTransfer) {

				report.add('Invalid or missing data for new transfer. Aborting.\n');
				return forcallback(err);
			}
			Transfer.create(
				newTransfer,
				function(err, tmodel) {
					if (err) {
						report.add('Encountered an error while updating the DB: ' + err + '. Aborting.\n');
						return forcallback(err);
					}
					else {
						createdOrAffectedEntities[tmodel._id] = {entity: "transfer", obj: tmodel._id};
						report.add('Added transfer for project ' + projectPaymentEntry.projectName + '\n');
						async.nextTick(function(){ forcallback(null); });
					}
				}
			);
		},   function (err) {
			if (err) {
				return callback(err,report);
			}
			async.nextTick(function(){ callback(null, report); });

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
	else console.log("WARNING! No company number for " + newData.reportDetails.companyName);

	company.country_of_incorporation = [{country: countries['GBR']._id}]; // Only have UK companies

	if (source) {
		company.company_established_source = source;
	}
	else return false; // error

	returnObj.obj = company;
	return returnObj;
}

function makeNewProject(projectName, source) {
	var project = {
		proj_name: projectName,
		proj_established_source: source._id
	};

	return project;
}


function makeNewTransfer(paymentData, projects, company, currency, transfer_audit_type, transfer_level, year, country_id) {

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
