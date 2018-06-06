var path 		= require('path');
var rootPath 	= path.normalize(__dirname + '/../../');

module.exports 	= {
    local: {
        baseUrl: 'http://localhost:3030',
        db: 'mongodb://localhost/rp_local',
        rootPath: rootPath,
        port: process.env.PORT || 3030
    },
    staging : {
        baseUrl: 'http://staging.resourceprojects.org',
        db: '@resource-projects-shard-00-00-vayfs.mongodb.net:27017,resource-projects-shard-00-01-vayfs.mongodb.net:27017,resource-projects-shard-00-02-vayfs.mongodb.net:27017/rp_dev?ssl=true&replicaSet=resource-projects-shard-0&authSource=admin',
        rootPath: rootPath,
        port: process.env.PORT || 80
    },
    production : {
        baseUrl: 'http://resourceprojects.org',
        db: '@resource-projects-shard-00-00-vayfs.mongodb.net:27017,resource-projects-shard-00-01-vayfs.mongodb.net:27017,resource-projects-shard-00-02-vayfs.mongodb.net:27017/rp_prod_shadow?ssl=true&replicaSet=resource-projects-shard-0&authSource=admin',
        rootPath: rootPath,
        port: process.env.PORT || 80
    },
    ch_staging : {
        baseUrl: 'http://ch_dev.resourceprojects.org',
        //db: '@aws-us-east-1-portal.14.dblayer.com:10669/rp_dev?ssl=true',
        db: '@aws-us-east-1-portal.14.dblayer.com:10669,aws-us-east-1-portal.13.dblayer.com:10499/rp_ch_dev?ssl=true',
        rootPath: rootPath,
        port: process.env.PORT || 80
    }
};
