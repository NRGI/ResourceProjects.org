var Source 		= require('mongoose').model('Source'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getSources = function(req, res) {
	Source.find(req.query).exec(function(err, source) {
		res.send(source);
	});
};
exports.getSourceByID = function(req, res) {
	Source.findOne({_id:req.params.id}).exec(function(err, source) {
		res.send(source);
	});
};