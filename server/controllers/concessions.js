var Concession 		= require('mongoose').model('Concession'),
	Country 		= require('mongoose').model('Country'),
	Source 			= require('mongoose').model('Source'),
	Alias 			= require('mongoose').model('Alias'),
	Company 		= require('mongoose').model('Company'),
	Commodity 		= require('mongoose').model('Commodity'),
	Project 		= require('mongoose').model('Project'),
	Contract 		= require('mongoose').model('Contract'),
	encrypt 	= require('../utilities/encryption');
exports.getConcessions = function(req, res) {
	var count;var source=[];var country=[];var concession=[];var commodities=[];
	var query = Concession.find(req.query);
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
			var concession_status='';var concession_type='';var concession_status_date='';var commodities_name='';
			if(item.concession_status.length!=0){
				concession_status = item.concession_status[0].string;
				source.forEach(function (source_item) {
					if (source_item._id.toString()==item.concession_status[0].source.toString()) {
						concession_status_date = source_item.source_date;
					}
				})
			}
			if(item.concession_type.length!=0){
				concession_type = item.concession_type[0].string;
			}if(item.commodities.length!=0) {
				commodities.forEach(function (commodity_item) {
					if (commodity_item._id == item.commodities[0].toString()) {
						commodities_name = commodity_item.commodity_name;
					}
				})
			}
			if(item.concession_country.length!=0) {
				country.forEach(function (country_item) {
					if (country_item._id == item.concession_country[0].string.toString()) {
						concession.push({_id: item._id,commodities_name:commodities_name,concession_status:concession_status, concession_type:concession_type, concession_status_date:concession_status_date, concession_name: item.concession_name,companies: item.projects.length, country: {_id:country_item._id,name:country_item.name,iso2:country_item.iso2}})
					}
				})
			}
			else{
				concession.push({_id: item._id,commodities_name:commodities_name,concession_status:concession_status, concession_type:concession_type, concession_status_date:concession_status_date, concession_name: item.concession_name,projects: item.projects.length, country: {_id:'',name:'',iso2:''}})
			}
		});
		res.send({data:concession,count:count});
	});


};
exports.getConcessionByID = function(req, res) {
	var country=[];var project=[];var source=[];var alias=[];var companies=[];var contracts=[];var commodities=[];var concessions=[];
	Commodity.find(req.query).exec(function(err, collection) {
		commodities = collection;
	});
	Company.find(req.query).exec(function(err, collection) {
		companies = collection;
	});
	Alias.find(req.query).exec(function(err, collection) {
		alias = collection;
	});
	Source.find(req.query).exec(function(err, collection) {
		source = collection;
	});
	Country.find(req.query).exec(function(err, collection) {
		country = collection;
	});
	Project.find(req.query).exec(function(err, collection) {
		project = collection;
	});
	Contract.find(req.query).exec(function(err, collection) {
		contracts = collection;
	});
	Concession.findOne({_id:req.params.id}).exec(function(err, collection) {
		setTimeout(function() {
			if (collection != null || collection != undefined) {
				concessions = collection;
				if (collection.concession_status.length != 0) {
					source.forEach(function (source_item) {
						if (source_item._id.toString() == collection.concession_status[0].source.toString()) {
							concessions.concession_status[0] = {
								source: collection.concession_status[0].source,
								date: source_item.source_date,
								string: collection.concession_status[0].string
							};
						}
					})
				}
				if (collection.concession_aliases.length != 0) {
					collection.concession_aliases.forEach(function (aliases, i) {
						alias.forEach(function (alias_item) {
							if (alias_item._id.toString() == aliases.toString()) {
								concessions.concession_aliases[i] = {
									_id: aliases,
									name: alias_item.alias
								};
							}

						})
					})
				}
				if (collection.contracts.length != 0) {
					collection.contracts.forEach(function (contract, i) {
						contracts.forEach(function (contract_item) {
							if (contract_item._id.toString() == contract.toString()) {
								concessions.contracts[i] = {
									_id: contract,
									name: contract_item.contract_id
								};
							}

						})
					})
				}
				if (collection.commodities.length != 0) {
					collection.commodities.forEach(function (commodity, i) {
						commodities.forEach(function (commodity_item) {
							if (commodity_item._id.toString() == commodity.toString()) {
								concessions.commodities[i] = {
									_id: commodity,
									name: commodity_item.commodity_name
								};
							}

						})
					})
				}
				//if (collection.companies.length != 0) {
				//	collection.companies.forEach(function (company, i) {
				//		companies.forEach(function (company_item) {
				//			if (company_item._id.toString() == company.toString()) {
				//				concessions.companies[i] = {
				//					_id: company,
				//					name: company_item.company_name
				//				};
				//			}
                //
				//		})
				//	})
				//}
				country.forEach(function (country_item) {
					if (collection.concession_country.length != 0) {
						if (collection.concession_country[0].string != undefined) {
							if (country_item._id == collection.concession_country[0].string.toString()) {
								concessions.concession_country[0] = {
									source: collection.concession_country[0].source,
									string: collection.concession_country[0].string,
									_id: country_item._id,
									name: country_item.name,
									iso2: country_item.iso2
								};
							}
						}
					}
				});
				res.send(concessions);
			} else {
				res.send(collection);
			}
		},100);
		//res.send(concession);
	});
};