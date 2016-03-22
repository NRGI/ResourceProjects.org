//////////////////
///SITE SCHEMA///
/////////////////

'use strict';
var mongoose = require('mongoose'),
    searchPlugin = require('mongoose-search-plugin');
require('mongoose-html-2').loadType(mongoose);

var siteSchema, Site,
    Schema          = mongoose.Schema,
    fact            = require("./Facts"),
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
    hst_options     = {customCollectionName: 'site_hst'},
    status_enu  = {
        values: 'exploration development production on_hold inactive unknown'.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select exploration, development, production, on hold, inactive or unknown.'
    },
    type_enu  = {
       values: 'mining oil'.split(' '),
       //values: ' project '.split(' '),
       message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select company, concession, contract, country, project, or company group.'
    };

siteSchema = new Schema({
    site_name: String,
    field: Boolean,
    site_type: [{
        source: source,
        string: {
            type: String,
            enum: type_enu},
        timestamp: {
            type: Date,
            default: Date.now()}}],
    site_aliases: [{
        type: ObjectId,
        ref: 'Alias'}],
    site_established_source: source,
    site_address: [fact],
    site_country: [fact],
    site_coordinates: [fact],
    site_commodity: [fact],
    site_operated_by: [fact],
    site_status: [{
        source: source,
        string: {
            type: String,
            enum: status_enu,
            default: 'unknown'},
        timestamp: {
            type: Date,
            default: Date.now()}}],
    description: htmlSettings
});

siteSchema.plugin(mongooseHistory, hst_options);
siteSchema.plugin(searchPlugin,{
   fields:['site_name']
});

Site = mongoose.model('Site', siteSchema);

function createDefaultSites() {
    Site.find({}).exec(function(err, sites) {
        if(sites.length === 0) {
           Site.create({
               _id: '56eb117c0007bf5b2a3e4b71',
               site_name: 'Test site 1',
               field: false,
               site_type: [{source: '56747e060e8cc07115200ee3', string: 'mining'}],
               site_aliases: ['56a939e64ddd4cfc1354d64b'],
               site_established_source: '56747e060e8cc07115200ee3',
               site_address: [{source: '56747e060e8cc07115200ee3', string: '123 main st'}],
               site_country: [{source: '56747e060e8cc07115200ee3', country: '56a7e6c02302369318e16bb8'}],
               site_coordinates: [{source: '56747e060e8cc07115200ee3', loc: [14.15392307, 19.50168983]}],
               site_commodity: [{source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9e8'}, {source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9eb'},{source: '56747e060e8cc07115200ee6', commodity: '56a13e9942c8bef50ec2e9eb'}],
               site_status: [{source: '56747e060e8cc07115200ee3', string: 'exploration'}],
               description: '<p>yes</p><p>no</p>'
           });
            Site.create({
                _id: '56eb117c0007bf5b2a3e4b76',
                site_name: 'Test field 1',
                field: true,
                site_type: [{source: '56747e060e8cc07115200ee3', string: 'oil'}],
                site_aliases: ['56a939e64ddffffc1354d64b'],
                site_established_source: '56747e060e8cc07115200ee3',
                site_address: [{source: '56747e060e8cc07115200ee3', string: '123 main st'}],
                site_country: [{source: '56747e060e8cc07115200ee3', country: '56a7e6c02302369318e16bb8'}],
                site_coordinates: [{source: '56747e060e8cc07115200ee3', loc: [31.15392307, 47.50168983]}],
                site_status: [{source: '56747e060e8cc07115200ee6', string: 'development'}],
                description: '<p>yes</p><p>no</p>'
            });
           console.log('Sites created...');
        } else {
            console.log(String(sites.length), 'sites exist...')
        }
    });
};

exports.createDefaultSites = createDefaultSites;