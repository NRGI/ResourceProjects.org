var Project 		= require('mongoose').model('Project'),
	Country 		= require('mongoose').model('Country'),
	Source 			= require('mongoose').model('Source'),
	Alias 			= require('mongoose').model('Alias'),
	Company 		= require('mongoose').model('Company'),
	Commodity 		= require('mongoose').model('Commodity'),
	Concession 		= require('mongoose').model('Concession'),
	Contract 		= require('mongoose').model('Contract'),
	encrypt 		= require('../utilities/encryption');
exports.getProjects = function(req, res) {
	var count;var source=[];var country=[];var project=[];var commodities=[];
	Country.find(req.query).exec(function(err, collection) {
		country = collection;
	});
	Source.find(req.query).exec(function(err, collection) {
		source = collection;
	});
	Commodity.find(req.query).exec(function(err, collection) {
		commodities = collection;
	});
	var query = Project.find(req.query);
	query.exec(function(err, collection) {
		count = collection.length;
		collection =collection.slice(req.params.skip,Number(req.params.limit)+Number(req.params.skip));
		collection.forEach(function(item){
			var proj_status='';var proj_type='';var proj_status_date='';var commodities_name='';
			if(item.proj_status.length!=0){
				proj_status = item.proj_status[0].string;
				source.forEach(function (source_item) {
					if (source_item._id.toString()==item.proj_status[0].source.toString()) {
						proj_status_date = source_item.source_date;
					}
				})
			}
			if(item.proj_type.length!=0){
				proj_type = item.proj_type[0].string;
			}if(item.commodities.length!=0) {
				commodities.forEach(function (commodity_item) {
					if (commodity_item._id == item.commodities[0].toString()) {
						commodities_name = commodity_item.commodity_name;
					}
				})
			}
			if(item.country.length!=0) {
				country.forEach(function (country_item) {
					if (country_item._id == item.country[0].country.toString()) {
						project.push({_id: item._id,commodities_name:commodities_name,proj_status:proj_status, proj_type:proj_type, proj_status_date:proj_status_date, proj_name: item.proj_name,companies: item.companies.length, country: {_id:country_item._id,name:country_item.name,iso2:country_item.iso2}})
					}
				})
			}
			else{
				project.push({_id: item._id,commodities_name:commodities_name,proj_status:proj_status, proj_type:proj_type, proj_status_date:proj_status_date, proj_name: item.proj_name,companies: item.companies.length, country: {_id:'',name:'',iso2:''}})
			}
		});
		res.send({data:project,count:count});
	});
};
exports.getProjectByID = function(req, res) {
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
	Concession.find(req.query).exec(function(err, collection) {
		concessions = collection;
	});
	Contract.find(req.query).exec(function(err, collection) {
		contracts = collection;
	});
	Project.findOne({_id:req.params.id}).exec(function(err, collection) {
		setTimeout(function() {
			if (collection != null || collection != undefined) {
				project = collection;
				if (collection.proj_status.length != 0) {
					source.forEach(function (source_item) {
						if (source_item._id.toString() == collection.proj_status[0].source.toString()) {
							project.proj_status[0] = {
								source: collection.proj_status[0].source,
								date: source_item.source_date,
								string: collection.proj_status[0].string
							};
						}
						project.proj_coordinates.forEach(function (coordinates, i) {
							if (source_item._id.toString() == coordinates.source.toString()) {
								project.proj_coordinates[i] = {
									source: coordinates.source,
									date: source_item.source_date,
									loc: coordinates.loc,
									name: source_item.source_name
								};
							}
						})
					})
				}
				if (collection.proj_aliases.length != 0) {
					collection.proj_aliases.forEach(function (aliases, i) {
						alias.forEach(function (alias_item) {
							if (alias_item._id.toString() == aliases.toString()) {
								project.proj_aliases[i] = {
									_id: aliases,
									name: alias_item.alias
								};
							}

						})
					})
				}
				if (collection.concessions.length != 0) {
					collection.concessions.forEach(function (concession, i) {
						concessions.forEach(function (concession_item) {
							if (concession_item._id.toString() == concession.toString()) {
								project.concessions[i] = {
									_id: concession,
									name: concession_item.concession_name
								};
							}

						})
					})
				}
				if (collection.contracts.length != 0) {
					collection.contracts.forEach(function (contract, i) {
						contracts.forEach(function (contract_item) {
							if (contract_item._id.toString() == contract.toString()) {
								project.contracts[i] = {
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
								project.commodities[i] = {
									_id: commodity,
									name: commodity_item.commodity_name
								};
							}

						})
					})
				}
				if (collection.companies.length != 0) {
					collection.companies.forEach(function (company, i) {
						companies.forEach(function (company_item) {
							if (company_item._id.toString() == company.toString()) {
								project.companies[i] = {
									_id: company,
									name: company_item.company_name
								};
							}

						})
					})
				}
				country.forEach(function (country_item) {
					if (collection.country.length != 0) {
						if (collection.country[0].country != undefined) {
							if (country_item._id == collection.country[0].country.toString()) {
								project.country[0] = {
									source: collection.country[0].source,
									country: collection.country[0].country,
									_id: country_item._id,
									name: country_item.name,
									iso2: country_item.iso2
								};
							}
						}
					}
				});
				res.send(project);
			} else {
				res.send(collection);
			}
		},100)
	});
};