///////////////
///COMPANIES///
///////////////
"use strict";
var mongoose = require("mongoose");
require("mongoose-html-2").loadType(mongoose);

var aliasSchema, companySchema, Company,
    links           = require("./Links"),
    aliases         = require("./Aliases"),
    ObjectId        = mongoose.Schema.Types.ObjectId,
    Schema          = mongoose.Schema,
    mongooseHistory = require("mongoose-history"),
    options         = {customCollectionName: "company_hst"},
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

//aliasSchema = ;


companySchema = new Schema({
    company_ID: {
        type:String,
        required:"{PATH} is required!",
        indexed: true,
        unique: true},
    //Metadata
    company_name: String,
    company_aliases: [aliases],
    company_country: String, //Country of incorporation? need to be tied to source?
    company_start_date: Date, //need to be tied to source?
    company_end_date: Date, //need to be tied to source?
    company_record_established: {
        source: ObjectId,
        date: {
            type: Date,
            default: Date.now}
    },
    company_website_URL: String,
    notes: htmlSettings,
    //External mapping
    open_corporates_ID: String,
    //Links
    commodities: [String],
    concessions: [links],
    contracts: [links],
    company_groups: [links],
    countries: [links],
    projects: [links],
    sources: [ObjectId]
});

//pull from open corporates
//companySchema.methods = {
////    openCorporatesPull: function() {
////
////    }
//};

companySchema.plugin(mongooseHistory, options);

Company = mongoose.model("Company", companySchema);

function createDefaultCompanies() {
    Company.find({}).exec(function(err, companies) {
        if(companies.length === 0) {
            Company.create({
                "company_ID": "CO-1-A",
                "company_name": "company 1 a",
                "company_aliases": [
                    {"alias": "company one aaa","language": "english", "source": "56747e060e8cc07115200ee5"}
                ],
                "company_country": "AF",
                "company_start_date": new Date(),
                "company_end_date": new Date(),
                "company_record_established": {g
                    "source": "56747e060e8cc07115200ee5"
                },
                "company_website_URL": "google.com",
                "notes": "<p>yes</p><p>no</p>",
                //External mapping
                "open_corporates_ID": "junkid",
                //commodities: [String],
                //concessions: [links],
                //contracts: [links],
                //company_groups: [links],
                //countries: [links],
                //projects: [links],
                //sources: [ObjectId]
            });
            Company.create({
                "company_ID": "CO-2-b",
                "company_name": "company 2 b",
                "company_aliases": [
                    {"alias": "company two bbb","language": "english", "source": "56747e060e8cc07115200ee6"}
                ],
                "company_country": "BG",
                "company_start_date": new Date(),
                "company_end_date": new Date(),
                "company_record_established": {
                    "source": "56747e060e8cc07115200ee4"
                },
                "company_website_URL": "google.com",
                "notes": "<p>yes</p><p>no</p>",
                //External mapping
                "open_corporates_ID": "junkid",
                //commodities: [String],
                //concessions: [links],
                //contracts: [links],
                //company_groups: [links],
                //countries: [links],
                //projects: [links],
                //sources: [ObjectId]
            });
            Company.create({
                "company_ID": "CO-3-c",
                "company_name": "company 3 c",
                "company_aliases": [
                    {"alias": "company three ccc","language": "english", "source": "56747e060e8cc07115200ee6"},
                    {"alias": "BP ccc","language": "french", "source": "56747e060e8cc07115200ee6"}
                ],
                "company_country": "GH",
                "company_start_date": new Date(),
                "company_end_date": new Date(),
                "company_record_established": {
                    "source": "56747e060e8cc07115200ee4"
                },
                "company_website_URL": "google.com",
                "notes": "<p>yes</p><p>no</p>",
                //External mapping
                "open_corporates_ID": "junkid",
                //commodities: [String],
                //concessions: [links],
                //contracts: [links],
                //company_groups: [links],
                //countries: [links],
                //projects: [links],
                //sources: [ObjectId]
            });
        }
    });
};

exports.createDefaultCompanies = createDefaultCompanies;