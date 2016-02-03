var auth 		= require('./auth'),
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

	// GET


	//CONTRACTS
	app.get('/api/contracts', contracts.getContracts);
	app.get('/api/contract/:id', contracts.getContractByID);

	//CONCESSIONS
	app.get('/api/concessions', concessions.getConcessions);
	app.get('/api/concessions/:id', concessions.getConcessionByID);

	//PROJECTS
	app.get('/api/projects', projects.getProjects);
	app.get('/api/projects/:id', projects.getProjectByID);

	//COMPANIES and COMPANYGROUPS
	app.get('/api/companies/:limit/:skip', companies.getCompanies);
	app.get('/api/companies/:id', companies.getCompanyByID);
	app.get('/api/companyGroups', companyGroups.getCompanyGroups);
	app.get('/api/companyGroups/:id', companyGroups.getCompanyGroupByID);

	//COMMODITIES
	app.get('/api/commodities', commodities.getCommodities);
	app.get('/api/commodities/:id', commodities.getCommodityByID);

	//COUNTRIES
	app.get('/api/countries', countries.getCountries);
	app.get('/api/countries/:id', countries.getCountryByID);

	//SOURCES
	app.get('/api/sources', sources.getSources);
	app.get('/api/source/:id', sources.getSourceByID);

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