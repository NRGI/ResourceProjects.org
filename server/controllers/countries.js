var Country 		= require('mongoose').model('Country'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getCountries = function(req, res) {
	var countries =[];
	var query = Country.find(req.query);
	query.exec(function(err, collection) {
		collection.forEach(function(item){
			countries.push({_id: item._id, name: item.name,projects: item.projects.length})
		});
		res.send(countries);
	});
};
exports.getCountryByID = function(req, res) {
	Country.findOne({_id:req.params.id}).exec(function(err, country) {
		res.send(country);
	});
};