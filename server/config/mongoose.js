'use strict';
var mongoose 		    = require('mongoose'),
    linkModel           = require('../models/Links'),
    aliasModel          = require('../models/Aliases'),
    commodityModel      = require('../models/Commodities'),
    companyGroupModel   = require('../models/CompanyGroups'),
    countryModel        = require('../models/Countries'),
    sourceModel 	    = require('../models/Sources'),
    userModel 		    = require('../models/Users'),

    companyModel        = require('../models/Companies'),
    concessionModel 	= require('../models/Concessions'),
    contractModel 	    = require('../models/Contracts'),
    projectModel        = require('../models/Projects'),
    //contributorModel 	= require('../models/Contributors'),
    //licenseModel      = require('../models/Licenses'),
    //productionModel   = require('../models/Production'),
    //reservesModel     = require('../models/Reserves'),
    transferModel     = require('../models/Transfers'),
    model_load          = ['Facts'];

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
    userModel.createDefaultUsers();
    sourceModel.createDefaultSources();
    companyModel.createDefaultCompanies();
    commodityModel.createDefaultCommodities();
    companyGroupModel.createDefaultCompanyGroups();
    concessionModel.createDefaultConcessions();
    contractModel.createDefaultContracts();
    projectModel.createDefaultProjects();
    linkModel.createDefaultLinks();
    aliasModel.createDefaultAliases();
    countryModel.createDefaultCountries();
    transferModel.createDefaultTransfers();
    //contributorModel.createDefaultContributors();



};