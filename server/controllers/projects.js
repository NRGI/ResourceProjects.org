var Project 		= require('mongoose').model('Project'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getProjects = function(req, res) {
	var query = Project.find(req.query);
	query.exec(function(err, collection) {
		res.send(collection);
	});
};
exports.getProjectByID = function(req, res) {
	Project.findOne({_id:req.params.id}).exec(function(err, project) {
		res.send(project);
	});
};