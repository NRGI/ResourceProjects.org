var	Company = require('mongoose').model('Company');
var Project	= require('mongoose').model('Project');
var Duplicate = require('mongoose').model('Duplicate');
var ObjectId = require('mongoose').Types.ObjectId;
var _ = require('underscore');
var async = require('async');
var moment = require('moment');
var request = require('superagent');
var fusejs = require('fuse.js');

var fuse_options_company = {
  keys: ["company_name"],
  threshold: 0.3
};

var fuse_options_project = {
  keys: ["proj_name"],
  threshold: 0.3
};

var actionId = null;

findCompanyDuplicates = function(fnCallback) {
  console.log("Searching for company duplicates...");
  var duplicate_count = 0;

  Company.find({})
  .populate('resolved_by')
  .populate('company_aliases')
  .exec(function (err, result) {
    if (err) {
      //handle errors
    }
    else {
      //clone result object
      var company_names = JSON.parse(JSON.stringify(result));
      for(var el of company_names ) {
        el.company_name = preprocessString(el.company_name);
      }
      for(company of result) {
        var fuse = new fusejs(company_names, fuse_options_company);
        var searchString = preprocessString(company.company_name);
        var searchResult = fuse.search(searchString);
        if (!searchResult || searchResult == []) {
        }
        else {
          var numberOfResults = searchResult.length-1;
          var notes = 'Found  ' + numberOfResults + ' potentially matching company name(s) for company ' + company.company_name + ' after import. Date: ' + moment(Date.now()).format('LLL');
          //console.log(notes);
          for (var originalCompany of searchResult) {

            if (originalCompany.company_name != searchString) {

              //check if searchstring is in aliases
              var aliases = _.pluck(originalCompany.company_aliases, 'alias')
              //if not in aliases then mark as duplicate
              if(!_.contains(aliases, searchString)) {
                duplicate_count++;
                var newDuplicate = makeNewDuplicate(originalCompany._id, company._id, "company", notes);

                Duplicate.create(
                  newDuplicate,
                  function(err, dmodel) {
                    if (err) {

                    }

                  }
                );
                //console.log(originalCompany.company_name);
              }
            }
          }
        }
      }
      console.log("Searching for company duplicates completed. " + duplicate_count + ' duplicates found.');
      fnCallback(null, duplicate_count + ' company duplicates found.');
    }
  });
};

findAndHandleProjectDuplicates = function(fnCallback) {
  //TODO implent project duplicate search
  fnCallback(null, "finding project duplicates completed");
};

makeNewDuplicate = function(original_id, duplicate_id, entity, notes) {

	var duplicate = {
		original: ObjectId(original_id),
		duplicate: ObjectId(duplicate_id),
		created_from: actionId,
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

exports.findAndHandleDuplicates = function(action_id, fcallback) {
  actionId = action_id;

  async.series([
    findCompanyDuplicates,
    //findAndHandleProjectDuplicates,
  ], function(err, results) {
    if(err) {
      fcallback(err);
    }
    else if(results) {
      fcallback(null, "ok");
    }
    else {
      fcallback(err, "not ok");
    }
  });
};
