var Contract 		= require('mongoose').model('Contract'),
	Country 		= require('mongoose').model('Country'),
	Source 			= require('mongoose').model('Source'),
	Alias 			= require('mongoose').model('Alias'),
	Company 		= require('mongoose').model('Company'),
	Commodity 		= require('mongoose').model('Commodity'),
	Project 		= require('mongoose').model('Project'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getContracts = function(req, res) {
	var count;var source=[];var country=[];var contracts=[];var commodities=[];
	var query = Contract.find(req.query);
	Country.find(req.query).exec(function(err, collection) {
		country = collection;
	});
	Source.find(req.query).exec(function(err, collection) {
		source = collection;
	});
	Commodity.find(req.query).exec(function(err, collection) {
		commodities = collection;
	});
	query.exec(function(err, collection) {
		count = collection.length;
		collection =collection.slice(req.params.skip,Number(req.params.limit)+Number(req.params.skip));
		collection.forEach(function(item){
			var contract_type='';var commodities_name='';
			if(item.contract_type.length!=0){
				contract_type = item.contract_type[0].string;
			}if(item.commodities.length!=0) {
				commodities.forEach(function (commodity_item) {
					if (commodity_item._id == item.commodities[0].toString()) {
						commodities_name = commodity_item.commodity_name;
					}
				})
			}
			if(item.country.length!=0) {
				country.forEach(function (country_item) {
					if (country_item._id == item.country[0].toString()) {
						contracts.push({_id: item._id,name:item.contract_id, contract_type:contract_type,commodities_name:commodities_name, projects: item.projects.length, country: {_id:country_item._id,name:country_item.name,iso2:country_item.iso2}})
					}
				})
			}
			else{
				contracts.push({_id: item._id,name:item.contract_id, contract_type:contract_type,commodities_name:commodities_name, projects: item.projects.length, country: {_id:'',name:'',iso2:''}})
			}
		});
		res.send({data:contracts,count:count});
	});


};
exports.getContractByID = function(req, res) {
	Contract.findOne({_id:req.params.id}).exec(function(err, contract) {
		res.send(contract);
	});
};