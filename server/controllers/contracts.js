var Contract 		= require('mongoose').model('Contract'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getContracts = function(req, res) {
	var query = Contract.find(req.query);
	query.exec(function(err, collection) {
		res.send(collection);
	});
};
exports.getContractByID = function(req, res) {
	Contract.findOne({_id:req.params.id}).exec(function(err, contract) {
		res.send(contract);
	});
};