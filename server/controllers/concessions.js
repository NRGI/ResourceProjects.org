var Concession 		= require('mongoose').model('Concession'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getConcessions = function(req, res) {
	var query = Concession.find(req.query);
	query.exec(function(err, collection) {
		res.send(collection);
	});
};
exports.getConcessionByID = function(req, res) {
	Concession.findOne({_id:req.params.id}).exec(function(err, concession) {
		res.send(concession);
	});
};