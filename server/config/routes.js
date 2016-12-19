
var auth 				= require('./auth'),
    search 				= require('../controllers/search'),
	users 				= require('../controllers/users'),
	datasets  			= require('../controllers/datasets'),
	commodities 		= require('../controllers/commodities'),
	concessions 		= require('../controllers/concessions'),
	companies 			= require('../controllers/companies'),
	projects 			= require('../controllers/projects'),
	transfers 			= require('../controllers/transfers'),
	contracts 			= require('../controllers/contracts'),
	companyGroups 		= require('../controllers/companyGroups'),
	countries 			= require('../controllers/countries'),
	sources 			= require('../controllers/sources'),
	sites 				= require('../controllers/sites'),
	project_tables 		= require('../controllers/project_tables'),
	concession_tables 	= require('../controllers/concession_tables'),
	contract_tables 	= require('../controllers/contract_tables'),
	source_tables 		= require('../controllers/source_tables'),
	production_tables 	= require('../controllers/production_tables'),
	transfer_tables 	= require('../controllers/transfer_tables'),
	site_tables 		= require('../controllers/site_tables'),
	company_tables 		= require('../controllers/company_tables'),
	map 				= require('../controllers/map'),
	sourceTypes 		= require('../controllers/sourceTypes'),
	sunburst 			= require('../controllers/sunburst'),
	content 			= require('../controllers/content'),
	main_map 			= require('../controllers/main_map'),
	pie_chart 			= require('../controllers/pieChart'),
	destroy 			= require('../controllers/delete_data'),
	treemap 			= require('../controllers/treemap'),
	cors 				= require('cors'),
 	duplicates = require('../controllers/duplicates');


//For now not used
//summaryStats 		= require('../controllers/summaryStats'),
//lastAdded 			= require('../controllers/lastAdded'),


module.exports	= function(app) {
	app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	});
	app.get('/api/search', search.searchText);

	//CONTRACTS
	app.get('/api/contracts/:limit/:skip', contracts.getContracts);
	app.get('/api/contracts/:id', contracts.getContractByID);


	/////////////////////////
	/// CONCESSIONS CRUD ///
	////////////////////////
	app.get('/api/concessions/:limit/:skip', concessions.getConcessions);
	app.get('/api/concessions/:id', concessions.getConcessionByID);
	app.get('/api/concession/data/:id', concessions.getConcessionData);

	/////////////////////
	/// PROJECTS CRUD ///
	/////////////////////
	app.get('/api/projects/:limit/:skip', projects.getProjects);
	app.get('/api/project/data/:id', projects.getProjectData);
	app.get('/api/all_projects/:limit/:skip', projects.getAllProjects);
	app.get('/api/projects/:id', projects.getProjectByID);

	/////////////////////////////
	///// TRANSFERS CRUD ////////
	/////////////////////////////
	app.get('/api/transfer_filters/:country', transfers.getTransferFilters);
	app.get('/api/transfers/:limit/:skip', transfers.getTransfers);
	app.get('/api/transfersGov/:limit/:skip', transfers.getTransfersByGov);

	//////////////////////
	/// COMPANIES CRUD ///
	//////////////////////
	app.get('/api/companies/:limit/:skip', companies.getCompanies);
	app.get('/api/companies/:id', companies.getCompanyID);
	app.get('/api/companydata/:id', companies.getCompanyByID);


	//////////////////////////
	/// COMPANYGROUPS CRUD ///
	//////////////////////////

	//For now not used
	//app.get('/api/companyGroups/:limit/:skip', companyGroups.getCompanyGroups);

	app.get('/api/companyGroups/:id', companyGroups.getCompanyGroupID);
	app.get('/api/companyGroupData/:id', companyGroups.getCompanyGroupByID);

	///////////////////
	/// COMMODITIES ///
	///////////////////
	app.get('/api/commodities/:limit/:skip', commodities.getCommodities);
	app.get('/api/commodities/:id', commodities.getCommodityByID)

	//////////////////////
	/// COUNTRIES CRUD ///
	//////////////////////
	app.get('/api/countries/:limit/:skip', countries.getCountries);
	app.get('/api/countries/:id', countries.getCountryByID);
	app.get('/api/countrycommodity/:id', countries.getAllDAtaCountryByID);

	////////////////////
	/// SOURCES CRUD ///
	////////////////////
	app.get('/api/sources/:limit/:skip', sources.getSources);
	app.get('/api/sources/:id', sources.getSourceByID);

	/////////////////////////
	/// SOURCE TYPES CRUD ///
	/////////////////////////
	app.get('/api/sourcetypes/:limit/:skip', sourceTypes.getSourceTypes);
	app.get('/api/sourcetypes/:id', sourceTypes.getSourceTypeByID);

	// POST
	app.post('/api/sourcetypes', auth.requiresApiLogin, auth.requiresRole('admin'),  sourceTypes.createSourceType);
	// PUT
	app.put('/api/sourcetypes', auth.requiresApiLogin, auth.requiresRole('admin'), sourceTypes.updateSourceType);
	// DELETE
	app.delete('/api/sourcetypes/:id', auth.requiresApiLogin, auth.requiresRole('admin'), sourceTypes.deleteSourceType);


	//////////////////
	/// SITES CRUD ///
	//////////////////
	app.get('/api/sites/:limit/:skip/:field', sites.getSites);
	app.get('/api/sites/:id', sites.getSiteByID);
	app.get('/api/sites/data/:id', sites.getSiteData);
	app.get('/api/sites/map/:field', sites.getSitesMap);

	//DATASETS - TODO: protect with admin?
	app.get('/api/datasets', datasets.getDatasets);
	app.get('/api/datasets/:limit/:skip', datasets.getDatasets);
	app.get('/api/datasets/:id', datasets.getDatasetByID);

	//Reporting
	app.get('/admin/etl/datasets/:dataset_id/actions/:action_id/report',
		datasets.getActionReport,
		function(req, res) {
		    res.render('actionreport', {report: req.report});
	});

	//Create a dataset - todo protect with admin
	app.post('/api/datasets', auth.requiresApiLogin, auth.requiresRole('admin'), datasets.createDataset);
	//Create a dataset
	app.post('/api/datasets', auth.requiresApiLogin, auth.requiresRole('admin'), datasets.createDataset);
	//Start an ETL step
	app.post('/api/datasets/:id/actions', auth.requiresApiLogin, auth.requiresRole('admin'), datasets.createAction);


	//////////////////////////////////////
	/// COMPANIES HOUSE DUMMY DATASETS ///
	//////////////////////////////////////

  app.get('/api/testdata', datasets.getTestdata);
  app.get('/api/duplicatestestdata', datasets.getDuplicatesTestData);

  //////////////////////////////////////
	/// DUPLICATES ///
	//////////////////////////////////////

  app.get('/api/identifyduplicates/:action_id', datasets.identifyDuplicates);
  app.get('/api/duplicates/:type/:limit/:skip/', duplicates.getDuplicates);
  app.get('/api/duplicates/:id/:action', /*auth.requiresRole('admin'),*/ duplicates.resolveDuplicates);
  app.get('/api/resolve/:type', /*auth.requiresRole('admin'),*/ duplicates.resolveAllDuplicates);
  //app.get('/api/duplicates', duplicates.getCompanyDuplicates);
  //app.get('/api/duplicates/:date', duplicates.getDuplicatesCreatedAfterDate);

  // just for testing
  app.get('/api/test/:old/:new', duplicates.test);

	//////////////////
	/// USERS CRUD ///
	//////////////////
	app.get('/api/users', auth.requiresRole('admin'), users.getUsers);
	app.get('/api/users/:id', auth.requiresRole('admin'), users.getUsersByID);

	// POST
	app.post('/api/users', auth.requiresApiLogin, auth.requiresRole('admin'), users.createUser);

	// PUT
	app.put('/api/users', auth.requiresRole('admin'), users.updateUser);

	// DELETE
	app.delete('/api/users/:id', auth.requiresRole('admin'), users.deleteUser);
	/////////////
	/// OTHER ///
	/////////////
	app.get('/partials/*', function(req, res) {
		res.render('../../public/app/' + req.params[0]);
	});


	//TABLE
	app.get('/api/company_table/:type/:id/:limit/:skip', company_tables.getCompanyTable);
	app.get('/api/project_table/:type/:id/:limit/:skip', project_tables.getProjectTable);
	app.get('/api/prod_table/:type/:id/:limit/:skip', production_tables.getProductionTable);
	app.get('/api/transfer_table/:type/:id/:limit/:skip', transfer_tables.getTransferTable);
	app.get('/api/source_table/:type/:id', source_tables.getSourceTable);
	app.get('/api/site_table/:type/:id/:limit/:skip', site_tables.getSiteFieldTable);
	app.get('/api/contract_table/:type/:id', contract_tables.getContractTable);
	app.get('/api/concession_table/:type/:id/:limit/:skip', concession_tables.getConcessionTable);

	app.get('/api/coordinate/:type/:id', map.getCoordinateCountryByID);

	//For now not used
	//app.get('/api/summary_stats', summaryStats.getSummaryStats);
	//app.get('/api/sum_of_payments', summaryStats.getSumOfPayments);
	//app.get('/api/last_added', lastAdded.getLastAdded);

	//Payments
	app.get('/api/transfers', sunburst.getPayments);
	app.get('/api/transfers_by_gov', sunburst.getPaymentsByGov);

	//Treemap
	app.get('/api/treemap', treemap.getPayments);


	//Payments pie chart
	app.get('/api/pie_chart', pie_chart.getPayments);


	//ABOUT PAGE CONTENT
	app.get('/api/about', content.getAboutPage);
	app.put('/api/about', auth.requiresApiLogin, auth.requiresRole('admin'), content.updateAboutPage);

	//GLOSSARY PAGE CONTENT
	app.get('/api/glossary', content.getGlossaryPage);
	app.put('/api/glossary', auth.requiresApiLogin, auth.requiresRole('admin'), content.getGlossaryPage);

	//GLOSSARY PAGE CONTENT
	app.get('/api/landing', content.getLandingPage);
	app.get('/api/main_map', main_map.getMainMap);
	app.put('/api/landing', auth.requiresApiLogin, auth.requiresRole('admin'), content.getLandingPage);

	app.post('/login', auth.authenticate);

	app.post('/logout', function(req, res) {
		req.logout();
		res.end();
	});




	// DO NOT MERGE TO PRODUCTION! FOR STAGING USE ONLY!
	app.get('/api/destroy', auth.requiresApiLogin, auth.requiresRole('admin'), destroy.destroy);
	// Write out project IDs
	app.get('/api/all_projects/persist', auth.requiresApiLogin, auth.requiresRole('admin'), projects.persist);

	app.all('/api/*', function(req, res) {
		res.sendStatus(404);
	});

	app.get('*', function(req, res) {
		res.render('index', {
			bootstrappedUser: req.user
		});
	});
};
