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

exports.deleteDuplicate = function(req, res) {
  Duplicate.remove({_id: req.params.id}, function(err) {
    if(!err) {
      res.send();
    }
    else {
      err = new Error('Error');
      return res.send({ reason: err.toString() });
    }
  });
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
  var id = req.params.id;
  var action = req.params.action;
  switch(action) {
    case 'setasalias':
    break;
    case 'setasnew':
    break;
    default:
    break;
  }

  //TODO do something depending on user choice in frontend

};
