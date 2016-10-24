'use strict';
var assert              = require('assert'),
    bodyParser 		    = require('body-parser'),
    cookieParser 	    = require('cookie-parser'),
    express 		    = require('express'),
    fs                  = require('fs'),
    logger 			    = require('morgan'),
    mongoose 		    = require('mongoose'),
    passport 		    = require('passport'),
    session 		    = require('express-session'),
    MongoStore          = require('connect-mongo')(session),
    stylus 			    = require('stylus'),
    linkModel           = require('../models/Links'),
    aliasModel          = require('../models/Aliases'),
    commodityModel      = require('../models/Commodities'),
    companyGroupModel   = require('../models/CompanyGroups'),
    countryModel        = require('../models/Countries'),
    sourceModel 	    = require('../models/Sources'),
    userModel 		    = require('../models/Users'),
    actionModel 		= require('../models/Actions'),
    importSourceModel   = require('../models/ImportSources'),
    datasetModel 		= require('../models/Datasets'),
    duplicateModel 		= require('../models/Duplicates'),
    companyModel        = require('../models/Companies'),
    concessionModel 	= require('../models/Concessions'),
    contractModel 	    = require('../models/Contracts'),
    projectModel        = require('../models/Projects'),
    sourceTypeModel     = require('../models/SourceTypes'),
    siteModel           = require('../models/Sites'),
    transferModel       = require('../models/Transfers'),
    productionModel     = require('../models/Production'),
    aboutPageModel     = require('../models/AboutPage'),
    glossaryPage     = require('../models/GlossaryPage'),
    landingPage     = require('../models/LandingPage'),
    model_load          = ['Facts'],
    SESSION_SECRET  	= "whatever you want";

model_load.forEach(function(model_name) {
    require('../models/' + model_name);
});

module.exports = function(app, config, user, pass, env) {
	// function for use by stylus middleware
	function compile(str, path) {
		return stylus(str).set('filename', path);
	}
	// set up view engine
	app.set('views', config.rootPath + '/server/views');
	app.set('view engine', 'jade');

    // set up logger
	app.use(logger('dev'));

    // authentication cofigs
	app.use(cookieParser());
    app.use(bodyParser.urlencoded({
        extended: true,
        limit: '50mb'
    }));
    app.use(bodyParser.json({limit: '50mb'}));

    //Mongoose connection
    if (env === 'local') {
        mongoose.connect(config.db);
    } else {
        var ca = [fs.readFileSync(__dirname + "/certs/servercert.crt")];
        var options = {
            mongos: {
                ssl: true,
                sslValidate: true,
                sslCA: ca
            }
        };
        mongoose.connect('mongodb://' + user + ':' + pass + config.db, options);
    }
    var db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error...'));
    db.once('open', function callback() {
        console.log('Resource Projects db opened');
        console.log('\n========================');
        console.log('mongoose version: %s', mongoose.version);
        console.log('========================\n\n');
    });
    // import default data
    actionModel.createDefaultActions();
    //aliasModel.getInitAliasCount(); //Aliases moved to nested document
    commodityModel.createDefaultCommodities();
    companyModel.getInitCompanyCount();
    companyGroupModel.getInitCompanyGroupsCount();
    concessionModel.getInitConcessionCount();
    contractModel.getInitContractCount();
    countryModel.createDefaultCountries();
    datasetModel.createDefaultDatasets();
    duplicateModel.getInitDuplicateCount();
    importSourceModel.getInitImportSourceCount();
    linkModel.getInitLinkCount();
    productionModel.getInitProductionCount();
    projectModel.getInitProjectCount();
    siteModel.getInitSiteCount();
    sourceModel.getInitSourceCount();
    sourceTypeModel.createDefaultSourceTypes();
    glossaryPage.createDefaultGlossaryPage();
    landingPage.createDefaultLandingPage();
    aboutPageModel.createDefaultAboutPage();
    transferModel.getInitTransferCount();
    userModel.createDefaultUsers();
    
    //Connection session
    app.use(session({
        secret: SESSION_SECRET,
        store: new MongoStore({
            mongooseConnection: db,
            autoRemove: 'native',
            touchAfter: 120}),
        touchAfter: 120,
        resave: true,
        saveUninitialized: true
    }));
	app.use(passport.initialize());
	app.use(passport.session());

	// stylus middleware implementation - routes to anything in public directory
	app.use(stylus.middleware(
	{
		src: config.rootPath + '/public',
		compile: compile
    }
    ));
    app.use(express.static(config.rootPath + '/public'));
}
