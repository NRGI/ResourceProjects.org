var Source = require('mongoose').model('Source'),
    CompanyGroup = require('mongoose').model('CompanyGroup'),
    Company = require('mongoose').model('Company'),
    Project = require('mongoose').model('Project'),
    Site = require('mongoose').model('Site'),
    Link = require('mongoose').model('Link'),
    Contract = require('mongoose').model('Contract'),
    Concession = require('mongoose').model('Concession'),
    Production = require('mongoose').model('Production'),
    Transfer = require('mongoose').model('Transfer'),
    Duplicate    = require('mongoose').model('Duplicate'),
    ImportSource    = require('mongoose').model('ImportSource');
var async = require('async');

var map = {
    "company": Company,
    "company_group": CompanyGroup,
    "concession": Concession,
    "contract": Contract,
    "project": Project,
    "production": Production,
    "site": Site,
    "transfer": Transfer,
    "source": Source,
    "link": Link
};

exports.unloadActionData = function(action_id, callback) {
    var report = "";
    ImportSource.find(
                    {actions: action_id},
                    function (err, importSources) {
                        if (err) {
                            report += "Couldn't query ImportSources: " + err.toString();
                            return callback(err, "Failed", report);
                        }
                        async.eachSeries(importSources,
                            function(importSource, scallback) {
                            var model = map[importSource.entity];
                            if (model) {
                                model.findByIdAndRemove(importSource.obj, function(err) {
                                    if (err) scallback(err);
                                    else {
                                        //Remove any duplicates Duplicate.find(
                                        Duplicate.remove({created_from: action_id}, function (err) {
                                            if (err) return scallback(err);
                                            if (importSource.actions.length > 1) {
                                                for (var j=0; j<importSource.actions.length; j++) {
                                                    if (importSource.actions[j] == action_id) {
                                                        importSource.actions = importSource.actions.splice(j, 1); //Remove one item at pos j
                                                    }
                                                }
                                                if (importSource.__v) delete importSource.__v; //Don't send __v back in to Mongo: https://github.com/Automattic/mongoose/issues/1933
                                                var theId = importSource._id;
                                                delete importSource._id; //Don't make Mongo try to update the _id
                                                ImportSource.findByIdAndUpdate(
                                                    theId,
                                                    importSource,
                                                    {},
                                                    function (err) {
                                                        if (err) scallback(err);
                                                        else {
                                                            report += "Removed a " + importSource.entity + " with id " + importSource.obj + " and modified the record of its import from this import\n";
                                                            scallback(null);
                                                        }
                                                    }
                                                );
                                            }
                                            else {
                                                ImportSource.findByIdAndRemove(importSource._id, function (err) {
                                                    if (err) scallback(err);
                                                    else {
                                                        report += "Removed a " + importSource.entity + " with id " + importSource.obj + " and the record of its import\n";
                                                        scallback(null);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                            else return scallback("Invalid entity in Import Source: " + importSource.entity);
                        },
                        function (err) {
                            if (err) {
                                        report += "Encountered an error " + err.toString() + "\n";
                                        return callback(err, "Failed", report);
                                    }
                                    else {
                                       callback(null, "Success", report);
                                    }
                        });
                    }
                );
};
