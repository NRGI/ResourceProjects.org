
var auth 				= require('./auth'),
    search 				= require('../controllers/search'),
	users 				= require('../controllers/users'),
	datasets  			= require('../controllers/datasets'),
	commodities 		= require('../controllers/commodities'),
	concessions 		= require('../controllers/concessions'),
	companies 			= require('../controllers/companies'),
	projects 			= require('../controllers/projects'),
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
	sourceTypes 		= require('../controllers/sourceTypes');
	//etl         = require('../controllers/etl');
	// answers 	= require('../controllers/answers'),
	// questions 	= require('../controllers/questions'),
	// assessments = require('../controllers/assessments');
	// mongoose 	= require('mongoose');
	// User 		= mongoose.model('User');

module.exports	= function(app) {

	app.get('/api/search', search.searchText);

	//CONTRACTS
	app.get('/api/contracts/:limit/:skip', contracts.getContracts);
	app.get('/api/contracts/:id', contracts.getContractByID);


	/////////////////////////
	///// CONCESSIONS CRUD ////////
	/////////////////////////
	app.get('/api/concessions/:limit/:skip', concessions.getConcessions);
	app.get('/api/concessions/:id', concessions.getConcessionByID);
	// POST
	app.post('/api/concessions',  concessions.createConcession);
	// PUT
	app.put('/api/concessions',  concessions.updateConcession);
	// DELETE
	app.delete('/api/concessions/:id', concessions.deleteConcession);

	/////////////////////////
	///// PROJECTS CRUD ////////
	/////////////////////////
	app.get('/api/projects/:limit/:skip', projects.getProjects);
	app.get('/api/projects/:id', projects.getProjectByID);
	app.get('/api/projects/', projects.getProjectsMap);
	// POST
	app.post('/api/projects',  projects.createProject);
	// PUT
	app.put('/api/projects',  projects.updateProject);
	// DELETE
	app.delete('/api/projects/:id', projects.deleteProject);

	/////////////////////////
	///// COMPANIES CRUD ////
	/////////////////////////
	//app.get('/api/companies/:limit/:skip', companies.getCompanies);
	app.get('/api/companies/:limit/:skip', companies.getCompanies);
	app.get('/api/companies/:id', companies.getCompanyID);
	app.get('/api/companydata/:id', companies.getCompanyByID);
	
    // POST
	app.post('/api/companies',  companies.createCompany);
	// PUT
	app.put('/api/companies',  companies.updateCompany);
	// DELETE
	app.delete('/api/companies/:id', companies.deleteCompany);

	/////////////////////////
	///// COMPANYGROUPS CRUD ////////
	/////////////////////////
	app.get('/api/companyGroups/:limit/:skip', companyGroups.getCompanyGroups);
	app.get('/api/companyGroups/:id', companyGroups.getCompanyGroupID);
	app.get('/api/companyGroupData/:id', companyGroups.getCompanyGroupByID);
	// POST
	app.post('/api/companyGroups',  companyGroups.createCompanyGroup);
	// PUT
	app.put('/api/companyGroups',  companyGroups.updateCompanyGroup);
	// DELETE
	app.delete('/api/companyGroups/:id', companyGroups.deleteCompanyGroup);

	/////////////////////////
	///// COMMODITIES ////////
	/////////////////////////
	app.get('/api/commodities/:limit/:skip', commodities.getCommodities);
	app.get('/api/commodities/:id', commodities.getCommodityByID);
	// POST
	app.post('/api/commodities',  commodities.createCommodity);
	// PUT
	app.put('/api/commodities',  commodities.updateCommodity);
	// DELETE
	app.delete('/api/commodities/:id', commodities.deleteCommodity);

	/////////////////////////
	///// COUNTRIES CRUD ////////
	/////////////////////////
	app.get('/api/countries/:limit/:skip', countries.getCountries);
	app.get('/api/countries/:id', countries.getCountryByID);
	app.get('/api/countrycommodity/:id', countries.getAllCommodityCountryByID);
	// POST
	app.post('/api/countries',  countries.createCountry);
	// PUT
	app.put('/api/countries',  countries.updateCountry);
	// DELETE
	app.delete('/api/countries/:id', countries.deleteCountry);

	/////////////////////////
	///// SOURCES CRUD ////////
	/////////////////////////
	app.get('/api/sources/:limit/:skip', sources.getSources);
	app.get('/api/sources/:id', sources.getSourceByID);

	// POST
	app.post('/api/sources',  sources.createSource);
	// PUT
	app.put('/api/sources',  sources.updateSource);
	// DELETE
	app.delete('/api/sources/:id', sources.deleteSource);

	/////////////////////////
	///// SOURCE TYPES CRUD ////////
	/////////////////////////
	app.get('/api/sourcetypes/:limit/:skip/:display', sourceTypes.getSourceTypes);
	app.get('/api/sourcetypes/:id', sourceTypes.getSourceTypeByID);

	// POST
	app.post('/api/sourcetypes',  sourceTypes.createSourceType);
	// PUT
	app.put('/api/sourcetypes',  sourceTypes.updateSourceType);
	// DELETE
	app.delete('/api/sourcetypes/:id', sourceTypes.deleteSourceType);


	/////////////////////////
	///// SITES CRUD ////////
	/////////////////////////
	app.get('/api/sites/:limit/:skip/:field', sites.getSites);
	app.get('/api/sites/:id', sites.getSiteByID);
	app.get('/api/sites/map/:field', sites.getSitesMap);
	// POST
	app.post('/api/sites',  sites.createSite);
	// PUT
	app.put('/api/sites',  sites.updateSite);
	// DELETE
	app.delete('/api/sites/:id', sites.deleteSite);



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


	/////////////////////////////////////////////
	///// COMPANIES HOUSE DUMMY DATASETS ////////
	/////////////////////////////////////////////

	app.get('/api/testdata', datasets.getTestdata);


	/////////////////////////
	///// USERS CRUD ////////
	/////////////////////////
	app.get('/api/users', auth.requiresRole('admin'), users.getUsers);
	app.get('/api/users/:id', auth.requiresRole('admin'), users.getUsersByID);
	app.get('/api/user-list/:id', auth.requiresRole('admin'), users.getUsersListByID);

	// POST
	app.post('/api/users', auth.requiresApiLogin, auth.requiresRole('admin'), users.createUser);

	// PUT
	app.put('/api/users', auth.requiresRole('admin'), users.updateUser);

	// DELETE
	app.delete('/api/users/:id', auth.requiresRole('admin'), users.deleteUser);
	////////////////////
	///// OTHER ////////
	////////////////////
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