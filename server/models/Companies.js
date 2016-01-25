//////////////////////
///COMPANIES SCHEMA///
//////////////////////
'use strict';
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var aliasSchema, sourceSchema, companySchema, Company,
    Schema          = mongoose.Schema,
    aliases         = mongoose.model('Alias'),
    links           = mongoose.model('Link'),
    ObjectId        = Schema.Types.ObjectId,
    source          = {type: ObjectId, ref: 'Sources'},
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

sourceSchema = new Schema({
    source: source,
    //approved: Boolean,
    string: String,
    number: Number,
    date: Date
});

companySchema = new Schema({
    //Metadata
    company_name: String,
    company_aliases: [aliases],
    company_established_source: source,
    country_of_incorporation: [sourceSchema],
    countries_of_operation: [sourceSchema],
    company_start_date: [sourceSchema],
    company_end_date: [sourceSchema],
    company_website: [sourceSchema],
    description: htmlSettings,
    //country_of_incorporation: [String],
    //countries_of_operation: [String],
    //company_start_date: Date,
    //company_end_date: Date,
    //company_website: String,

    //External mapping
    open_corporates_id: String,
    companies_house_id: String,

    //Links
    sources: [source],
    commodities: [links],
    company_groups: [links],
    concessions: [links],
    contracts: [links],
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
                company_aliases: [
                    {alias: 'company one aaa',language: 'en',source: '56747e060e8cc07115200ee5'}
                ],
                company_established_source: '56747e060e8cc07115200ee5',
                country_of_incorporation: [{source: '56747e060e8cc07115200ee5', string: 'AF'}],
                countries_of_operation: [{source: '56747e060e8cc07115200ee5', string: 'AF'}, {source: '56747e060e8cc07115200ee5', string: 'BG'}],
                company_start_date: [{source: '56747e060e8cc07115200ee5', date: new Date()}],
                company_end_date: [{source: '56747e060e8cc07115200ee5', date: new Date()}],
                company_website: [{source: '56747e060e8cc07115200ee5', string: 'http://google.com'}],
                description: '<p>yes</p><p>no</p>',
                //External mapping
                open_corporates_id: 'junkid',
                companies_house_id: 'junkid2',

                //Display specifific lists
                display_commodities: ['56a13e9942c8bef50ec2e9e8', '56a13e9942c8bef50ec2e9eb'],

                //LINKS
                sources: ['56747e060e8cc07115200ee5','56747e060e8cc07115200ee4','56747e060e8cc07115200ee6'],
                commodities: [
                    {commodity: '56a13e9942c8bef50ec2e9e8',source:'56747e060e8cc07115200ee6',entity:'commodity'},
                    {commodity: '56a13e9942c8bef50ec2e9eb',source:'56747e060e8cc07115200ee6',entity:'commodity'}
                ],
                company_groups: [
                    {company_group: '56747e060e8cc07115200ee4',source:'56747e060e8cc07115200ee5',entity:'company_group',company_group_start_date: new Date(), company_group_end_date: new Date()}
                ],
                concessions: [
                    {concession:'56a2b8236e585b7316655794', source:'56747e060e8cc07115200ee6', entity:'concession'}
                ],
                //contracts: [links],
                //countries: [links],
                //projects: [links],
                //sources: [ObjectId]
            });
            Company.create({
                _id: '56a13a758f224f670e6a376a',
                company_name: 'company 2 b',
                company_aliases: [
                    {alias: 'company two bbb',language: 'en',source: '56747e060e8cc07115200ee6'}
                ],
                company_established_source: '56747e060e8cc07115200ee4',
                description: '<p>yes</p><p>no</p>',
                country_of_incorporation: [{source: '56747e060e8cc07115200ee4', string: 'BG'}],
                countries_of_operation: [{source: '56747e060e8cc07115200ee4', string: 'BG'}, {source: '56747e060e8cc07115200ee5', string: 'NG'}],
                company_start_date: [{source: '56747e060e8cc07115200ee4', date: new Date()}],
                company_end_date: [{source: '56747e060e8cc07115200ee4', date: new Date()}],
                company_website: [{source: '56747e060e8cc07115200ee4', string: 'http://google.com'}],
                //External mapping
                open_corporates_id: 'junkid',
                companies_house_id: 'junkid2',

                //Display specifific lists
                display_commodities: ['56a13e9942c8bef50ec2e9e8'],

                //LINKS
                sources: ['56747e060e8cc07115200ee4', '56747e060e8cc07115200ee6','56747e060e8cc07115200ee5'],
                commodities: [
                    {commodity: '56a13e9942c8bef50ec2e9e8',source:'56747e060e8cc07115200ee4',entity:'commodity'}
                ],
                concessions: [
                    {concession:'56a2b8236e585b7316655794', source:'56747e060e8cc07115200ee5', entity:'concession'}
                ],
                contracts: [
                    {contract:'56a2eb4345d114c30439ec20',source:'56747e060e8cc07115200ee6',entity:'contract'}
                ]
                //contracts: [links],
                //countries: [links],
                //projects: [links],
                //sources: [ObjectId]
            });
            Company.create({
                _id: '56a13a758f224f670e6a376c',
                company_name: 'company 3 c',
                company_aliases: [
                    {'alias': 'company three ccc','language': 'en', 'source': '56747e060e8cc07115200ee6'},
                    {'alias': 'BP ccc','language': 'fr', 'source': '56747e060e8cc07115200ee4'}
                ],
                company_established_source: '56747e060e8cc07115200ee3',
                description: '<p>yes</p><p>no</p>',
                country_of_incorporation: [{source: '56747e060e8cc07115200ee3', string: 'GH'}],
                countries_of_operation: [{source: '56747e060e8cc07115200ee3', string: 'GH'}],
                company_start_date: [{source: '56747e060e8cc07115200ee3', date: new Date()}],
                company_end_date: [{source: '56747e060e8cc07115200ee3', date: new Date()}],
                company_website: [{source: '56747e060e8cc07115200ee3', string: 'http://google.com'}],
                //External mapping
                open_corporates_id: 'junkid',
                companies_house_id: 'junkid2',

                //Display specifific lists
                display_commodities: ['56a13e9942c8bef50ec2e9e8'],

                //LINKS
                sources: ['56747e060e8cc07115200ee6', '56747e060e8cc07115200ee4', '56747e060e8cc07115200ee3'],
                commodities: [
                    {commodity: '56a13e9942c8bef50ec2e9e8',source:'56747e060e8cc07115200ee3',entity:'commodity'}
                ],
                //concessions: [links],
                //contracts: [links],
                //countries: [links],
                //projects: [links],
                //sources: [ObjectId]
            });
            console.log('***Companies Added');
        }
    });
};

exports.createDefaultCompanies = createDefaultCompanies;