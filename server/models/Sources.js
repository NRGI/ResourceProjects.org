//////////////////
//SOURCE SCHEMA///
//////////////////
'use strict';
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var sourceSchema, Source,
    Schema          = mongoose.Schema,
    //fact           = mongoose.model('fact'),
    ObjectId        = Schema.Types.ObjectId,
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
    hst_options     = {customCollectionName: 'source_hst'};

sourceSchema = new Schema({
    source_name: String,
    source_type: String, // loaded, edit. api
    source_type_id: String,
    source_url: String,
    source_archive_url: String,
    source_notes: htmlSettings,
    //approved: Boolean,
    source_date: {
        type: Date,
        default: Date.now},
    retrieve_date: {
        type: Date,
        default: Date.now},
    description: htmlSettings,
    create_author: ObjectId,
    create_date: {
        type: Date,
        default: Date.now},
    //TODO figure out maintenance of these references
    countries: [{
        type: ObjectId,
        ref: 'Country'}],
    commodities: [{
        type: ObjectId,
        ref: 'Commodities'}],
    companies: [{
        type: ObjectId,
        ref: 'Companies'}],
    company_groups: [{
        type: ObjectId,
        ref: 'CompanyGroups'}],
    concessions: [{
        type: ObjectId,
        ref: 'Concessions'}],
    contracts: [{
        type: ObjectId,
        ref: 'Contracts'}],
    projects: [{
        type: ObjectId,
        ref: 'Contracts'}],
    //transfers: [{
    //    type: ObjectId,
    //    ref: 'Contracts'}],
    //reserves: [{
    //    type: ObjectId,
    //    ref: 'Contracts'}],
    //production: [{
    //    type: ObjectId,
    //    ref: 'Contracts'}],
    //contributors: [{
    //    type: ObjectId,
    //    ref: 'Contracts'}]
});

sourceSchema.plugin(mongooseHistory, hst_options);

Source = mongoose.model('Source', sourceSchema);

function createDefaultSources() {
    Source.find({}).exec(function(err, sources) {
        if(sources.length === 0) {
            Source.create({
                _id: '56747e060e8cc07115200ee4',
                source_name: 'source 1',
                source_type: 'source id 1',
                source_type_id: 'source_id_1',
                source_url: 'google.com',
                source_archive_url: 'sheets.google.com',
                source_notes: 'notes notes notes notes notes notes notes notes notes notes notes notes notes notes',
                create_author: '569976c21dad48f614cc8125',
                countries: ['56a7e6c02302369318e16bb8'],
                commodities: ['56a13e9942c8bef50ec2e9e8'],
                companies: ['56a13a758f224f670e6a376a', '56a13a758f224f670e6a376c'],
                company_groups: ['56a14d8ee47b92f110ce9a57'],
                concessions: ['56a2b8236e585b7316655794'],
                ////transfers: [ObjectId],
                ////reserves: [ObjectId],
                ////production: [ObjectId],
                ////projects: [String],
                ////contributors: [ObjectId]
            });
            Source.create({
                _id: '56747e060e8cc07115200ee5',
                source_name: 'source 2',
                source_type: 'source id 2',
                source_type_id: 'source_id_2',
                source_url: 'google.com',
                source_archive_url: 'sheets.google.com',
                source_notes: 'notes notes notes notes notes notes notes notes notes notes notes notes notes notes',
                create_author: '569976c21dad48f614cc8126',
                countries: ['56a7e6c02302369318e16bb9','56a7e6c02302369318e16bb8','56a7e6c02302369318e16bba'],
                companies: ['56a13a758f224f670e6a376a', '56a13a758f224f670e6a376e'],
                concessions: ['56a2b8236e585b7316655794'],
                contracts: ['56a2eb4345d114c30439ec22'],
                ////licensees: [ObjectId],
            });
            Source.create({
                _id: '56747e060e8cc07115200ee6',
                source_name: 'source 3',
                source_type: 'source id 3',
                source_type_id: 'source_id_3',
                source_url: 'google.com',
                source_archive_url: 'sheets.google.com',
                source_notes: 'notes notes notes notes notes notes notes notes notes notes notes notes notes notes',
                create_author: '569976c21dad48f614cc8126',
                commodities: ['56a13e9942c8bef50ec2e9e8','56a13e9942c8bef50ec2e9eb','56a13e9942c8bef50ec2e9f1'],
                companies: ['56a13a758f224f670e6a376e', '56a13a758f224f670e6a376a','56a13a758f224f670e6a376c'],
                concessions: ['56a2b8236e585b7316655794'],
                contracts: ['56a2eb4345d114c30439ec20'],
                ////licensee's: [ObjectId],
            });
            Source.create({
                _id: '56747e060e8cc07115200ee3',
                source_name: 'source 4',
                source_type: 'source id 4',
                source_type_id: 'source_id_4',
                source_url: 'google.com',
                source_archive_url: 'sheets.google.com',
                source_notes: 'notes notes notes notes notes notes notes notes notes notes notes notes notes notes',
                create_author: '569976c21dad48f614cc8128',
                commodities: ['56a13e9942c8bef50ec2e9e8'],
                companies: ['56a13a758f224f670e6a376c'],
                ////licensees: [ObjectId],
            });
            console.log('Sources created...');
        }
    });
};

exports.createDefaultSources = createDefaultSources;