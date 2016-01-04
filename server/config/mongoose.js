'use strict';
var mongoose 		    = require('mongoose'),
    commodityModel      = require('../models/Commodities'),
    companyModel 	    = require('../models/Companies'),
    companyGroupModel 	= require('../models/CompanyGroups'),
    concessionModel 	= require('../models/Concessions'),
    contractModel 	    = require('../models/Contracts'),
    contributorModel 	= require('../models/Contributors'),
    countryModel        = require('../models/Countries'),
    sourceModel 	    = require('../models/Sources'),
    userModel 		    = require('../models/Users'),
    model_load          = ['Links', 'Aliases'];

model_load.forEach(function(model_name) {
    require('../models/' + model_name);
});

module.exports 	= function(config) {
    // connect to mongodb
    mongoose.connect(config.db);
    var db = mongoose.connection;
    db.on('error', console.error.bind(console,'connection error...'));
    db.once('open', function callback() {
        console.log('Resource Projects db opened');
    });

    commodityModel.createDefaultCommodities();
    companyModel.createDefaultCompanies();
    companyGroupModel.createDefaultCompanyGroups();
    concessionModel.createDefaultConcessions();
    contractModel.createDefaultContracts();
    contributorModel.createDefaultContributors();
    countryModel.createDefaultCountries();
    userModel.createDefaultUsers();
    sourceModel.createDefaultSources();

};