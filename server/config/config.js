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
        baseUrl: 'http://localhost:3013',
        db: 'mongodb://localhost/rp_local',
        rootPath: rootPath,
        port: process.env.PORT || 3013
    },
    staging: {
        baseUrl: 'http://dev-staging.resourceprojects.org',
        db: '@candidate.19.mongolayer.com:10726,candidate.32.mongolayer.com:10582/rp_staging?replicaSet=set-54c2868c4ae1de388800b2a3',
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