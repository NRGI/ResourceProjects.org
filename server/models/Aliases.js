//////////////////
//ALIAS SCHEMAS///
//////////////////
"use strict";
var linkSchema, aliasSchema, companyGroupLinkSchema,
    mongoose = require("mongoose"),
    ObjectId = mongoose.Schema.Types.ObjectId,
    Schema   = mongoose.Schema;

aliasSchema = new Schema({
    alias: String,
    language: String,
    source: ObjectId //source._id
});

module.exports = aliasSchema;