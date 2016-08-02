'use strict';

var Duplicate = require('mongoose').model('Duplicate'),
Project = require('mongoose').model('Project'),
Company = require('mongoose').model('Company'),
async = require('async'),
_ = require("underscore"),
request = require('request'),
moment = require('moment');

exports.getDuplicates = function(req, res) {
  async.parallel([
    getCompanyDuplicates,
    getProjectDuplicates
  ], function (err, result) {
    if (err) {
      res.send(err);
    } else {
      if (req.query && req.query.callback) {
        return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
      } else {
        return res.send(result);
      }
    }
  });

  function getCompanyDuplicates(callback) {
    Duplicate.find({ entity: 'company', resolved: false })
    .populate('original', null, 'Company')
    .populate('duplicate', null, 'Company')
    .populate('resolved_by')
    .exec(function(err, duplicate) {
      if(duplicate) {
        callback(null, duplicate);
      } else {
        callback(err);
      }
    });
  }

  function getProjectDuplicates(callback) {
    Duplicate.find({ entity: 'project', resolved: false })
    .populate('original', null, 'Project')
    .populate('duplicate', null, 'Project')
    .populate('resolved_by')
    .exec(function(err, duplicate) {
      if(duplicate) {
        callback(null, duplicate);
      } else {
        callback(err);
      }
    });
  }
};

exports.getDuplicateByID = function(req, res) {

  async.waterfall([
    getDuplicate
  ], function (err, result) {
    if (err) {
      res.send(err);
    } else {
      if (req.query && req.query.callback) {
        return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
      } else {
        return res.send(result);
      }
    }
  });

  function getDuplicate(callback) {
    Duplicate.findOne({ _id: req.params.id })
    .lean()
    .exec(function(err, duplicate) {
      if(duplicate) {
        callback(null, duplicate);
      } else {
        callback(err);
      }
    });
  }
};

/* TODO implement this as soon as papertrail code is implemented
exports.getDuplicatesAfterLastUpdate = function(req, res) {

};
*/

exports.getDuplicatesCreatedAfterDate = function(req, res) {

  console.log(req.params.date);

  var last_update = moment(req.params.date);

  Duplicate.find({ created_date: { $gte: last_update.toDate() } }, function(err) {
    if(!err) {
      res.send();
    }
    else {
      err = new Error('Error');
      return res.send({ reason: err.toString() });
    }
  });

};

exports.resolveDuplicates = function(req, res) {
  //var user_id = req.user._id;
  var duplicate_id = req.params.id;
  var entity_type;
  async.waterfall([
    getEntity.bind(null, duplicate_id, req.params.action),
    resolveEntity
  ], function(err, result) {
    if(err) {
      res.send(err);
    }
    else {
      res.send(result);
    }
  });

  function resolveEntity(obj, action, callback) {

    switch(action) {
      case 'setasalias':
      switch(obj.entity) {
        case 'company':
        // get duplicate object
        Company.findOneAndRemove({ _id: obj.duplicate}, function (err, company_to_remove) {
          if(err) {
            callback(err);
          }
          else if(company_to_remove) {
            var alias = makeNewAlias(company_to_remove.company_name, 'company', company_to_remove.company_established_source);
            Company.findById(obj.original, function(err, company) {
              if(err) {
                callback(err);
              }
              else if(company){
                company.company_aliases.push(alias);
                company.save(function(err){
                  if(err) {
                    callback(err);
                  }
                  else {
                    Duplicate.findByIdAndUpdate(obj._id, { resolved: true, resolved_date: Date.now() }, function(err, result) {
                      if(err) {
                        callback(err);
                      }
                      else {
                        callback(null, "added alias");
                      }
                    });
                  }
                });
              }
              else {
                callback(err);
              }
            });
          }
          else {
            callback(err);
          }
        });

        break;

        case 'project':
        //TODO
        break;

        default:
        break;
      }
      callback(null, "duplicate, alias set");
      break;

      case 'resolve':
      Duplicate.findByIdAndUpdate(obj._id, { resolved: true, resolved_date: Date.now() }, function(err, result) {
        if(err) {
          callback(err);
        }
        else {
          callback(null, "no duplicate, resolved");
        }
      });
      break;
      default:
      // do nothing here
      callback("no valid action chosen");
      break;
    }
  };

  function getEntity(id, action, callback) {
    Duplicate.findOne({ _id: id })
    .lean()
    .exec(function(err, result) {
        if(err) {
          callback(err);
        }
        else {
          callback(null, result, action);
        }
    });
  };

  function makeNewAlias(name, entity, source) {

  	var alias = {
  		alias: name,
      model: entity,
      source: source
  	};

  	return alias;
  };

};
