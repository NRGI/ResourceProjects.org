///////////////////
//ACTIONS SCHEMA///
///////////////////
'use strict';
var mongoose = require('mongoose');

var actionSchema, Action,
    Schema      = mongoose.Schema,
    ObjectId    = Schema.Types.ObjectId,
    dataset      = {type: ObjectId, ref: 'Dataset'};

actionSchema = new Schema({
    dataset: dataset,
    name: String,
    started: Date,
    finished: Date,
    started_by: {type: ObjectId, ref: 'User'},
    status: String,
    details: String
});

Action = mongoose.model('Action', actionSchema);

module.exports = actionSchema;