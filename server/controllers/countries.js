var Country 		= require('mongoose').model('Country'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getCountries = function(req, res) {
	var countries =[];	var count;
	var query = Country.find(req.query);
	query.exec(function(err, collection) {
		count = collection.length;
		collection.forEach(function(item){
			countries.push({_id: item._id, name: item.name,projects: item.projects.length})
		});
		countries =countries.slice(req.params.skip,Number(req.params.limit)+Number(req.params.skip));
		res.send({data:countries,count:count});
	});
};
exports.getCountryByID = function(req, res) {
	Country.findOne({_id:req.params.id}).exec(function(err, country) {
		res.send(country);
	});
};