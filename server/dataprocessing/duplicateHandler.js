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

findAndHandleCompanyDuplicates = function(fnCallback) {
  console.log("handling company duplicates");

  Company.find({}, function (err, result) {
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
  						var newDuplicate = makeNewDuplicate(originalCompany._id, company._id, company.action_id, "company", notes);
  						Duplicate.create(
  							newDuplicate,
  							function(err, dmodel) {
  								if (err) {

  								}

  							}
  						);
              console.log(originalCompany.company_name);
  					}
          }
        }
      }
      fnCallback(null, "finding company duplicates completed");
    }
  });
};

findAndHandleProjectDuplicates = function(fnCallback) {
  //TODO implent project duplicate search
  fnCallback(null, "finding project duplicates completed");
};

removeViceVersaDuplicates = function(fnCallback) {
  async.waterfall([
    getDuplicates
    //removePairs
  ], function(err, results) {
    if(err) {
      fnCallback(err);
    }
    else {
      fnCallback(null, "vice versa duplicates eliminated");
    }
  });

  function getDuplicates(callback) {
    Duplicate.find({})
    .exec(function(err, duplicates) {
      if(err) {
        callback(err);
      }
      else {
        callback(null, duplicates)
      }
    });
  };

  //not used, function is able to remove duplicates pairs, problem is handled when resolving
  function removePairs(duplicates, callback) {
    _.each(duplicates, function(duplicate) {
      Duplicate.remove({ original: duplicate.duplicate, duplicate: duplicate.original })
      .exec(function(err, removed) {
        if(removed) {
          console.log("duplicate removed");
          callback(null, removed);
        } else {
          callback(err);
        }
      });
    });
  };

};

makeNewDuplicate = function(original_id, duplicate_id, action_id, entity, notes) {

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

exports.findAndHandleDuplicates = function(fcallback) {
  async.series([
    findAndHandleCompanyDuplicates,
    findAndHandleProjectDuplicates,
    removeViceVersaDuplicates
  ], function(err, results) {
    if(!err) fcallback("ok");
    else fcallback(err, "not ok");
  });
};
