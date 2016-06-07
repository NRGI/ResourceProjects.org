var async           = require('async'),
	_               = require("underscore"),
	request         = require('request'),
	encrypt 		= require('../utilities/encryption');

exports.searchText = function(req, res) {
	var models =[];
	var type='';
	models = [
		{name:'Project',field:'proj_name'},
		{name:'Source',field:'source_name'},
		{name:'Commodity',field:'commodity_name'},
		{name:'Company',field:'company_name'},
		{name:'CompanyGroup',field:'company_group_name'},
		{name:'Concession',field:'concession_name'},
		{name:'Country',field:'name'},
		{name:'Site',field:'site_name'}
	];
	var models_len,models_counter=0,counter=0,result=[];
	async.waterfall([
		search
	], function (err, result) {
		if (err) {
			res.send(err);
		}
	});
	function search(callback) {
		models_len = models.length;
		_.each(models, function(model) {
			var name = require('mongoose').model(model.name);
			var $field = model.field;
			name.find().where( $field ,{$regex: new RegExp((req.query.query).toLowerCase(),'i')}).exec(function (err, responce) {
				models_counter++;
				_.each(responce, function(re) {
					counter++;
					if(model.name=='Site'&&re.field==true){
						type = 'field'
					}else if(model.name=='Site'&&re.field!=true){
						type = 'site'
					}
					else{
						type = model.name.toLowerCase()
					}
					result[counter-1]={name:re[$field],
						type:type,
						_id: re.id,
						iso2:re.iso2,
						commodity_id: re.commodity_id
					};
				});
				if(models_counter==models_len){
					res.send(result);
				}
			});
		});

	}

};