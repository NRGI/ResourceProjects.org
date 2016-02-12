var path 		= require('path');
var rootPath 	= path.normalize(__dirname + '/../../');

module.exports 	= {
    development: {
        baseUrl: 'http://localhost:3032',
        db: 'mongodb://localhost/rp_local',
        rootPath: rootPath,
        port: process.env.PORT || 3032
    },
    local: {
        baseUrl: 'http://localhost:3029',
        db: 'mongodb://localhost/rp_local',
        rootPath: rootPath,
        port: process.env.PORT || 3029
    },
    staging: {
        baseUrl: 'http://staging.resourceprojects.org',
        db: '@candidate.32.mongolayer.com:10582/rp_dev',
        rootPath: rootPath,
        port: process.env.PORT || 80
    },
    production: {
        baseUrl: 'http://resourceprojects.org',
        db: '@candidate.32.mongolayer.com:10582/rp_production',
        rootPath: rootPath,
        port: process.env.PORT || 80
    }
};