var Source = require('mongoose').model('Source'),
    Country = require('mongoose').model('Country'),
    Commodity = require('mongoose').model('Commodity'),
    CompanyGroup = require('mongoose').model('CompanyGroup'),
    Company = require('mongoose').model('Company'),
    Project = require('mongoose').model('Project'),
    Site = require('mongoose').model('Site'),
    Link = require('mongoose').model('Link'),
    Contract = require('mongoose').model('Contract'),
    Concession = require('mongoose').model('Concession'),
    Production = require('mongoose').model('Production'),
    Transfer = require('mongoose').model('Transfer'),
    ImportSource    = require('mongoose').model('ImportSource');
var async = require('async');

exports.unloadActionData = function(action_id, callback) {
    async.series(
        [
            function(wcallback) { //Get list of things to delete
                ImportSource.find(
                    {$in: {actions: action_id}},
                    function (err, importSources) {
                        if (err) return wcallback(err);
                        var importSource;
                        for (importSource of importSources) {
                            switch(importSource.entity) {
                              default:
                                console.log(importSource.obj._id); //TODO
                            }
                        }
                        return wcallback(null);
                    }
                );
            }
        ],
        function(err) {
            if (!err) callback(null, "ok");
            else callback(err, "not ok");
        }
    );
};
