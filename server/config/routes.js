
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
	summaryStats 		= require('../controllers/summaryStats'),
	lastAdded 			= require('../controllers/lastAdded'),
	sunburst 			= require('../controllers/sunburst'),
	content 			= require('../controllers/content'),
	cors 				= require('cors');
	//etl         = require('../controllers/etl');
	// answers 	= require('../controllers/answers'),
	// questions 	= require('../controllers/questions'),
	// assessments = require('../controllers/assessments');
	// mongoose 	= require('mongoose');
	// User 		= mongoose.model('User');

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
	// POST
	app.post('/api/concessions',auth.requiresApiLogin, auth.requiresRole('admin'),  concessions.createConcession);
	// PUT
	app.put('/api/concessions', auth.requiresApiLogin, auth.requiresRole('admin'), concessions.updateConcession);
	// DELETE
	app.delete('/api/concessions/:id',auth.requiresApiLogin, auth.requiresRole('admin'), concessions.deleteConcession);
	
	/////////////////////
	/// PROJECTS CRUD ///
	/////////////////////
	app.get('/api/projects/:limit/:skip', projects.getProjects);
	app.get('/api/projects/:id', projects.getProjectByID);
	app.get('/api/projects/', projects.getProjectsMap);
	app.get('/api/projects/:iso2/:limit/:skip', projects.getProjectsWithIso);
	app.get('/api/projects/:limit/:skip', projects.getProjects);
	// POST
	app.post('/api/projects',auth.requiresApiLogin, auth.requiresRole('admin'),  projects.createProject);
	// PUT
	app.put('/api/projects', auth.requiresApiLogin, auth.requiresRole('admin'), projects.updateProject);
	// DELETE
	app.delete('/api/projects/:id',  auth.requiresApiLogin, auth.requiresRole('admin'), projects.deleteProject);

	////////////////////////////
	///// PAYMENTS CRUD ////////
	////////////////////////////
	app.get('/api/payments/:limit/:skip', payments.getPayments);
	app.get('/api/payments/:id', payments.getPaymentByID);
	// // POST
	// app.post('/api/payments',auth.requiresApiLogin, auth.requiresRole('admin'),  payments.createProject);
	// // PUT
	// app.put('/api/payments', auth.requiresApiLogin, auth.requiresRole('admin'), payments.updateProject);
	// // DELETE
	// app.delete('/api/payments/:id',  auth.requiresApiLogin, auth.requiresRole('admin'), payments.deleteProject);

	/////////////////////////
	///// COMPANIES CRUD ////
	/////////////////////////
	//app.get('/api/companies/:limit/:skip', companies.getCompanies);
	app.get('/api/companies/:limit/:skip', companies.getCompanies);
	app.get('/api/companies/:id', companies.getCompanyID);
	app.get('/api/companydata/:id', companies.getCompanyByID);
	
    // POST
	app.post('/api/companies',auth.requiresApiLogin, auth.requiresRole('admin'),  companies.createCompany);
	// PUT
	app.put('/api/companies', auth.requiresApiLogin, auth.requiresRole('admin'), companies.updateCompany);
	// DELETE
	app.delete('/api/companies/:id',auth.requiresApiLogin, auth.requiresRole('admin'), companies.deleteCompany);

	//////////////////////////
	/// COMPANYGROUPS CRUD ///
	//////////////////////////
	app.get('/api/companyGroups/:limit/:skip', companyGroups.getCompanyGroups);
	app.get('/api/companyGroups/:id', companyGroups.getCompanyGroupID);
	app.get('/api/companyGroupData/:id', companyGroups.getCompanyGroupByID);
	// POST
	app.post('/api/companyGroups',auth.requiresApiLogin, auth.requiresRole('admin'),  companyGroups.createCompanyGroup);
	// PUT
	app.put('/api/companyGroups', auth.requiresApiLogin, auth.requiresRole('admin'), companyGroups.updateCompanyGroup);
	// DELETE
	app.delete('/api/companyGroups/:id',auth.requiresApiLogin, auth.requiresRole('admin'), companyGroups.deleteCompanyGroup);

	///////////////////
	/// COMMODITIES ///
	///////////////////
	app.get('/api/commodities/:limit/:skip', commodities.getCommodities);
	app.get('/api/commodities/:id', commodities.getCommodityByID);
	// POST
	app.post('/api/commodities', auth.requiresApiLogin, auth.requiresRole('admin'), commodities.createCommodity);
	// PUT
	app.put('/api/commodities',  auth.requiresApiLogin, auth.requiresRole('admin'),commodities.updateCommodity);
	// DELETE
	app.delete('/api/commodities/:id', auth.requiresApiLogin, auth.requiresRole('admin'),commodities.deleteCommodity);

	//////////////////////
	/// COUNTRIES CRUD ///
	//////////////////////
	app.get('/api/countries/:limit/:skip', countries.getCountries);
	app.get('/api/countries/:id', countries.getCountryByID);
	app.get('/api/countrycommodity/:id', countries.getAllCommodityCountryByID);
	// POST
	app.post('/api/countries', auth.requiresApiLogin, auth.requiresRole('admin'), countries.createCountry);
	// PUT
	app.put('/api/countries', auth.requiresApiLogin, auth.requiresRole('admin'), countries.updateCountry);
	// DELETE
	app.delete('/api/countries/:id', auth.requiresApiLogin, auth.requiresRole('admin'), countries.deleteCountry);

	////////////////////
	/// SOURCES CRUD ///
	////////////////////
	app.get('/api/sources/:limit/:skip', sources.getSources);
	app.get('/api/sources/:id', sources.getSourceByID);

	// POST
	app.post('/api/sources', auth.requiresApiLogin, auth.requiresRole('admin'), sources.createSource);
	// PUT
	app.put('/api/sources', auth.requiresApiLogin, auth.requiresRole('admin'), sources.updateSource);
	// DELETE
	app.delete('/api/sources/:id', auth.requiresApiLogin, auth.requiresRole('admin'), sources.deleteSource);

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
	app.get('/api/sites/map/:field', sites.getSitesMap);
	// POST
	app.post('/api/sites',auth.requiresApiLogin, auth.requiresRole('admin'),  sites.createSite);
	// PUT
	app.put('/api/sites',auth.requiresApiLogin, auth.requiresRole('admin'),  sites.updateSite);
	// DELETE
	app.delete('/api/sites/:id', auth.requiresApiLogin, auth.requiresRole('admin'), sites.deleteSite);



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
	app.post('/api/datasets', /* auth.requiresApiLogin, auth.requiresRole('admin'), */ datasets.createDataset);
	//Create a dataset
	app.post('/api/datasets', auth.requiresApiLogin, /* auth.requiresRole('admin'),*/ datasets.createDataset);
	//Start an ETL step
	app.post('/api/datasets/:id/actions', /* auth.requiresApiLogin, auth.requiresRole('admin'), */ datasets.createAction);


	//////////////////////////////////////
	/// COMPANIES HOUSE DUMMY DATASETS ///
	//////////////////////////////////////

	app.get('/api/testdata', datasets.getTestdata);


	//////////////////
	/// USERS CRUD ///
	//////////////////
	app.get('/api/users', auth.requiresRole('admin'), users.getUsers);
	app.get('/api/users/:id', auth.requiresRole('admin'), users.getUsersByID);
	app.get('/api/user-list/:id', auth.requiresRole('admin'), users.getUsersListByID);

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
	app.get('/api/company_table/:type/:id', company_tables.getCompanyTable);
	app.get('/api/project_table/:type/:id', project_tables.getProjectTable);
	app.get('/api/prod_table/:type/:id', production_tables.getProductionTable);
	app.get('/api/transfer_table/:type/:id', transfer_tables.getTransferTable);
	app.get('/api/source_table/:type/:id', source_tables.getSourceTable);
	app.get('/api/site_table/:type/:id', site_tables.getSiteFieldTable);
	app.get('/api/contract_table/:type/:id', contract_tables.getContractTable);
	app.get('/api/concession_table/:type/:id', concession_tables.getConcessionTable);

	app.get('/api/coordinate/:type/:id', map.getCoordinateCountryByID);

	//SUMMARY STATS
	app.get('/api/summary_stats', summaryStats.getSummaryStats);

	app.get('/api/sum_of_payments', summaryStats.getSumOfPayments);

	//LAST ADDED PROJECTS AND SOURCES
	app.get('/api/last_added', lastAdded.getLastAdded);

	//Payments
	app.get('/api/transfers', sunburst.getPayments);

	//ABOUT PAGE CONTENT
	app.get('/api/about', content.getAboutPage);
	app.put('/api/about', auth.requiresApiLogin, auth.requiresRole('admin'), content.updateAboutPage);

	//GLOSSARY PAGE CONTENT
	app.get('/api/glossary', content.getGlossaryPage);
	app.put('/api/glossary', auth.requiresApiLogin, auth.requiresRole('admin'), content.getGlossaryPage);

	//GLOSSARY PAGE CONTENT
	app.get('/api/landing', content.getLandingPage);
	app.put('/api/landing', auth.requiresApiLogin, auth.requiresRole('admin'), content.getLandingPage);

	app.post('/login', auth.authenticate);

	app.post('/logout', function(req, res) {
		req.logout();
		res.end();
	});

	app.all('/api/*', function(req, res) {
		res.sendStatus(404);
	});
	//app.get('*', function(req, res) {
	//	res.render('landing_page', {
	//		bootstrappedUser: req.user
	//	});
	//});
	app.get('*', function(req, res) {
		res.render('index', {
			bootstrappedUser: req.user
		});
	});
};