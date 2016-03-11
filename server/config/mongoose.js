'use strict';
var mongoose 		    = require('mongoose'),
    assert              = require('assert'),
    fs                  = require('fs'),
    linkModel           = require('../models/Links'),
    aliasModel          = require('../models/Aliases'),
    commodityModel      = require('../models/Commodities'),
    companyGroupModel   = require('../models/CompanyGroups'),
    countryModel        = require('../models/Countries'),
    sourceModel 	    = require('../models/Sources'),
    userModel 		    = require('../models/Users'),
    actionModel 		= require('../models/Actions'),
    datasetModel 		= require('../models/Datasets'),
    companyModel        = require('../models/Companies'),
    concessionModel 	= require('../models/Concessions'),
    contractModel 	    = require('../models/Contracts'),
    projectModel        = require('../models/Projects'),
    //contributorModel 	= require('../models/Contributors'),
    //licenseModel      = require('../models/Licenses'),
    //productionModel   = require('../models/Production'),
    //reservesModel     = require('../models/Reserves'),
    transferModel     = require('../models/Transfers'),
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
                sslCA:ca,
            }
        };
        mongoose.connect('mongodb://' + user + ':' + pass + config.db, options);
    }
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error...'));
    db.once('open', function callback() {
        console.log('rgi db opened');
    });




//
//
//    var db = mongoose.connection;
//
//    db.on('error', console.error.bind(console, 'connection error...'));
//    db.once('open', function callback() {
//        console.log('Resource Projects  db opened');
//    });
//
//    // connect to mongodb
//    mongoose.connect(config.db);
//    var db = mongoose.connection;
//    db.on('error', console.error.bind(console,'connection error...'));
//    db.once('open', function callback() {
//        console.log('Resource Projects db opened');
//    });
//
//
//
//
//
//    console.log(__dirname);
//    var ca = [fs.readFileSync(__dirname + "/certs/servercert.crt")];
//    var options = {
//        mongos: {
//            ssl: true,
//            sslValidate: true,
//            sslCA:ca,
//        }
//    };
//    console.log(__dirname);
//    //console.log(options);
//    mongoose.connect('mongodb://cperry:50Crat3s' + config.db, options);
//
//// If the connection throws an error
//    db.on('error',function (err) {
//        console.log('Mongoose connection error: ' + err);
//    });
//    db.once('open', function callback() {
//        console.log('Resource Projects db opened');
//    });
//    //mongoose.connection.on('open', function callback() {
//    //    console.log('Resource Projects  db opened');
//    //});
//
//    //mongoose.connection.on('open', function (err) {
//    //    assert.equal(null, err);
//    //    mongoose.connection.db.listCollections().toArray(function(err, collections) {
//    //        assert.equal(null, err);
//    //        collections.forEach(function(collection) {
//    //            console.log(collection);
//    //        });
//    //        mongoose.connection.db.close();
//    //        process.exit(0);
//    //    })
//    //});
//
//// Let's open that connection
////    mongoose.connect('mongodb://cperry:50Crat3s' + config.db, options);
//
//    //mongoose.connect('mongodb://cperry:50Crat3s' + config.db);
//    //
//    ////if (env === 'local') {
//    ////    mongoose.connect(config.db);
//    ////} else {
//    ////    //var ca = [fs.readFileSync(__dirname + "/servercert.crt")];
//    ////    //var options = {
//    ////    //    mongos: {
//    ////    //        ssl: true,
//    ////    //        sslValidate: true,
//    ////    //        sslCA:ca,
//    ////    //    }
//    ////    //};
//    ////    mongoose.connect('mongodb://' + user + ':' + pass + config.db);
//    ////    //db.on('open', function (err) {
//    ////    //    assert.equal(null, err);
//    ////    //    db.db.listCollections().toArray(function(err, collections) {
//    ////    //        assert.equal(null, err);
//    ////    //        collections.forEach(function(collection) {
//    ////    //            console.log(collection);
//    ////    //        });
//    ////    //        db.db.close();
//    ////    //        process.exit(0);
//    ////    //    })
//    ////    //});
//    ////}

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
    productionModel.createDefaultProductions();
    //contributorModel.createDefaultContributors();
    datasetModel.createDefaultDatasets();



};