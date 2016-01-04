//////////
//SOURCES
//////////
"use strict";
var mongoose = require("mongoose");
require("mongoose-html-2").loadType(mongoose);

var sourceSchema, Source,
    links           = require("./Links"),
    ObjectId        = mongoose.Schema.Types.ObjectId,
    Schema          = mongoose.Schema,
    mongooseHistory = require("mongoose-history"),
    options         = {customCollectionName: "source_hst"},
    HTML            = mongoose.Types.Html,
    htmlSettings    = {
        type: HTML,
        setting: {
            allowedTags: ["p", "b", "i", "em", "strong", "a", "ul", "ol", "li", "del"],
            allowedAttributes: {
                "a": ["href"]
            }
        }
    };
sourceSchema = new Schema({
    source_name: String,
    source_type: String,
    source_type_id: String,
    source_URL: String,
    source_URL_type: String,
    source_archive_url: String,
    source_date: {
        type: Date,
        default: Date.now},
    retrieve_date: {
        type: Date,
        default: Date.now},
    notes: htmlSettings,
    //LINKAGES SIMPLE ARRAYS FOR QUERYING
    contracts: [String],
    companies: [String],
    concessions: [String],
    countries: [String],
    company_groups: [String],
    commodities: [String],
    transfers: [ObjectId],
    reserves: [ObjectId],
    production: [ObjectId],
    projects: [String],
    contributors: [ObjectId]
});

sourceSchema.plugin(mongooseHistory, options);

Source = mongoose.model("Source", sourceSchema);

function createDefaultSources() {
    Source.find({}).exec(function(err, sources) {
        if(sources.length === 0) {
            Source.create({
                "_id": "56747e060e8cc07115200ee4",
                "source_name": "source 1",
                "source_type": "source type 1",
                "source_type_id": "source_id_1",
                "source_URL": "google.com",
                "source_URL_type": "url type",
                "source_archive_url": "sheets.google.com",
                "notes": "notes notes notes notes notes notes notes notes notes notes notes notes notes notes",
                //contracts: [String],
                //companies: [String],
                //concessions: [String],
                //countries: [String],
                //company_groups: [String],
                //commodities: [String],
                //transfers: [ObjectId],
                //reserves: [ObjectId],
                //production: [ObjectId],
                //projects: [String],
                //contributors: [ObjectId]
            });
            Source.create({
                "_id": "56747e060e8cc07115200ee5",
                "source_name": "source 2",
                "source_type": "source type 2",
                "source_type_id": "source_id_2",
                "source_URL": "google.com",
                "source_URL_type": "url type",
                "source_archive_url": "sheets.google.com",
                "notes": "notes notes notes notes notes notes notes notes notes notes notes notes notes notes",
                //contracts: [String],
                //companies: [String],
                //concessions: [String],
                //countries: [String],
                //company_groups: [String],
                //commodities: [String],
                //transfers: [ObjectId],
                //reserves: [ObjectId],
                //production: [ObjectId],
                //projects: [String],
                //contributors: [ObjectId]
            });
            Source.create({
                "_id": "56747e060e8cc07115200ee6",
                "source_name": "source 3",
                "source_type": "source type 3",
                "source_type_id": "source_id_3",
                "source_URL": "google.com",
                "source_URL_type": "url type",
                "source_archive_url": "sheets.google.com",
                "notes": "notes notes notes notes notes notes notes notes notes notes notes notes notes notes",
                //contracts: [String],
                //companies: [String],
                //concessions: [String],
                //countries: [String],
                //company_groups: [String],
                //commodities: [String],
                //transfers: [ObjectId],
                //reserves: [ObjectId],
                //production: [ObjectId],
                //projects: [String],
                //contributors: [ObjectId]
            });
            Source.create({
                "_id": "56747e060e8cc07115200ee3",
                "source_name": "source 4",
                "source_type": "source type 4",
                "source_type_id": "source_id_4",
                "source_URL": "google.com",
                "source_URL_type": "url type",
                "source_archive_url": "sheets.google.com",
                "notes": "notes notes notes notes notes notes notes notes notes notes notes notes notes notes",
                //contracts: [String],
                //companies: [String],
                //concessions: [String],
                //countries: [String],
                //company_groups: [String],
                //commodities: [String],
                //transfers: [ObjectId],
                //reserves: [ObjectId],
                //production: [ObjectId],
                //projects: [String],
                //contributors: [ObjectId]
            });
        }
    });
};

exports.createDefaultSources = createDefaultSources;