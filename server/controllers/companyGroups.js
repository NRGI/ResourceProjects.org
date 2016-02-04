var CompanyGroup 		= require('mongoose').model('CompanyGroup'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getCompanyGroups = function(req, res) {
	var count;
	var query = CompanyGroup.find(req.query);
	query.exec(function(err, collection) {
		count = collection.length;
		collection =collection.slice(req.params.skip,Number(req.params.limit)+Number(req.params.skip));
		res.send({data:collection,count:count});
	});
};
exports.getCompanyGroupByID = function(req, res) {
	CompanyGroup.findOne({_id:req.params.id}).exec(function(err, companyGroup) {
		res.send(companyGroup);
	});
};