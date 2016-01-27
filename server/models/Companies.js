//////////////////////
///COMPANIES SCHEMA///
//////////////////////
'use strict';
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var factSchema, aliasSchema, companySchema, Company,
    Schema          = mongoose.Schema,
    ObjectId        = Schema.Types.ObjectId,
    source          = {type: ObjectId, ref: 'Sources'},
    fact            = require("./Facts"),
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

factSchema = new Schema({
    source: source,
    //approved: Boolean,
    country: {
        type: ObjectId,
        ref: 'Country'},
    number: Number,
    date: Date
});

companySchema = new Schema({
    //Metadata
    company_name: String,
    company_aliases: [{
        type: ObjectId,
        ref: 'Alias'}],
    company_established_source: source,
    country_of_incorporation: [fact],
    countries_of_operation: [fact],
    company_start_date: [fact],
    company_end_date: [fact],
    company_website: [fact],
    description: htmlSettings,

    //External mapping
    open_corporates_id: String,
    companies_house_id: String,

    ////Links
    //sources: [source],
    commodities: [{
        type: ObjectId,
        ref: 'Link'}],
    company_groups: [{
        type: ObjectId,
        ref: 'Link'}],
    concessions: [{
        type: ObjectId,
        ref: 'Link'}],
    contracts: [{
        type: ObjectId,
        ref: 'Link'}],
    //projects: [links],
});
//TranModel
//    .find({ quantityout: 1 },
//    { _id: 0} )
//    .sort({ tag: 1 })
//    .select( 'tag' )
//    .exec(function(err, docs){
//        docs = docs.map(function(doc) { return doc.tag; });
//        if(err){
//            res.json(err)
//        } else {
//            res.json(docs)
//        }
//    })

////pull from open corporates
//companySchema.methods = {
//    openCorporatesPull: function() {
//
//    }
//    reconcileDisplay: function() {
//
//    }
//};

companySchema.plugin(mongooseHistory, hst_options);

Company = mongoose.model('Company', companySchema);

function createDefaultCompanies() {
    Company.find({}).exec(function(err, companies) {
        if(companies.length === 0) {
            Company.create({
                _id: '56a13a758f224f670e6a376e',
                company_name: 'company 1 a',
                company_aliases: ['56a7d55eb04a1f2214b7b1dd'],
                company_established_source: '56747e060e8cc07115200ee5',
                country_of_incorporation: [{source: '56747e060e8cc07115200ee5', country: '56a7e6c02302369318e16bb9'}],
                countries_of_operation: [{source: '56747e060e8cc07115200ee5', country: '56a7e6c02302369318e16bb9'}, {source: '56747e060e8cc07115200ee5', country: '56a7e6c02302369318e16bb8'}],
                company_start_date: [{source: '56747e060e8cc07115200ee5', date: new Date()}],
                company_end_date: [{source: '56747e060e8cc07115200ee5', date: new Date()}],
                company_website: [{source: '56747e060e8cc07115200ee5', string: 'http://google.com'}],
                description: '<p>yes</p><p>no</p>',
                //External mapping
                open_corporates_id: 'junkid',
                companies_house_id: 'junkid2',

                ////Display specifific lists
                //display_commodities: ['56a13e9942c8bef50ec2e9e8', '56a13e9942c8bef50ec2e9eb'],

                //LINKS
                //sources: ['56747e060e8cc07115200ee5','56747e060e8cc07115200ee4','56747e060e8cc07115200ee6'],
                commodities: ['56a8def185d9580a07c58280','56a8def185d9580a07c58281'],
                company_groups: ['56a8e342b9a34fbb07013c5f'],
                concessions: ['56a8e4acf77930f50708881e'],
            });
            Company.create({
                _id: '56a13a758f224f670e6a376a',
                company_name: 'company 2 b',
                company_aliases: ['56a7d55eb04a1f2214b7b1de'],
                company_established_source: '56747e060e8cc07115200ee4',
                description: '<p>yes</p><p>no</p>',
                country_of_incorporation: [{source: '56747e060e8cc07115200ee4', country: '56a7e6c02302369318e16bb8'}],
                countries_of_operation: [{source: '56747e060e8cc07115200ee4', country: '56a7e6c02302369318e16bb8'}, {source: '56747e060e8cc07115200ee5', country: '56a7e6c02302369318e16bba'}],
                company_start_date: [{source: '56747e060e8cc07115200ee4', date: new Date()}],
                company_end_date: [{source: '56747e060e8cc07115200ee4', date: new Date()}],
                company_website: [{source: '56747e060e8cc07115200ee4', string: 'http://google.com'}],
                //External mapping
                open_corporates_id: 'junkid',
                companies_house_id: 'junkid2',

                ////Display specifific lists
                //display_commodities: ['56a13e9942c8bef50ec2e9e8'],
                //
                //LINKS
                //sources: ['56747e060e8cc07115200ee4', '56747e060e8cc07115200ee6','56747e060e8cc07115200ee5'],
                commodities: ['56a8dfbfee9e493007085bce'],
                concessions: ['56a8e5320fa7dd0d0817beff'],
                contracts: ['56a8e66f405f534508e8586f']
            });
            Company.create({
                _id: '56a13a758f224f670e6a376c',
                company_name: 'company 3 c',
                company_aliases: ['56a7d55eb04a1f2214b7b1e0','56a7d55eb04a1f2214b7b1df'],
                company_established_source: '56747e060e8cc07115200ee3',
                description: '<p>yes</p><p>no</p>',
                country_of_incorporation: [{source: '56747e060e8cc07115200ee3', country: '56a8d7d08e7079da05d6b542'}],
                countries_of_operation: [{source: '56747e060e8cc07115200ee3', country: '56a8d7d08e7079da05d6b542'}],
                company_start_date: [{source: '56747e060e8cc07115200ee3', date: new Date()}],
                company_end_date: [{source: '56747e060e8cc07115200ee3', date: new Date()}],
                company_website: [{source: '56747e060e8cc07115200ee3', string: 'http://google.com'}],
                //External mapping
                open_corporates_id: 'junkid',
                companies_house_id: 'junkid2',

                ////Display specifific lists
                //display_commodities: ['56a13e9942c8bef50ec2e9e8'],
                //
                //LINKS
                //sources: ['56747e060e8cc07115200ee6', '56747e060e8cc07115200ee4', '56747e060e8cc07115200ee3'],
                commodities: ['56a8e070121b00500792c2eb'],
            });
            console.log('Companies created...');
        }
    });
};

exports.createDefaultCompanies = createDefaultCompanies;