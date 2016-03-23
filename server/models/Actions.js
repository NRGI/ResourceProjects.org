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

function createDefaultActions() {
    Action.update({status: 'Started'}, {status: 'Failed'}, function(err){console.log(err);}); //Mark any unfinished as failed
    Action.find({}).exec(function(err, actions) {
        if(actions.length === 0) {
            console.log('Creating dummy action for CS API Import');
            Action.create({
                _id: '56737e170e4ac07115211ee4',
                dataset: '56737e170e8cc07115211ee4',
                name: 'Incremental import',
                started: Date.now(),
                finished: Date.now(),
                started_by: '56d011292cb1766d0c308ec0',
                status: 'Success',
                details: 'One duplicate was detected'
            });
        } else {
            console.log(String(actions.length), 'actions exist...')
        }
    });
};

exports.createDefaultActions = createDefaultActions;