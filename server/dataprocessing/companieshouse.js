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
ObjectId = require('mongoose').Types.ObjectId,
isocountries = require("i18n-iso-countries"),
_ = require("underscore"),
csv     = require('csv'),
async   = require('async'),
moment = require('moment'),
request = require('superagent'),
randomstring = require('just.randomstring');


//TODO: API Key
//API_KEY = process.env.CHAPIKEY

years = _.range(2000, 2016);

//country code is always GB
countryGBId = '31a7e6c02937581218e16dd8';

//source type is always 'UK Mandatory payment disclosure'
sourceTypeId = '56e8736944442a3824141429';


exports.importData = function(finalcallback) {	

	var reportString = "";

	var reporter = {
			text: reportString,
			add: function(more) {
				this.text += more;
			}
	}	 

	async.forEachOf(years, function (year, key, fcallback) {

		console.log("year: " + year);
		request			// for every year since 2000
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
					return finalcallback(null, reporter.text);	// continue loop
				}
				else {

					async.forEachOf(res.body, function (chReportData, key, icallback) {

						loadChReport(chReportData, year, reporter, icallback);

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
			reporter.add('Error in retrieved data from CH API\n');
			return finalcallback(err,reporter.text);
		}
		reporter.add('Successfully handeled all data from CH API\n');
		finalcallback(null,reporter.text);

	}		
	);

}


var source, company, projects;


function loadChReport(chData, year, report, loadcallback) {

	async.waterfall([
	                 loadSource.bind(null, report),
	                 loadCompany,
	                 loadProjects,
	                 loadTransfers,
	                 //links throughout!//
	                 ], function (err, report) {
		if (err) {
			console.log("LOAD DATA: Got an error\n");
			return loadcallback(err, report)
		}
		loadcallback(null, report);
	}
	);


	function loadSource(report, callback) {

		var version = chData.ReportDetails.version
		var company = chData.ReportDetails.companyName

		//TODO - may need some sort of sophisticated duplicate detection here
		Source.findOne(
				{source_url: 'https://extractives.companieshouse.gov.uk',
					source_name: 'Companies House Extractives Disclosure of ' + company + ' for ' + year + ', Version ' + version},
					null, //return everything
					function(err, doc) {
						if (err) {
							report.add('Encountered an error while querying the DB: ' + err + '. Aborting.\n');
							callback(err, report);
						}
						else if (doc) {
							report.add('Source already exists in the DB (url and name match), not adding\n');
							source = doc;
							callback(null,report);
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
										callback(null,report);
									})
							);
						}
					}
		);
		source = new Object;
	}


	function loadCompany(report, callback) {			

		// TODO: links

		Company.findOne(
				{$or: [
				       {companies_house_id: chData.ReportDetails.companyNumber},// TODO: is it enough when one of these two are found?                    
				       {company_name: chData.ReportDetails.companyName}				// erst nach ID suchen, wenn ID nicht gefunden wird, dann nach Name suchen. Dann deduplication flag
				       ]},
				       function(err, doc) {
				    	   if (err) {
				    		   report.add('Encountered an error (' + err + ') while querying the DB for companies. Aborting.\n');
				    		   callback(err,report);
				    	   }
				    	   else if (doc) {
				    		   company = doc;
				    		   report.add('company ' + chData.ReportDetails.companyName + ' already exists in the DB (name or alias match), not adding.\n');
				    		   callback(null,report);
				    	   }
				    	   else {
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
				    					   
				    					   callback(null,report);
				    				   }
				    		   );
				    	   }
				       }
		);
	}



	function loadProjects(report, callback) {
		
		projects = {}

		function updateOrCreateProject(projDoc, projName, projId, countryCode) {
			var doc_id = null;

			if (!projDoc) {
				projDoc = makeNewProject(projName, projId, countryCode);
			}
			else {
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
							return ucallback(err);
						}
						report.add('Added or updated project ' + projName + ' to the DB.\n');
						projects[projId] = model;
						
						createLink(company._id,model._id,source._id, projName);
						
					}
			);
		}
		
        var createLink = function(company_id, project_id, source_id, projName) {
        	        
            Link.findOne(
                    {
                        company: company_id,
                        project: project_id,
                        source: source_id
                    },
                    function(err, doc) {  
                        if (err) {
                            report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
                            callback(err, report);
                        }
                        else if (doc) {
                            report.add('Company is already linked with project ' + projName + ', not adding\n');
                            callback(null, report);
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
                                    callback(null, report);
                                }
                            );
                        }
                    }
                );
        }			

		async.forEachOf(chData.projectTotals, function (projectTotalEntry, key, forcallback) {

			//Projects - check against id and name
			//TODO - may need some sort of sophisticated duplicate detection here
			
			// TODO: country code list for countries?
			
			Project.findOne(
					{
						proj_id: projectTotalEntry.projectTotal.projectCode		// TODO: only projects for project totals or also for single project payments?
					},
					       function(err, doc) {
					    	   if (err) {
					    		   report.add('Encountered an error (' + err + ') while querying the DB. Aborting.\n');
					    		   forcallback(err);
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
										    		   forcallback(err);
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




	function loadTransfers(report, callback) {
				
		async.forEachOf(chData.governmentPayments, function (governmentPaymentsEntry, key, forcallback) {
						
			var transfer_audit_type = "company_payment";
			var transfer_level = "country";

			// TODO: transfer_type?
			var transfer_type = "Total";
			var transfer_gov_entity = governmentPaymentsEntry.governmentPayments.government;				
			
			// TODO: take care of point instead of comma for thousands-seprarator
			var transfer_value = parseFloat(governmentPaymentsEntry.governmentPayments.amount.replace(/,/g, ""));
			var transfer_note = governmentPaymentsEntry.governmentPayments.notes;			
			var country = governmentPaymentsEntry.governmentPayments.countryCode;			
			var country_iso2 = null;
			
			if (country.length == 2) {
				country_iso2 = country.toUpperCase();
			}
			else {
				if (country.length == 3) {
					
					// convert iso3 to iso2
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
			
			var query = {country: country_id, transfer_gov_entity: transfer_gov_entity, transfer_audit_type: transfer_audit_type, transfer_level: transfer_level, transfer_type: transfer_type, transfer_value: transfer_value, transfer_note: transfer_note, source: source._id};
			
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
				callback(err,report);
			}
			callback(null, report);

		});
			
		async.forEachOf(chData.projectPayments, function (projectPaymentEntry, key, forcallback) {

			//If project code for this payment was not yet in the project totals list, then something's wrong in the data, skip.

			if (!projects[projectPaymentEntry.projectPayment.projectCode]) {
				report.add('Invalid or missing project data. Aborting.\n');
				return forcallback(null);
			}
			
			var transfer_audit_type = "company_payment";
			var transfer_type = projectPaymentEntry.projectPayment.paymentType;			
			var transfer_level = "project";			
			
			// TODO: take care of point instead of comma for thousands-seprarator
			var transfer_value = parseFloat(projectPaymentEntry.projectPayment.amount.replace(/,/g, ""));

			var transfer_note = projectPaymentEntry.projectPayment.notes;
			var project = projects[projectPaymentEntry.projectPayment.projectCode]._id;
			var query = {country: countryGBId, project: project, transfer_audit_type: transfer_audit_type, transfer_level: transfer_level, transfer_type: transfer_type, transfer_value: transfer_value, transfer_note: transfer_note, source: source._id};

			if (company) {
				query.company = company._id
			}
			else {
				report.add('Company data could not be retrieved. Aborting.\n');
				return forcallback(null);
			}

			// Notice: assumption here is: transfer year = year of report date
			query.transfer_year = year;

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
				callback(err,report);
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


var makeNewCompany = function(newData) {
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

var makeNewProject = function(projectName,projectCode, countryCode) {	

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
