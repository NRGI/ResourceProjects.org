var Concession 		= require('mongoose').model('Concession'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getConcessions = function(req, res) {
	var count;
	var query = Concession.find(req.query);
	query.exec(function (err, collection) {
		count = collection.length;
		collection = collection.slice(req.params.skip, Number(req.params.limit) + Number(req.params.skip));
		res.send({data: collection, count: count});
	});
};
exports.getConcessionByID = function(req, res) {
	Concession.findOne({_id:req.params.id}).exec(function(err, concession) {
		res.send(concession);
	});
};