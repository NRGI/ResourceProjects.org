'use strict';
var mongoose 		    = require('mongoose'),
    assert              = require('assert'),
    fs                  = require('fs'),
    // async               = require('async'),
    linkModel           = require('../models/Links'),
    aliasModel          = require('../models/Aliases'),
    commodityModel      = require('../models/Commodities'),
    companyGroupModel   = require('../models/CompanyGroups'),
    countryModel        = require('../models/Countries'),
    sourceModel 	    = require('../models/Sources'),
    userModel 		    = require('../models/Users'),
    actionModel 		= require('../models/Actions'),
    datasetModel 		= require('../models/Datasets'),
    duplicateModel 		= require('../models/Duplicates'),
    companyModel        = require('../models/Companies'),
    concessionModel 	= require('../models/Concessions'),
    contractModel 	    = require('../models/Contracts'),
    projectModel        = require('../models/Projects'),
    sourceTypeModel     = require('../models/SourceTypes'),
    siteModel           = require('../models/Sites'),
    //contributorModel 	= require('../models/Contributors'),
    //licenseModel      = require('../models/Licenses'),
    //reservesModel     = require('../models/Reserves'),
    transferModel       = require('../models/Transfers'),
    productionModel     = require('../models/Production'),
    model_load          = ['Facts'];

model_load.forEach(function(model_name) {
    require('../models/' + model_name);
});


module.exports 	= function(config, user, pass, env) {
    if (env === 'local') {
        mongoose.connect(config.db);
    } else {
        var ca = [fs.readFileSync(__dirname + "/certs/servercert.crt")];
        var options = {
            mongos: {
                ssl: true,
                sslValidate: true,
                sslCA:ca
            }
        };
        mongoose.connect('mongodb://' + user + ':' + pass + config.db, options);
    }

    var db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error...'));
    db.once('connected', function callback() {
        console.log('Resource Projects db opened');
        console.log('\n========================');
        console.log('mongoose version: %s', mongoose.version);
        console.log('========================\n\n');
    });

    // if (env === 'local') {
    //     actionModel.createDefaultActions();
    //     aliasModel.createDefaultAliases();
    //     commodityModel.createDefaultCommodities();
    //     companyModel.createDefaultCompanies();
    //     companyGroupModel.createDefaultCompanyGroups();
    //     concessionModel.createDefaultConcessions();
    //     contractModel.createDefaultContracts();
    //     // contributorModel.createDefaultContributors();
    //     countryModel.createDefaultCountries();
    //     datasetModel.createDefaultDatasets();
    //     duplicateModel.createDefaultDuplicates();
    //     linkModel.createDefaultLinks();
    //     productionModel.createDefaultProduction();
    //     projectModel.createDefaultProjects();
    //     siteModel.createDefaultSites();
    //     sourceModel.createDefaultSources();
    //     sourceTypeModel.createDefaultSourceTypes();
    //     transferModel.createDefaultTransfers();
    //     userModel.createDefaultUsers();
    //
    // } else {
    //     actionModel.createDefaultActions();
    //     aliasModel.getInitAliasCount();
    //     commodityModel.createDefaultCommodities();
    //     companyModel.getInitCompanyCount();
    //     companyGroupModel.getInitCompanyGroupsCount();
    //     concessionModel.getInitConcessionCount();
    //     contractModel.getInitContractCount();
    //     countryModel.createDefaultCountries();
    //     datasetModel.createDefaultDatasets();
    //     duplicateModel.getInitDuplicateCount();
    //     linkModel.getInitLinkCount();
    //     productionModel.getInitProductionCount();
    //     projectModel.getInitProjectCount();
    //     siteModel.getInitSiteCount();
    //     sourceModel.getInitSourceCount();
    //     sourceTypeModel.createDefaultSourceTypes();
    //     transferModel.getInitTransferCount();
    //     userModel.createDefaultUsers();
    // }
    actionModel.createDefaultActions();
    aliasModel.getInitAliasCount();
    commodityModel.createDefaultCommodities();
    companyModel.getInitCompanyCount();
    companyGroupModel.getInitCompanyGroupsCount();
    concessionModel.getInitConcessionCount();
    contractModel.getInitContractCount();
    countryModel.createDefaultCountries();
    datasetModel.createDefaultDatasets();
    duplicateModel.getInitDuplicateCount();
    linkModel.getInitLinkCount();
    productionModel.getInitProductionCount();
    projectModel.getInitProjectCount();
    siteModel.getInitSiteCount();
    sourceModel.getInitSourceCount();
    sourceTypeModel.createDefaultSourceTypes();
    transferModel.getInitTransferCount();
    userModel.createDefaultUsers();
};