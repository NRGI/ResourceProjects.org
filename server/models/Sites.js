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
    hst_options     = {customCollectionName: 'site_hst'};
////type_enu  = {
////    values: 'mining oil'.split(' '),
////    //values: ' project '.split(' '),
////    message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select company, concession, contract, country, project, or company group.'
////};
//
siteSchema = new Schema({
    site_name: String,
    field: Boolean,
    site_type: [fact],
    site_aliases: [{
        type: ObjectId,
        ref: 'Alias'}],
    site_established_source: source,
    site_address: [fact],
    site_country: [fact],
    site_coordinates: [fact],
    description: htmlSettings
//    site_status: [fact],
});

siteSchema.plugin(mongooseHistory, hst_options);
//projectSchema.plugin(searchPlugin,{
//    fields:['proj_name']
//});

Site = mongoose.model('Site', siteSchema);

function createDefaultSites() {
    Site.find({}).exec(function(err, sites) {
        if(sites.length === 0) {
//            Site.create({
//                _id:'56a930f41b5482a31231ef42',
//                proj_name: 'Procect A',
//                proj_aliases: ['56a939e649434cfc1354d64b','56a939e649434cfc1354d64c'],
//                proj_established_source: '56747e060e8cc07115200ee3',
//                proj_country: [{source: '56747e060e8cc07115200ee3', country: '56a7e6c02302369318e16bb8'}],
//                proj_type: [{source: '56747e060e8cc07115200ee3', string: 'mining'}],
//                proj_commodity: [{source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9e8'}],
//                proj_site_name: [{source: '56747e060e8cc07115200ee5', string: 'site name a'}],
//                proj_address: [{source: '56747e060e8cc07115200ee3', string: '123 main st'}],
//                proj_coordinates: [{source: '56747e060e8cc07115200ee3', loc: [11.15392307, 17.50168983]}],
//                proj_status: [{source: '56747e060e8cc07115200ee3', string: 'exploration'}],
//                description: '<p>yes</p><p>no</p>'
//            });
//            console.log('Sites created...');
        }
    });
};

exports.createDefaultSites = createDefaultSites;