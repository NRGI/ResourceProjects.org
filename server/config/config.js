var path 		= require('path');
var rootPath 	= path.normalize(__dirname + '/../../');

module.exports 	= {
    local: {
        baseUrl: 'http://localhost:3008',
        db: 'mongodb://localhost/rp_local',
        rootPath: rootPath,
        port: process.env.PORT || 3008
    },
    staging : {
        baseUrl: 'http://dev.resourceprojects.org',
        //db: '@aws-us-east-1-portal.14.dblayer.com:10669/rp_dev?ssl=true',
        db: '@aws-us-east-1-portal.14.dblayer.com:10669,aws-us-east-1-portal.13.dblayer.com:10499/rp_dev?ssl=true',
        rootPath: rootPath,
        port: process.env.PORT || 80
    }
};
