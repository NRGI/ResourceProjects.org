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
          if(err) {
            callback(err);
          }
          else if(company) {
            alias = {
              alias: company.company_name,
              model: 'company',
              source: company.company_established_source
            };
            callback(null, result, action, alias);
          }
          else {
            callback(err);
          }
        });
        break;

        case 'project':
        Project.findOne({_id: result.duplicate}, function (err, project) {
          if(err) {
            callback(err);
          }
          else if(project) {
            alias = {
              alias: project.proj_name,
              model: 'project',
              source: project.proj_established_source
            };
            callback(null, result, action, alias);
          }
          else {
            callback(err);
          }
        });
        break;

        default:
          break;
      }
    }
    else {
      callback(null, result, action, '');
    }
  };

  function addAliasToCompanyOrProject(result, action, aliases, callback) {

    if(action=='setasalias') {

      switch (result.entity) {

        case 'company':
        Company.findById(result.original)
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
    }
    else {
      callback(null, result, action);
    }
  };

  function resolveEntity(obj, action, callback) {

    // currently three action types are allowed: setasalias, resolve, update
    switch (action) {

      case 'setasalias':
        console.log("== reconcile - setasalias");
        if(obj.entity=='company') {
          // HANDLE COMPANY DUPLICATES
          async.series([
            updateAll.bind(null, Link, obj.duplicate, obj.original, obj.entity),
            updateAll.bind(null, Transfer, obj.duplicate, obj.original, obj.entity),
            updateAllCompanyFacts.bind(null, obj.duplicate, obj.original)
          ], function (err, results) {
            if (err) {
              console.log("updating companies. ERROR: " + err);
              callback(err);
            }
            else if (results) {
              Company.findOneAndRemove({_id: obj.duplicate}, function (err, company_to_remove) {
                console.log("looking for duplicate company with id " + obj.duplicate);
                if (err) {
                  callback(err);
                }
                else if (company_to_remove) {
                  console.log("updating companies. DONE.")
                  console.log('setting resolved flag to id ' + obj._id + '.');

                  //TODO search for duplicate id, could be the company name instead
                  Duplicate.find({$or: [{'original': obj.duplicate}, {'duplicate': obj.duplicate}]}, function (err, result) {
                    if (err) {
                      console.log('setting resolved flag to duplicate object with id ' + obj._id + '. ERROR: ' + err);
                      callback(err);
                    }
                    else {
                      _.each(result, function (duplicate) {
                        duplicate.resolved = true;
                        duplicate.resolved_date = Date.now();
                        duplicate.save(function (err) {
                        })
                      });

                      console.log('setting resolved flag to duplicate object with id ' + obj._id + '. DONE.');
                      callback(null, 'company duplicate with id ' + obj._id + ' resolved, all associated links and facts updated');
                    }
                  });
                }
              })
            }
            else {
              console.log("updating companies. ERROR: " + err);
              callback(err);
            }
          })
        }

        if(obj.entity=='project') {
          // HANDLE PROJECT DUPLICATES
          //update links, transfers and facts
          console.log("updating all projects.")
          async.series([
            updateAll.bind(null, Link, obj.duplicate, obj.original._id, obj.entity),
            updateAll.bind(null, Transfer, obj.duplicate, obj.original._id, obj.entity),
            updateAll.bind(null, Production, obj.duplicate, obj.original._id, obj.entity)
            //updateAllProjectFacts.bind(null, obj.duplicate, obj.original._id)
          ], function (err, results) {
            if (err) {
              console.log("updating projects. ERROR: " + err);
              callback(err);
            }
            else if (results) {
                Project.findOneAndRemove({_id: obj.duplicate}, function (err, project_to_remove) {
                console.log("looking for duplicate project with id " + obj.duplicate);
                if (err) {
                  callback(err);
                }
                else if (project_to_remove) {
                  console.log("updating projects. DONE.")
                  console.log('setting resolved flag to duplicate object with id ' + obj._id);
                  Duplicate.find({$or: [{'original': obj.duplicate}, {'duplicate': obj.duplicate}]}, function (err, result) {
                    if (err) {
                      console.log('setting resolved flag to duplicate object with id ' + obj._id + '. ERROR: ' + err);
                      callback(err);
                    }
                    else {
                      _.each(result, function (duplicate) {
                        duplicate.resolved = true;
                        duplicate.resolved_date = Date.now();
                        duplicate.save(function (err) {
                        })
                      });
                      console.log('setting resolved flag to duplicate object with id ' + obj._id + '. DONE.');
                      callback(null, 'project duplicate with id ' + obj._id + ' resolved, all associated links and facts updated');
                    }
                  });
                }
              })
            }
            else {
              console.log("updating projects. ERROR: " + err);
              callback(err);
            }
          });
        }
        break;

      case 'resolve':
        console.log("== reconcile - resolve");
        Duplicate.find({'_id': obj._id}, function (err, result) {
          if (err) {
            callback(err);
          }
          else if(result) {
            _.each(result, function (duplicate) {
              duplicate.resolved = true;
              duplicate.resolved_date = Date.now();
              duplicate.save(function (err) {
              });
            });
            callback(null, 'company duplicate with id ' + obj._id + ' resolved, just deleted');
          }
          else {
            callback(err);
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

  function updateAll(entity, old_company_id, new_company_id, object_entity, callback) {
    console.log("updating entity information (old: " + old_company_id + ", new: " + new_company_id + ")");
    async.waterfall([
      find.bind(null, entity, old_company_id, new_company_id, object_entity),
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

  function find(entity, old_id, new_id, object_entity, callback) {
    console.log('looking for ' + object_entity + ' information with id ' + old_id + '.');
    if(object_entity == 'company') {
      entity.find({ company: old_id }, function (err, results) {
        if (err) {
          console.log('looking for ' + object_entity + ' information with id ' + old_id + '. ERROR: ' + err);
          callback(err);
        }
        else if (results) {
          console.log('looking for ' + object_entity + ' information with id ' + old_id + '. DONE.');
          callback(null, entity, new_id, results, object_entity);
        }
        else {
          console.log('looking for ' + object_entity + ' information with id ' + old_id + '. ERROR: ' + err);
          callback(err);
        }
      });
    }
    if(object_entity == 'project') {
      entity.find({ project: old_id }, function (err, results) {
        if (err) {
          console.log('looking for project information with id ' + old_id + '. ERROR: ' + err);
          callback(err);
        }
        else if (results) {
          console.log('looking for project information with id ' + old_id + '. DONE.');
          callback(null, entity, new_id, results, object_entity);
        }
        else {
          console.log('looking for project information with id ' + old_id + '. ERROR: ' + err);
          callback(err);
        }
      });
    }
  };

  function update(entity, new_id, listOfEntityIds, object_entity, callback) {
    if (listOfEntityIds) {
      console.log('updating ' + object_entity + ' information. ' + listOfEntityIds.length + ' documents.');
      if (listOfEntityIds.length == 0) {
        console.log('updating ' + object_entity + ' information. ' + listOfEntityIds.length + ' documents. DONE.');
        callback(null, "no need to update any element.");
      }
      else {
        async.each(listOfEntityIds, function (entity_id, callback) {
          if(object_entity == 'company') {
            entity.findByIdAndUpdate(entity_id, { company: new_id }, function (err, results) {
              if (err) {
                callback(err);
              }
              else if (results) {
                callback(null, object_entity + ' link with id ' + entity_id + ' updated successfully');
              }
              else {
                callback(err);
              }
            });
          }
          if(object_entity == 'project') {
            entity.findByIdAndUpdate(entity_id, { project: new_id }, function (err, results) {
              if (err) {
                callback(err);
              }
              else if (results) {
                callback(null, object_entity + ' link with id ' + entity_id + ' updated successfully');
              }
              else {
                callback(err);
              }
            });
          }
        }, function(err) {
          if(err) {
            console.log('updating ' + object_entity + ' information. ' + listOfEntityIds.length + ' documents. ERROR: ' + err);
            callback(err);
          }
          else {
            console.log('updating ' + object_entity + ' information. ' + listOfEntityIds.length + ' documents. DONE.');
            callback(null, 'updating ' + object_entity + ' information. ' + listOfEntityIds.length + ' documents. DONE.');
          }
        });
      }
    }
  };

  // TODO somehow useful to do future implementation with update definition objects
  /*
  var listOfFields = [];
  listOfFields[0] = { entity: Concession, doc: 'concession', fieldsToUpdate: ['concession_operated_by', 'concession_company_share']};
  listOfFields[1] = { entity: Site, doc: 'site', fieldsToUpdate: ['site_operated_by', 'site_company_share']};
  */
  function updateAllCompanyFacts(old_company_id, new_company_id, callback) {
    async.series([
      update_concession_operated_by.bind(null, old_company_id, new_company_id),
      update_concession_company_share.bind(null, old_company_id, new_company_id),
      update_site_operated_by.bind(null, old_company_id, new_company_id),
      update_site_company_share.bind(null, old_company_id, new_company_id)
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

function update_concession_operated_by(old_company_id, new_company_id, callback) {
  console.log("updating field 'concession_operated_by'");
  Concession.find({ 'concession_operated_by.company' : old_company_id })
  .exec(function(err, results) {
    if(err) {
      callback(err);
    }
    else if(results && results.length > 0) {
      async.each(results, function(item, fcallback) {
        for(var index in item.concession_operated_by) {
          Concession.update(
            { _id: item._id },
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
        console.log("updating field 'concession_operated_by'. DONE.");
      }, function(err) {
        callback(err);
      });
    }
    else callback(null, 'nothing to update');
  });
}

function update_concession_company_share(old_company_id, new_company_id, callback) {
  console.log("updating field 'concession_company_share'");
  Concession.find({ 'concession_company_share.company' : old_company_id })
  .populate('concession_company_share')
  .exec(function(err, results) {
    if(err) {
      callback(err);
    }
    else if(results && results.length > 0) {
      async.each(results, function(item, fcallback) {
        for(var index in item.concession_operated_by.company) {
          Concession.update(
            { _id: item._id },
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
        console.log("updating field 'concession_company_share'. DONE.");
      }, function(err) {
        callback(err);
      });
    }
    else callback(null, 'nothing to update');
  });
}

function update_site_operated_by(old_company_id, new_company_id, callback) {
  console.log("updating field 'site_operated_by'");
  Site.find({ 'site_operated_by.company' : old_company_id })
  .populate('site_operated_by')
  .exec(function(err, results) {
    if(err) {
      callback(err);
    }
    else if(results && results.length > 0) {
      async.each(results, function(item, fcallback) {
        for(var index in item.concession_operated_by.company) {
          Site.update(
            { _id: item._id },
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
        console.log("updating field 'site_operated_by'. DONE.");
      }, function(err) {
        callback(err);
      });
    }
    else callback(null, 'nothing to update');
  });
}

function update_site_company_share(old_company_id, new_company_id, callback) {
  console.log("updating field 'site_company_share'.");
  Site.find({ 'site_company_share.company' : old_company_id })
  .populate('site_company_share')
  .exec(function(err, results) {
    if(err) {
      callback(err);
    }
    else if(results && results.length > 0) {
      async.each(results, function(item, fcallback) {
        for(var index in item.concession_operated_by.company) {
          Site.update(
            { _id: item._id },
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
        console.log("updating field 'site_company_share'. DONE.");
      }, function(err) {
        callback(err);
      });
    }
    else callback(null, 'nothing to update');
  });
}

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
