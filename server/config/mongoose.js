var mongoose 		= require('mongoose')
	userModel 		= require('../models/User');
	// questionModel 	= require('../models/Question'),
	// answerModel 	= require('../models/Answers');
	// assessmentModel = require('../models/Assessment'),

module.exports 	= function(config) {
	// connect to mongodb
	mongoose.connect(config.db);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console,'connection error...'));
	db.once('open', function callback() {
		console.log('Resource Projects db opened');
	});

	userModel.createDefaultUsers();
	// answerModel.createDefaultAnswers();
	// questionModel.createDefaultQuestions();
	// assessmentModel.createDefaultAssessments();

}