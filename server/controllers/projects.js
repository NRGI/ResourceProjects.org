var Project 		= require('mongoose').model('Project'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getProjects = function(req, res) {
	var count;
	var query = Project.find(req.query);
	query.exec(function(err, collection) {
		count = collection.length;
		collection =collection.slice(req.params.skip,Number(req.params.limit)+Number(req.params.skip));
		res.send({data:collection,count:count});
	});
};
exports.getProjectByID = function(req, res) {
	Project.findOne({_id:req.params.id}).exec(function(err, project) {
		res.send(project);
	});
};