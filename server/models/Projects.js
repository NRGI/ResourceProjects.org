/////////////////////
///PROJECTS SCHEMA///
/////////////////////
'use strict';
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var projectSchema, Project,
    deepPopulate    = require('mongoose-deep-populate')(mongoose),
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
    hst_options     = {customCollectionName: 'proj_hst'};
    //type_enu  = {
    //    values: 'mining oil'.split(' '),
    //    //values: ' project '.split(' '),
    //    message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select company, concession, contract, country, project, or company group.'
    //};

projectSchema = new Schema({
    proj_name: String,
    proj_aliases: [{
        type: ObjectId,
        ref: 'Alias'}],
    proj_established_source: source,
    proj_country: [fact],
    proj_type: [fact],
    proj_commodity: [fact],
    proj_site_name: [fact],
    proj_address: [fact],
    proj_coordinates: [fact],
    proj_status: [fact],
    description: htmlSettings,

    //Links
    //sources: [source],
    //commodities: [{
    //    type: ObjectId,
    //    ref: 'Link'}],
    //concessions: [{
    //    type: ObjectId,
    //    ref: 'Link'}],
    //companies: [{
    //    type: ObjectId,
    //    ref: 'Link'}],
    //contracts: [{
    //    type: ObjectId,
    //    ref: 'Link'}]
});
//
//projectSchema.methods = {
////    authenticate: function(passwordToMatch) {
////        return encrypt.hashPwd(this.salt, passwordToMatch) === this.hashed_pwd;
////    },
////    hasRole: function(role) {
////        return this.roles.indexOf(role) > -1;
////    }
//};

projectSchema.plugin(mongooseHistory, hst_options);
projectSchema.plugin(deepPopulate);
Project = mongoose.model('Project', projectSchema);

function createDefaultProjects() {
    Project.find({}).exec(function(err, projects) {
        if(projects.length === 0) {
            Project.create({
                _id:'56a930f41b5482a31231ef42',
                proj_name: 'Procect A',
                proj_aliases: ['56a939e649434cfc1354d64b','56a939e649434cfc1354d64c'],
                proj_established_source: '56747e060e8cc07115200ee3',
                proj_country: [{source: '56747e060e8cc07115200ee3', country: '56a7e6c02302369318e16bb8'}],
                proj_type: [{source: '56747e060e8cc07115200ee3', string: 'mining'}],
                proj_commodity: [{source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9e8'}],
                proj_site_name: [{source: '56747e060e8cc07115200ee5', string: 'site name a'}],
                proj_address: [{source: '56747e060e8cc07115200ee3', string: '123 main st'}],
                proj_coordinates: [{source: '56747e060e8cc07115200ee3', loc: [11.15392307, 17.50168983]}],
                proj_status: [{source: '56747e060e8cc07115200ee3', string: 'exploration'}],
                description: '<p>yes</p><p>no</p>'
            });
            Project.create({
                _id:'56a930f41b5482a31231ef43',
                proj_name: 'Procect B',
                proj_aliases: ['56a939e649434cfc1354d64d'],
                proj_established_source: '56747e060e8cc07115200ee6',
                proj_country: [{source: '56747e060e8cc07115200ee6', country: '56a7e6c02302369318e16bb9'}],
                proj_type: [{source: '56747e060e8cc07115200ee6', string: 'oil'}],
                proj_commodity: [{source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9e8'}, {source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9eb'},{source: '56747e060e8cc07115200ee6', commodity: '56a13e9942c8bef50ec2e9eb'}],
                proj_site_name: [{source: '56747e060e8cc07115200ee6', string: 'site name b'}],
                proj_coordinates: [{source: '56747e060e8cc07115200ee6', loc: [79.22885591,  -44.84381911]}],
                proj_status: [{source: '56747e060e8cc07115200ee6', string: 'discovery'}],
                description: '<p>yes</p><p>no</p>',
            });
            Project.create({
                _id:'56a930f41b5482a31231ef44',
                proj_name: 'Procect C',
                proj_aliases: ['56a939e649434cfc1354d64e'],
                proj_established_source: '56747e060e8cc07115200ee5',
                proj_country: [{source: '56747e060e8cc07115200ee5', country: '56a8d7d08e7079da05d6b542'}],
                proj_type: [{source: '56747e060e8cc07115200ee5', string: 'mining'}],
                proj_site_name: [{source: '56747e060e8cc07115200ee5', string: 'site name c'}],
                proj_coordinates: [{source: '56747e060e8cc07115200ee5', loc: [25.17521251, -13.32094082]}],
                proj_status: [{source: '56747e060e8cc07115200ee5', string: 'discovery'}],
                description: '<p>yes</p><p>no</p>'
            });
            Project.create({
                _id:'56a930f41b5482a31231ef45',
                proj_name: 'Procect D',
                proj_established_source: '56747e060e8cc07115200ee6',
                proj_country: [{source: '56747e060e8cc07115200ee6', country: '56a7e6c02302369318e16bb9'}],
                proj_type: [{source: '56747e060e8cc07115200ee6', string: 'oil'}],
                proj_site_name: [{source: '56747e060e8cc07115200ee6', string: 'site name d'}],
                proj_coordinates: [{source: '56747e060e8cc07115200ee6', loc: [-154.09667961, -43.52395855]}],
                proj_status: [{source: '56747e060e8cc07115200ee6', string: 'spent'}],
                description: '<p>yes</p><p>no</p>'
            });
            console.log('Projects created...');
        }
    });
};

exports.createDefaultProjects = createDefaultProjects;