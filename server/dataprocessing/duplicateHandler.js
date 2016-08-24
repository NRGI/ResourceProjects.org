var	Company = require('mongoose').model('Company');
var Project	= require('mongoose').model('Project');
var Duplicate = require('mongoose').model('Duplicate');
var ImportSource = require('mongoose').model('ImportSource');
var ObjectId = require('mongoose').Types.ObjectId;
var _ = require('underscore');
var async = require('async');
var moment = require('moment');
var fusejs = require('fuse.js');

var fuse_options_company = {
  keys: ["company_name"],
  threshold: 0.3
};

var fuse_options_project = {
  keys: ["proj_name"],
  threshold: 0.1
};

findCompanyDuplicates = function(action_id, fnCallback) {

  //action_id = "57b19582144b58bc3888e9f8";

  console.log("Searching for company duplicates created with action id " + action_id + ".");
  var duplicate_count = 0;

  Company.find({})
  .populate('resolved_by')
  .populate('company_aliases')
  .exec(function (err, all_companies) {
    if (err) {
      fnCallback(err);
    }
    else if(all_companies) {
      for(var company of all_companies) {
        company.company_name = preprocessString(company.company_name);
      }
      var fuse = new fusejs(all_companies, fuse_options_company);

      ImportSource.find({ actions: action_id, entity: 'company' })
      .populate('obj', null, 'Company')
      .exec(function(err, new_companies) {
        if(err) {
          fnCallback(err);
        }
        else if(new_companies) {
          for(new_company of new_companies) {
            var searchString = preprocessString(new_company.obj.company_name);
            var searchResult = fuse.search(searchString);
            if (!searchResult || searchResult == []) {
            }
            else {
              var numberOfResults = searchResult.length-1;
              var notes = 'Found  ' + numberOfResults + ' potentially matching company name(s) for company ' + new_company.obj.company_name + ' after import. Date: ' + moment(Date.now()).format('LLL');
              //console.log(notes);
              for (var originalCompany of searchResult) {

                if (originalCompany.company_name != searchString) {

                  //check if searchstring is in aliases
                  var aliases = _.pluck(originalCompany.company_aliases, 'alias')
                  //if not in aliases then mark as duplicate
                  if(!_.contains(aliases, searchString)) {
                    duplicate_count++;
                    var newDuplicate = makeNewDuplicate(action_id, originalCompany._id, new_company.obj._id, "company", notes);
                    Duplicate.create(newDuplicate, null);
                  }
                }
              }
            }
          }
        }
        console.log("Searching for company duplicates completed. " + duplicate_count + ' duplicate(s) found.');
        fnCallback(null, duplicate_count + ' company duplicate(s) found.');
      });
    }
    else {
      fnCallback(err);
    }
  });
};

findProjectDuplicates = function(action_id, fnCallback) {

  console.log("Searching for project duplicates created with action id " + action_id + ".");
  var duplicate_count = 0;

  Project.find({})
  .populate('resolved_by')
  .populate('project_aliases')
  .exec(function (err, all_projects) {
    if (err) {
      fnCallback(err);
    }
    else if(all_projects) {
      for(var project of all_projects) {
        project.proj_name = preprocessString(project.proj_name);
      }
      var fuse = new fusejs(all_projects, fuse_options_project);

      ImportSource.find({ actions: action_id, entity: 'project' })
      .populate('obj', null, 'Project')
      .exec(function(err, new_projects) {
        if(err) {
          fnCallback(err);
        }
        else if(new_projects) {
          for(new_project of new_projects) {
            var searchString = preprocessString(new_project.obj.proj_name);
            var searchResult = fuse.search(searchString);
            if (!searchResult || searchResult == []) {
            }
            else {
              var numberOfResults = searchResult.length-1;
              var notes = 'Found  ' + numberOfResults + ' potentially matching project name(s) for project ' + new_project.obj.proj_name + ' after import. Date: ' + moment(Date.now()).format('LLL');
              //console.log(notes);
              for (var originalProject of searchResult) {

                if (originalProject.proj_name != searchString) {

                  //check if searchstring is in aliases
                  var aliases = _.pluck(originalProject.proj_aliases, 'alias')
                  //if not in aliases then mark as duplicate
                  if(!_.contains(aliases, searchString)) {
                    duplicate_count++;
                    var newDuplicate = makeNewDuplicate(action_id, originalProject._id, new_project._id, "project", notes);
                    Duplicate.create(newDuplicate, null);
                  }
                }
              }
            }
          }
        }
        console.log("Searching for project duplicates completed. " + duplicate_count + ' duplicate(s) found.');
        fnCallback(null, duplicate_count + ' project duplicate(s) found.');
      });
    }
    else {
      fnCallback(err);
    }
  });
};

makeNewDuplicate = function(action_id, original_id, duplicate_id, entity, notes) {

	var duplicate = {
		original: ObjectId(original_id),
		duplicate: ObjectId(duplicate_id),
		created_from: action_id,
		entity: entity,
		resolved: false,
		notes: notes
		// TODO: user
		// resolved_by: user_id,
	};

	return duplicate;
};

preprocessString = function(str) {

  var result;

  //remove all special characters
  result = str.replace(/[^a-zA-Z ]/g, "");
  //remove unnecessary white spaces
  result = result.replace(/\s\s+/g, ' ');

  return result;

};

exports.findAndHandleDuplicates = function(action_id, callback) {

  async.series([
    findCompanyDuplicates.bind(null, action_id),
    findProjectDuplicates.bind(null, action_id)
  ], function(err, results) {
    if(err) {
      callback(err);
    }
    else if(results) {
      console.log("Searching for duplicates completed successfully.");
      callback(null, "duplicate identification successful");
    }
    else {
      callback(err);
    }
  });

};
