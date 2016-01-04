///////////////
//LINK SCHEMAS
///////////////
"use strict";
var linkSchema,
    mongoose = require("mongoose"),
    ObjectId = mongoose.Schema.Types.ObjectId,
    Schema   = mongoose.Schema;

linkSchema = new Schema({
    linked_ID: {
        type: String,
        required:"{PATH} is required!"},
    source: {
        type: ObjectId,
        required:"{PATH} is required!"}, //source._id
    entity: {
        type: String,
        required:"{PATH} is required!",
        enum: [
            "company",
            "concession",
            "contract",
            "country",
            "project",
            "company_group"
        ]},
    //company group specific
    company_group_start_date: Date,
    company_group_end_date: Date
});

module.exports = linkSchema;