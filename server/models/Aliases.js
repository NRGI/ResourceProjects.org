/////////////////
//ALIAS SCHEMA///
/////////////////
'use strict';
var mongoose = require('mongoose');

var aliasSchema,
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

module.exports = aliasSchema;