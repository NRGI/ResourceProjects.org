'use strict';
var mongoose 		    = require('mongoose'),
    linkModel           = require('../models/Links'),
    aliasModel          = require('../models/Aliases'),
    commodityModel      = require('../models/Commodities'),
    companyModel        = require('../models/Companies'),
    companyGroupModel   = require('../models/CompanyGroups'),
    concessionModel 	= require('../models/Concessions'),
    contractModel 	    = require('../models/Contracts'),
    projectModel        = require('../models/Projects'),
    //contributorModel 	= require('../models/Contributors'),
    //countryModel        = require('../models/Countries'),
    //licenseModel        = require('../models/Licenses'),
    //productionModel     = require('../models/Production'),
    //reservesModel       = require('../models/Reserves'),
    //transferModel       = require('../models/Transfers'),
    sourceModel 	    = require('../models/Sources'),
    userModel 		    = require('../models/Users');
    //model_load          = ['Aliases'];

//model_load.forEach(function(model_name) {
//    require('../models/' + model_name);
//});

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
    //console.log(linkModel);
    //contributorModel.createDefaultContributors();
    //countryModel.createDefaultCountries();



};