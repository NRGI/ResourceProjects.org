var CompanyGroup 		= require('mongoose').model('CompanyGroup'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getCompanyGroups = function(req, res) {
	var count;var companiesGroup=[];
	var query = CompanyGroup.find(req.query);
	query.exec(function(err, collection) {
		count = collection.length;
		if(collection.length!=0) {
			collection = collection.slice(req.params.skip, Number(req.params.limit) + Number(req.params.skip));
			collection.forEach(function (item) {
				companiesGroup.push({
					_id: item._id,
					name: item.company_group_name,
					projects: item.projects.length,
					companies: item.companies.length
				})
			});

			res.send({data: companiesGroup, count: count});
		}else{
		res.send({data: collection, count: count});
	}
	});
};
exports.getCompanyGroupByID = function(req, res) {
	CompanyGroup.findOne({_id:req.params.id}).exec(function(err, companyGroup) {
		res.send(companyGroup);
	});
};