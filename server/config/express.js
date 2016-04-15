'use strict';
var express 		= require('express'),
    // walk            = require('walk'),
    stylus 			= require('stylus'),
    logger 			= require('morgan'),
    bodyParser 		= require('body-parser'),
    cookieParser 	= require('cookie-parser'),
    session 		= require('express-session'),
    passport 		= require('passport'),
    SESSION_SECRET	= "whatever you want";

module.exports = function(app, config) {
	// function for use by stylus middleware
	function compile(str, path) {
		return stylus(str).set('filename', path);
	}
    // console.error(config);
    // console.error(process.env);
    // var files   = [];
    // var walker  = walk.walk('./server/config', { followLinks: false });
    // walker.on('file', function(root, stat, next) {
    //     // Add this file to the list of files
    //     files.push(root + '/' + stat.name);
    //     next();
    // });
    // walker.on('end', function() {
    //     console.error(files);
    // });


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
    app.use(session({
        secret: SESSION_SECRET,
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