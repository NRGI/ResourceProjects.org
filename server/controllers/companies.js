var Company 		= require('mongoose').model('Company'),
	CompanyGroup 		= require('mongoose').model('CompanyGroup'),
	Country		= require('mongoose').model('Country'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getCompanies = function(req, res) {
	var companies =[];
	var group =[];
	var count;
	CompanyGroup.find(req.query).exec(function(err, companyGroup) {
		group = companyGroup;
	});
	Company.find(req.query).exec(function(err, company) {
		count = company.length;
		company =company.slice(req.params.skip,Number(req.params.limit)+Number(req.params.skip));
		company.forEach(function(item){
			if(item.company_groups.toString()!='') {
				group.forEach(function (group_item) {
					if (group_item._id == item.company_groups.toString()) {
						companies.push({_id: item._id, company_name: item.company_name,projects: item.projects.length, company_groups: {_id:item.company_groups.toString(),name:group_item.company_group_name}})
					}
				})
			}else{
				companies.push({_id: item._id, company_name: item.company_name,projects: item.projects.length, company_groups: {_id:item.company_groups,name:''}})
			}
		});
		res.send({data:companies,count:count});
	});
};
exports.getCompanyByID = function(req, res) {
	Company.findOne({_id:req.params.id}).exec(function(err, company) {
		res.send(company);
	})
};