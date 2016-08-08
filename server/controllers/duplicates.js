'use strict';

var Duplicate = require('mongoose').model('Duplicate'),
Project = require('mongoose').model('Project'),
Company = require('mongoose').model('Company'),
CompanyGroup = require('mongoose').model('CompanyGroup'),
Link = require('mongoose').model('Link'),
async = require('async'),
_ = require("underscore"),
moment = require('moment');

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

exports.getDuplicates = function(req, res) {

  var limit = Number(req.params.limit);
  var skip = Number(req.params.skip);

  async.parallel([
    getCompanyDuplicates.bind(null, limit, skip),
    getProjectDuplicates.bind(null, limit, skip)
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

  function getCompanyDuplicates(limit, skip, callback) {

    async.waterfall([
      getDuplicateCount,
      getDuplicateData
    ], function(err, result) {
      if (err) {
          res.send(err);
      }
      else {
          if (req.query && req.query.callback) {
              console.log('req.query.callback', req.query.callback)
              return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
          }
          else {
              return res.send(result);
          }
      }
    });

    function getDuplicateCount(callback) {
      Duplicate.find({ entity: 'company', resolved: false }).count().exec(function(err, company_count) {
        if(company_count) {
          callback(null, company_count);
        } else {
          callback(err);
        }
      });
    }

    function getDuplicateData(duplicate_count, callback) {
      Duplicate.find({ entity: 'company', resolved: false })
      .populate('original', null, 'Company')
      .populate('duplicate', null, 'Company')
      .populate('resolved_by')
      .limit(limit)
      .skip(limit * skip)
      .exec(function(err, duplicate) {
        if(duplicate) {
          callback(null, { data: duplicate, count: duplicate_count} );
        } else {
          callback(err);
        }
      });
    }

}

  function getProjectDuplicates(limit, skip, callback) {
    Duplicate.find({ entity: 'project', resolved: false })
    .populate('original', null, 'Project')
    .populate('duplicate', null, 'Project')
    .populate('resolved_by')
    .limit(limit)
    .skip(limit * skip)
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
                    //update links
                    async.waterfall([
                      findLinks.bind(null, company_to_remove._id, obj._id),
                      updateLinks
                    ], function(err, results) {
                      if(err) {
                        callback(err);
                      }
                      else if(results) {
                        // finally update duplicate entry to resolved
                        Duplicate.findByIdAndUpdate(obj._id, { resolved: true, resolved_date: Date.now() }, function(err, result) {
                          if(err) {
                            callback(err);
                          }
                          else {
                            callback(null, "added alias");
                          }
                        });
                      }
                      else {
                        callback(err);
                      }
                    })
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


        // TODO update facts

        break;

        case 'project':
        // TODO
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

      case 'update':
      Company.findOneAndRemove({ _id: obj.duplicate}, function (err, company_to_remove) {
        if(err) {
          callback(err);
        }
        else if(company_to_remove) {
          //TODO remove old _id from company_to_remove object
          Company.findByIdAndUpdate(obj.original, company_to_remove, function(err, doc) {
            if(err) {
              callback(err);
            }
            else if(company_to_remove) {
              Duplicate.findByIdAndUpdate(obj._id, { resolved: true, resolved_date: Date.now() }, function(err, result) {
                if(err) {
                  callback(err);
                }
                else {
                  callback(null, "company updated with information");
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
      callback("no valid action chosen");
      break;
    }
  };

  function findLinks(old_company_id, new_company_id, callback) {
    Link.find({ company: company_id }, function(err, results) {
      if(err) {
        callback(err);
      }
      else if(results) {
        callback(null, new_company_id, results);
      }
      else {
        callback(err);
      }
    });
  };

  function updateLinks(new_company_id, listOfLinkIds, callback) {
    async.each(listOfLinkIds, function(link_id, callback) {
      Link.findByIdAndUpdate(link_id, { company: new_company_id }, function(err, results) {
        if(err) {
          callback(err);
        }
        else if(results) {
          callback(null, "link updated successfully");
        }
        else {
          callback(err);
        }
      });
    });
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

    function updateFacts(old_company_id, new_company_id, callback) {
      async.parallel([
        updateCompanyGroup.bind(null, old_company_id, new_company_id),
        updateConcessions.bind(null, old_company_id, new_company_id),
        updateProject.bind(null, old_company_id, new_company_id),
        updateSites.bind(null, old_company_id, new_company_id)
      ], function(err, results) {
        if(err) {
          callback(err);
        }
        else if(results) {
          callback(null, results);
        }
        else {
          callback(err);
        }
      });
    }
  };

  function updateCompanyGroup(old_company_id, new_company_id, callback) {
    CompanyGroup.update(
      { 'country_of_incorporation.company': old_company_id },
      { 'country_of_incorporation.company': new_company_id }
    )
    .populate('country_of_incorporation')
    .exec(function(err, facts){
      if(err) {
        callback(err);
      }
      else if(facts) {
        facts.save(function(err, updatedFacts) {
          if(err) {
            callback(err);
          }
          else {
            callback(null, 'facts updated');
          }
        })
      }
      else {
        callback(err);
      }
    });
  }

  function updateConcessions(old_company_id, new_company_id, callback) {

  };

  function updateProject(old_company_id, new_company_id, callback) {

  };

  function updateSites(old_company_id, new_company_id, callback) {

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

exports.updateFacts = function(req, res) {
  var cid = req.params.company_id;

  async.waterfall([
    findCG.bind(null, cid),
    updateCG
  ], function(err, result) {
    if(err) res.send(err);
    else if(result) {
      res.send(result);
    }
    else {
      res.send(err);
    }
  });

  function findCG(cid, callback) {
    CompanyGroup.find({ 'country_of_incorporation.company' : cid },
    function(err, results) {
      if(err) callback(err);
      else if(results) {
        callback(null, results, cid);
      }
      else callback(err);
    });

  };

  function updateCG(list, cid, callback) {
    async.each(list, function(item, fcallback) {
      for(var index in item.country_of_incorporation) {
        CompanyGroup.update(
          { _id: item._id, 'country_of_incorporation.company': item.country_of_incorporation[index].company },
          { "$set": { "country_of_incorporation.$.company": "57a1b6157f1247881ba6666b" }},
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
  };

}
