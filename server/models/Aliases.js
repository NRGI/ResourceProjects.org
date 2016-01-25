/////////////////
//ALIAS SCHEMA///
/////////////////
'use strict';
var mongoose = require('mongoose');

var aliasSchema, Alias,
    Schema   = mongoose.Schema,
    ObjectId = mongoose.Schema.Types.ObjectId;

aliasSchema = new Schema({
    alias: String,
    code: String,
    language: String,
    reference: String,
    source: {
        type: ObjectId,
        ref: 'Sources'} //source._id
});

//aliasSchema.plugin(mongooseHistory, hst_options);

Alias = mongoose.model('Alias', aliasSchema);

function createDefaultAliases() {
    Alias.find({}).exec(function(err, aliases) {
        if(aliases.length === 0) {
            console.log('No aliases...');
        }
    });
};

exports.createDefaultAliases = createDefaultAliases;