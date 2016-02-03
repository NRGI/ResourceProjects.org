var Commodity 		= require('mongoose').model('Commodity'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getCommodities = function(req, res) {
	var query = Commodity.find(req.query);
	query.exec(function(err, collection) {
		res.send(collection);
	});
};
exports.getCommodityByID = function(req, res) {
	Commodity.findOne({_id:req.params.id}).exec(function(err, commodity) {
		res.send(commodity);
	});
};


