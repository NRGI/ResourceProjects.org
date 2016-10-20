//////////////////////
///COMPANIES SCHEMA///
//////////////////////
'use strict';
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var companySchema, Company,
    deepPopulate    = require('mongoose-deep-populate')(mongoose),
    Schema          = mongoose.Schema,
    ObjectId        = Schema.Types.ObjectId,
    source          = {type: ObjectId, ref: 'Source'},
    fact            = require("./Facts"),
    alias           = require("./Aliases"),
    HTML            = mongoose.Types.Html,
    htmlSettings    = {
        type: HTML,
        setting: {
            allowedTags: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'del'],
            allowedAttributes: {
                'a': ['href']
            }
        }
    },
    mongooseHistory = require('mongoose-history'),
    hst_options     = {customCollectionName: 'company_hst'};

companySchema = new Schema({
    //Metadata
    company_name: String,
    company_aliases: [alias],
    company_established_source: source,
    country_of_incorporation: [fact],
    countries_of_operation: [fact],
    company_website: fact,
    description: htmlSettings,

    //External mapping
    open_corporates_id: String,
    companies_house_id: String
});

//pull from open corporates
//companySchema.methods = {
////    openCorporatesPull: function() {
////
////    }
//};

companySchema.plugin(mongooseHistory, hst_options);
companySchema.plugin(deepPopulate);
Company = mongoose.model('Company', companySchema);

function createDefaultCompanies() {
    Company.find({}).count().exec(function(err, company_count) {
        if(company_count === 0) {
            Company.create({
                _id: '56a13a758f224f670e6a376e',
                company_name: 'company 1 a',
                company_aliases: ['56a7d55eb04a1f2214b7b1dd'],
                company_established_source: '56747e060e8cc07115200ee5',
                country_of_incorporation: [{source: '56747e060e8cc07115200ee5', country: '56a7e6c02302369318e16bb9'}],
                countries_of_operation: [{source: '56747e060e8cc07115200ee5', country: '56a7e6c02302369318e16bb9'}, {source: '56747e060e8cc07115200ee5', country: '56a7e6c02302369318e16bb8'}],
                company_website: {source: '56747e060e8cc07115200ee5', string: 'http://google.com'},
                description: '<p>yes</p><p>no</p>',
                //External mapping
                open_corporates_id: 'gb/06774082',
                companies_house_id: '03323845'
            });
            Company.create({
                _id: '56a13a758f224f670e6a376a',
                company_name: 'company 2 b',
                company_aliases: ['56a7d55eb04a1f2214b7b1de'],
                company_established_source: '56747e060e8cc07115200ee4',
                description: '<p>yes</p><p>no</p>',
                country_of_incorporation: [{source: '56747e060e8cc07115200ee4', country: '56a7e6c02302369318e16bb8'}],
                countries_of_operation: [{source: '56747e060e8cc07115200ee4', country: '56a7e6c02302369318e16bb8'}, {source: '56747e060e8cc07115200ee5', country: '56a7e6c02302369318e16bba'}],
                company_website: {source: '56747e060e8cc07115200ee4', string: 'http://google.com'},
                //External mapping
                open_corporates_id: 'gb/06774082',
                companies_house_id: '03323845',
            });
            Company.create({
                _id: '56a13a758d224f670e6b377a',
                company_name: 'company 2 b\'s duplicate!',
                company_established_source: '56747e060e8cc07115200ee4',
                description: '<p>A duplicate</p>',
                country_of_incorporation: [{source: '56747e060e8cc07115200ee4', country: '56a7e6c02302369318e16bb8'}],
                countries_of_operation: [{source: '56747e060e8cc07115200ee4', country: '56a7e6c02302369318e16bb8'}, {source: '56747e060e8cc07115200ee5', country: '56a7e6c02302369318e16bba'}],
                company_website: {source: '56747e060e8cc07115200ee4', string: 'http://google.com'},
                //External mapping
                open_corporates_id: 'gb/06774082',
                companies_house_id: '03323845',
            });
            Company.create({
                _id: '56a13a758f224f670e6a376c',
                company_name: 'company 3 c',
                company_aliases: ['56a7d55eb04a1f2214b7b1e0','56a7d55eb04a1f2214b7b1df'],
                company_established_source: '56747e060e8cc07115200ee3',
                description: '<p>yes</p><p>no</p>',
                country_of_incorporation: [{source: '56747e060e8cc07115200ee3', country: '56a8d7d08e7079da05d6b542'}],
                countries_of_operation: [{source: '56747e060e8cc07115200ee3', country: '56a8d7d08e7079da05d6b542'}],
                company_website: {source: '56747e060e8cc07115200ee3', string: 'http://google.com'},
                //External mapping
                open_corporates_id: 'gb/06774082',
                companies_house_id: '03323845'
            });
            Company.find({}).count().exec(function(err, company_count) {
                console.log(String(company_count), 'companies created...')
            });
        } else {
            console.log(String(company_count), 'companies exist...')
        }
    });
};
function getInitCompanyCount() {
    Company.find({}).count().exec(function(err, company_count) {
        console.log(String(company_count), 'companies exist...')
    });
};

exports.getInitCompanyCount = getInitCompanyCount;
exports.createDefaultCompanies = createDefaultCompanies;