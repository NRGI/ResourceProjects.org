'use strict';

var Duplicate = require('mongoose').model('Duplicate'),
Project = require('mongoose').model('Project'),
Company = require('mongoose').model('Company'),
Concession = require('mongoose').model('Concession'),
Site = require('mongoose').model('Site'),
Link = require('mongoose').model('Link'),
Transfer = require('mongoose').model('Transfer'),
Production = require('mongoose').model('Production'),
async = require('async'),
_ = require("underscore"),
moment = require('moment');

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

exports.getDuplicates = function(req, res) {

  var type = String(req.params.type);
  var limit = Number(req.params.limit);
  var skip = Number(req.params.skip);

  var entity, objType, aliases;

  switch(type) {
    case 'company':
    entity = 'company';
    objType = 'Company';
    break;
    case 'project':
    entity = 'project';
    objType = 'Project';
    break;
    default:
    res.send("entity type not found.");
    break;
  }

  if(entity) {
    async.waterfall([
      getDuplicateCount,
      getDuplicateData
    ], function(err, result) {
      if (err && !result) {
        res.send(err);
      }
      else {
        if (req.query && req.query.callback) {
          return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
        }
        else {
          return res.send(result);
        }
      }
    });
  }

  function getDuplicateCount(callback) {
    Duplicate.where({ entity: entity, resolved: false }).count(function(err, duplicate_count) {
      if(err) {
        callback(err);
      }
      else {
        if(!isNaN(duplicate_count) && duplicate_count > 0) {
          callback(null, duplicate_count);
        }
        else {
          callback("no unresolved duplicates found", { data: [], count: 0});
        }
      }
    });
  }

  function getDuplicateData(duplicate_count, callback) {
    Duplicate.find({ entity: entity, resolved: false })
    .populate('original', null, objType)
    .populate('duplicate', null, objType)
    .populate('resolved_by')
    .limit(limit)
    .skip(limit * skip)
    .exec(function(err, duplicates) {
      if(duplicates) {
        callback(null, { data: duplicates, count: duplicate_count });
      }
      else {
        //should never be called
        callback("no duplicates found");
      }
    });
  }

};

exports.resolveDuplicates = function(req, res) {
  var entity,alias, aliases;

  //var user_id = req.user._id;
  var duplicate_id = req.params.id;
  var action = req.params.action;

  async.waterfall([
    getEntity.bind(null, duplicate_id, action),
    getCompanyOrProject,
    addAliasToCompanyOrProject,
    resolveEntity
  ], function (err, result) {
    if (err) {
      res.send(err);
    }
    else {
      res.send(result);
    }
  });

  function getEntity(id, action, callback) {
    Duplicate.findOne({_id: id, resolved: false}, function (err, result) {
      if (err) {
        callback(err);
      }
      else if (result && result.entity) {

        callback(null, result, action);
      }
      else {
        callback("no duplicate found with id " + id);
      }
    });
  };
  function getCompanyOrProject(result, action, callback) {
    if(action=='setasalias') {
      switch (result.entity) {
        case 'company':
          Company.findOne({_id: result.duplicate}, function (err, company) {
            alias = {
              alias: company.company_name,
              model: 'company',
              source: company.company_established_source
            };
            callback(null, result, action, alias);
          })
          break;
        case 'project':
          Project.findOne({_id: result.duplicate}, function (err, project) {
            alias = {
              alias: project.proj_name,
              model: 'company',
              source: project.proj_established_source
            };
            callback(null, result, action, alias);
          })
          break;
        default:
          break;
      }
    }else{
      callback(null, result, action, '');
    }
  };
  function addAliasToCompanyOrProject(result, action,aliases, callback) {
    if(action=='setasalias') {
      switch (result.entity) {
        case 'company':
          Company.findById(result.original)
              .populate('original')
              .exec(function (err, company) {
                if (err) {
                  callback(err);
                }
                else if (company) {
                  console.log("pushing alias to company id " + company._id);
                  company.company_aliases.push(aliases);
                  company.save(function (err) {
                  });
                  callback(null, result, action);
                }
                else {
                  callback(err);
                }
              });
              break;
        case 'project':
          Project.findById(result.original)
              .populate('original')
              .exec(function (err, project) {
                if (err) {
                  callback(err);
                }
                else if (project) {
                  console.log("pushing alias to project id " + project._id);
                  project.proj_aliases.push(aliases);
                  project.save(function (err) {
                  });
                  callback(null, result, action);
                }
                else {
                  callback(err);
                }
              });
          break;
        default:
          break;
      }
    } else {
      callback(null, result, action);
    }
  };

  function resolveEntity(obj, action, callback) {

    // currently three action types are allowed: setasalias, resolve, update
    switch (action) {

      case 'setasalias':
        switch (obj.entity) {

          // HANDLE COMPANY DUPLICATES
          case 'company':
            async.parallel([
              updateAll.bind(null, Link, obj.duplicate, obj.original),
              updateAll.bind(null, Transfer, obj.duplicate, obj.original),
              updateAllCompanyFacts.bind(null, obj.duplicate, obj.original)
            ], function (err, results) {
              if (err) {
                console.log("updating all entities. ERROR: " + err);
                callback(err);
              }
              else if (results) {
                Company.findOneAndRemove({_id: obj.duplicate}, function (err, company_to_remove) {
                  console.log("looking for duplicate company with id " + obj.duplicate);
                  if (err) {
                    callback(err);
                  }
                  else if (company_to_remove) {
                    console.log("updating all entities. DONE.")
                    console.log('setting resolved flag to id ' + obj._id + '.');
                    Duplicate.find( {$or:[ {'original':obj.duplicate}, {'duplicate':obj.duplicate}]}, function (err, result) {
                      if (err) {
                        console.log('setting resolved flag to id ' + obj._id + '. ERROR: ' + err);
                        callback(err);
                      }
                      else {
                        _.each(result, function (duplicate) {
                          duplicate.resolved = true;
                          duplicate.resolved_date = Date.now();
                          duplicate.save(function (err) {

                          })
                        });
                        console.log('setting resolved flag to id ' + obj._id + '. DONE.');
                        callback(null, 'company duplicate with id ' + obj._id + ' resolved, all associated links and facts updated');
                      }
                    });
                  }
                })
              }
            })
            break;

          // HANDLE PROJECT DUPLICATES
          case 'project':
            //update links, transfers and facts
            console.log("updating all project relevant entities.")
            async.parallel([
              updateAll.bind(null, Link, project_to_remove._id, obj.original._id),
              updateAll.bind(null, Transfer, project_to_remove._id, obj.original._id),
              updateAll.bind(null, Production, project_to_remove._id, obj.original._id)
              //updateAllProjectFacts.bind(null, project_to_remove._id, obj.original._id)
            ], function (err, results) {
              if (err) {
                console.log("updating all project relevant entities. ERROR: " + err);
                callback(err);
              }
              else if (results) {
                console.log("updating all project relevant entities. DONE.")
                console.log('setting resolved flag to id ' + obj._id + '.');
                Project.findOneAndRemove({_id: obj.duplicate}, function (err, project_to_remove) {
                  console.log("looking for duplicate project with id " + obj.duplicate);
                  if (err) {
                    callback(err);
                  }
                  else if (project_to_remove) {
                    console.log("updating all entities. DONE.")
                    console.log('setting resolved flag to id ' + obj._id + '.');
                    Duplicate.find( {$or:[ {'original':obj.duplicate}, {'duplicate':obj.duplicate}]}, function (err, result) {
                      if (err) {
                        console.log('setting resolved flag to id ' + obj._id + '. ERROR: ' + err);
                        callback(err);
                      }
                      else {
                        _.each(result, function (duplicate) {
                          duplicate.resolved = true;
                          duplicate.resolved_date = Date.now();
                          duplicate.save(function (err) {

                          })
                        });
                        console.log('setting resolved flag to id ' + obj._id + '. DONE.');
                        callback(null, 'project duplicate with id ' + obj._id + ' resolved, all associated links and facts updated');
                      }
                    });
                  }
                })
              }
              else {
                console.log("updating all entities. ERROR: " + err);
                callback(err);
              }
            });
            break;

          default:
            // no actions here
            break;
        }
        callback(null, "duplicate, alias set");
        break;

      case 'resolve':
        Duplicate.find({'duplicate': obj.duplicate}, function (err, result) {
          if (err) {
            callback(err);
          }
          else {
            _.each(result, function (duplicate) {
              duplicate.resolved = true;
              duplicate.resolved_date = Date.now();
              duplicate.save(function (err) {

              })
            })
            callback(null, 'company duplicate with id ' + obj._id + ' resolved, just deleted');
          }
        });
        break;

      case 'update':
        console.log("updating document with duplicate information");
        console.log("removing duplicate object.");
        var entity;
        switch (obj.entity) {
          case 'project':
            entity = Project;
            break;
          case 'company':
            entity = Company;
            break;
          default:
            callback("entity type not found");
            break;
        }
        entity.findOneAndRemove({_id: obj.duplicate}, function (err, entity_to_remove) {
          if (err) {
            console.log("removing duplicate object. ERROR: " + err);
            callback(err);
          }
          else if (entity_to_remove) {
            console.log("removing duplicate object. DONE.");

            //do not overwrite object id
            delete entity_to_remove._id;
            console.log("updating original object with id " + obj._id + ".");
            console.log(entity_to_remove);
            entity.findByIdAndUpdate(obj.original, entity_to_remove, function (err, doc) {
              if (err) {
                console.log("updating original object with id " + obj._id + ". ERROR: " + err);
                callback(err);
              }
              else if (doc) {
                console.log("updating original object with id " + obj._id + ". DONE.");
                console.log("setting resolved flag to id " + obj._id + ".");
                Duplicate.findByIdAndUpdate(obj._id, {
                  resolved: true,
                  resolved_date: Date.now()
                }, function (err, result) {
                  if (err) {
                    console.log("setting resolved flag to id " + obj._id + ". ERROR: " + err);
                    callback(err);
                  }
                  else {
                    console.log("setting resolved flag to id " + obj._id + ". DONE.");
                    callback(null, "entity updated with information");
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

      default:
        // do nothing here
        callback("no valid action chosen, please chose from [setasalias, resolve, update]");
        break;
    }
  };

  function updateAll(entity, old_company_id, new_company_id, callback) {
    console.log("updating entity information (old: " + old_company_id + ", new: " + new_company_id + ")");
    async.waterfall([
      find.bind(null, entity, old_company_id, new_company_id),
      update
    ], function (err, results) {
      if (err) {
        console.log("updating entity information (old: " + old_company_id + ", new: " + new_company_id + "). ERROR: " + err);
        callback(err);
      }
      else if (results) {
        console.log("updating entity information (old: " + old_company_id + ", new: " + new_company_id + "). DONE.");
        callback(null, "links updated");
      }
      else {
        console.log("updating entity information (old: " + old_company_id + ", new: " + new_company_id + "). ERROR: " + err);
        callback(err);
      }
      ;
    });
  };

  function find(entity, old_company_id, new_company_id, callback) {
    console.log('looking for entity information with id ' + old_company_id + '.');
    entity.find({company: old_company_id}, function (err, results) {
      if (err) {
        console.log('looking for entity information with id ' + old_company_id + '. ERROR: ' + err);
        callback(err);
      }
      else if (results) {
        console.log('looking for entity information with id ' + old_company_id + '. DONE.');
        callback(null, entity, new_company_id, results);
      }
      else {
        console.log('looking for entity information with id ' + old_company_id + '. ERROR: ' + err);
        callback(err);
      }
    });
  };

  function update(entity, new_company_id, listOfEntityIds, callback) {
    console.log('updating entity information.');
    if (listOfEntityIds) {
      console.log("updating " + listOfEntityIds.length + " documents.");
      if (listOfEntityIds == 0) {
        callback(null, "no need to update any element.");
      }
      else {
        async.each(listOfEntityIds, function (entity_id, callback) {
          entity.findByIdAndUpdate(entity_id, {company: new_company_id}, function (err, results) {
            if (err) {
              console.log('updating entity information. ERROR: ' + err);
              callback(err);
            }
            else if (results) {
              console.log('updating entity information. DONE.');
              callback(null, 'link with id ' + entity_id + ' updated successfully');
            }
            else {
              console.log('updating entity information. ERROR: ' + err);
              callback(err);
            }
          });
        });
      }
    }
  };

  function updateAllCompanyFacts(old_company_id, new_company_id, callback) {
    async.parallel([
      update_concession_operated_by.bind(null, old_company_id, new_company_id),
      update_concession_company_share.bind(null, old_company_id, new_company_id),
      update_site_operated_by.bind(null, old_company_id, new_company_id),
      update_site_company_share.bind(null, old_company_id, new_company_id),
    ], function (err, results) {
      if (err) {
        callback(err);
      }
      else if (results) {
        callback(null, 'all facts linked to new company id ' + new_company_id);
      }
      else {
        callback(err);
      }
    });
  }
};

exports.test = function(req, res) {
  //testing area
}

/* somehow useful to do future implementation with update definition object
var listOfFields = [];
listOfFields[0] = { entity: Concession, doc: 'concession', fieldsToUpdate: ['concession_operated_by', 'concession_company_share']};
listOfFields[1] = { entity: Site, doc: 'site', fieldsToUpdate: ['site_operated_by', 'site_company_share']};
*/

function update_concession_operated_by(old_company_id, new_company_id, callback) {
  Concession.find({ 'concession_operated_by.company' : old_company_id })
  .populate('concession_operated_by')
  .exec(function(err, results) {
    if(err) {
      callback(err);
    }
    else if(results) {
      async.each(results, function(item, fcallback) {
        for(var index in item.concession_operated_by.company) {
          Concession.update(
            { _id: item._id, 'concession_operated_by.company': item.concession_operated_by.company[index].company },
            { "$set": { "concession_operated_by.company.$.company": new_company_id }},
            function(err, result) {
              if(err) {
                fcallback(err);
              }
              else if(result) {
                fcallback(null, "updated");
              }
              else {
                fcallback(err);
              }
            }
          );
        }
      }, function(err) {
        callback(err);
      });
    }
    else callback(null, 'nothing to update');
  });
}

function update_concession_company_share(old_company_id, new_company_id, callback) {
  Concession.find({ 'concession_company_share.company' : old_company_id })
  .populate('concession_company_share')
  .exec(function(err, results) {
    if(err) {
      callback(err);
    }
    else if(results) {
      async.each(results, function(item, fcallback) {
        for(var index in item.concession_operated_by.company) {
          Concession.update(
            { _id: item._id, 'concession_company_share.company': item.concession_operated_by.company[index].company },
            { "$set": { "concession_company_share.company.$.company": new_company_id }},
            function(err, result) {
              if(err) {
                fcallback(err);
              }
              else if(result) {
                fcallback(null, "updated");
              }
              else {
                fcallback(err);
              }
            }
          );
        }
      }, function(err) {
        callback(err);
      });
    }
    else callback(null, 'nothing to update');
  });
}

function update_site_operated_by(old_company_id, new_company_id, callback) {
  Site.find({ 'site_operated_by.company' : old_company_id })
  .populate('site_operated_by')
  .exec(function(err, results) {
    if(err) {
      callback(err);
    }
    else if(results) {
      async.each(results, function(item, fcallback) {
        for(var index in item.concession_operated_by.company) {
          Site.update(
            { _id: item._id, 'site_operated_by.company': item.concession_operated_by.company[index].company },
            { "$set": { "site_operated_by.company.$.company": new_company_id }},
            function(err, result) {
              if(err) {
                fcallback(err);
              }
              else if(result) {
                fcallback(null, "updated");
              }
              else {
                fcallback(err);
              }
            }
          );
        }
      }, function(err) {
        callback(err);
      });
    }
    else callback(null, 'nothing to update');
  });
}

function update_site_company_share(old_company_id, new_company_id, callback) {
  Site.find({ 'site_company_share.company' : old_company_id })
  .populate('site_company_share')
  .exec(function(err, results) {
    if(err) {
      callback(err);
    }
    else if(results) {
      async.each(results, function(item, fcallback) {
        for(var index in item.concession_operated_by.company) {
          Site.update(
            { _id: item._id, 'site_company_share.company': item.concession_operated_by.company[index].company },
            { "$set": { "site_company_share.company.$.company": new_company_id }},
            function(err, result) {
              if(err) {
                fcallback(err);
              }
              else if(result) {
                fcallback(null, "updated");
              }
              else {
                fcallback(err);
              }
            }
          );
        }
      }, function(err) {
        callback(err);
      });
    }
    else callback(null, 'nothing to update');
  });
}

/* TODO implement this as soon as papertrail code is implemented
exports.getDuplicatesAfterLastUpdate = function(req, res) {

};

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

};*/

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
