var auth 		= require('./auth'),
    search 		= require('../controllers/search'),
	users 		= require('../controllers/users'),
	commodities = require('../controllers/commodities'),
	concessions = require('../controllers/concessions'),
	companies 	= require('../controllers/companies'),
	projects 	= require('../controllers/projects'),
	contracts 	= require('../controllers/contracts'),
	companyGroups 	= require('../controllers/companyGroups'),
	countries 	= require('../controllers/countries'),
	sources 	= require('../controllers/sources');
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
	///// COMPANIES CRUD ////////
	/////////////////////////
	//app.get('/api/companies/:limit/:skip', companies.getCompanies);
	app.get('/api/companies/:limit/:skip', companies.getCompanies);
	app.get('/api/companies/:id', companies.getCompanyByID);
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
	app.get('/api/companyGroups/:id', companyGroups.getCompanyGroupByID);
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

	// /////////////////////////////
	// ///// QUESTIONS CRUD ////////
	// /////////////////////////////
	// // GET
	// app.get('/api/questions', questions.getQuestions);
	// app.get('/api/questions/:id', questions.getQuestionsByID);
	// app.get('/api/question-text/:id', questions.getQuestionTextByID);
	
	// // PUT
	// app.put('/api/questions', auth.requiresRole('supervisor'), questions.updateQuestion);

	// // DELETE
	// app.delete('/api/questions/:id', auth.requiresRole('supervisor'), questions.deleteQuestion);

	// //////////////////////////////////////
	// ///// ASSESSMENT ANSWERS CRUD ////////
	// //////////////////////////////////////
	// // GET
	// app.get('/api/answers', auth.requiresApiLogin, answers.getAnswers);
	// app.get('/api/answers/:answer_ID', auth.requiresApiLogin, answers.getAnswersByID);
	
	// // POST
	// app.post('/api/answers', auth.requiresApiLogin, answers.createAnswers);
	// // app.get('/api/answers/:answer_ID', auth.requiresApiLogin, assessments.getAnswersByID);
	// // app.get('/api/answers/:answer_ID', auth.requiresApiLogin, assessments.getAnswersByID);
	
	// ///////////////////////////////////////
	// ///// ASSESSMENT OVERVIEW CRUD/////////
	// ///////////////////////////////////////
	// // GET
	// app.get('/api/assessments', auth.requiresApiLogin, assessments.getAssessments);
	// app.get('/api/assessments/:assessment_ID', auth.requiresApiLogin, assessments.getAssessmentsByID);
	
	// // PUT
	// app.put('/api/assessments/:assessment_ID', auth.requiresApiLogin, assessments.updateAssessment);

	////////////////////
	///// OTHER ////////
	////////////////////
	app.get('/partials/*', function(req, res) {
		res.render('../../public/app/' + req.params[0]);
	});

	app.post('/login', auth.authenticate);

	app.post('/logout', function(req, res) {
		req.logout();
		res.end();
	});

	app.all('/api/*', function(req, res) {
		res.sendStatus(404);
	});

	app.get('*', function(req, res) {
		res.render('index', {
			bootstrappedUser: req.user
		});
	});
};