var CompanyGroup 		= require('mongoose').model('CompanyGroup'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getCompanyGroups = function(req, res) {
	var query = CompanyGroup.find(req.query);
	query.exec(function(err, collection) {
		res.send(collection);
	});
};
exports.getCompanyGroupByID = function(req, res) {
	CompanyGroup.findOne({_id:req.params.id}).exec(function(err, companyGroup) {
		res.send(companyGroup);
	});
};