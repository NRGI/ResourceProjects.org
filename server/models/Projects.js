/////////////////////
///PROJECTS SCHEMA///
/////////////////////
'use strict';
var mongoose = require('mongoose'),
    searchPlugin = require('mongoose-search-plugin');
require('mongoose-html-2').loadType(mongoose);


var projectSchema, Project,
    Schema          = mongoose.Schema,
    fact            = require("./Facts"),
    ObjectId        = Schema.Types.ObjectId,
    source          = {type: ObjectId, ref: 'Source'},
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
    hst_options     = {customCollectionName: 'proj_hst'},
    status_enu  = {
        values: 'exploration development production on_hold inactive unknown'.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select exploration, development, production, on hold, inactive or unknown.'
    },
    type_enu  = {
       values: 'mining oil'.split(' '),
       message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select mining or oil.'
    };


projectSchema = new Schema({
    //TODO add regex validator
    proj_id: String,
    proj_name: String,
    proj_aliases: [{
        type: ObjectId,
        ref: 'Alias'}],
    proj_established_source: source,
    proj_country: [fact],
    // proj_type: [fact],
    proj_type: [{
        source: source,
        string: {
            type: String,
            enum: type_enu},
        timestamp: {
            type: Date,
            default: Date.now()}}],
    proj_commodity: [fact],
    // proj_site_name: [fact],
    proj_address: [fact],
    proj_coordinates: [fact],
    proj_operated_by: [fact],
    proj_company_share: [fact],
    proj_status: [{
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
projectSchema.plugin(searchPlugin,{
    fields:['proj_name']
});
Project = mongoose.model('Project', projectSchema);

function createDefaultProjects() {
    Project.find({}).count().exec(function(err, project_count) {
        if(project_count === 0) {
            Project.create({
                _id:'56a930f41b5482a31231ef42',
                proj_id: 'ad-jufi-yqceeo',
                proj_name: 'Jubilee Field',
                proj_aliases: ['56a939e649434cfc1354d64b','56a939e649434cfc1354d64c'],
                proj_established_source: '56747e060e8cc07115200ee3',
                proj_country: [{source: '56747e060e8cc07115200ee3', country: '56a7e6c02302369318e16bb8'}],
                proj_type: [{source: '56747e060e8cc07115200ee3', string: 'mining'}],
                proj_commodity: [{source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9e8'}],
                proj_address: [{source: '56747e060e8cc07115200ee3', string: '123 main st'}],
                proj_coordinates: [{source: '56747e060e8cc07115200ee3', loc: [11.15392307, 17.50168983]}],
                proj_status: [{source: '56747e060e8cc07115200ee3', string: 'exploration'}],
                description: '<p>yes</p><p>no</p>'
            });
            Project.create({
                _id:'56a930f41b5482a31231ef43',
                proj_id: 'ad-agne-11geq3',
                proj_name: 'Agnes',
                proj_aliases: ['56a939e649434cfc1354d64d'],
                proj_established_source: '56747e060e8cc07115200ee6',
                proj_country: [{source: '56747e060e8cc07115200ee3', country: '56a7e6c02302369318e16bb8'}],
                proj_type: [{source: '56747e060e8cc07115200ee6', string: 'oil'}],
                proj_commodity: [{source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9e8'}, {source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9eb'},{source: '56747e060e8cc07115200ee6', commodity: '56a13e9942c8bef50ec2e9eb'}],
                proj_coordinates: [{source: '56747e060e8cc07115200ee6', loc: [79.22885591,  -44.84381911]}],
                proj_status: [{source: '56747e060e8cc07115200ee6', string: 'development'}],
                description: '<p>yes</p><p>no</p>',
            });
            Project.create({
                _id:'56a930f41b5482a31231ef44',
                proj_id: 'ag-proc-11geq3',
                proj_name: 'Project C',
                proj_aliases: ['56a939e649434cfc1354d64e'],
                proj_established_source: '56747e060e8cc07115200ee5',
                proj_country: [{source: '56747e060e8cc07115200ee5', country: '56a8d7d08e7079da05d6b542'}],
                proj_type: [{source: '56747e060e8cc07115200ee5', string: 'mining'}],
                proj_coordinates: [{source: '56747e060e8cc07115200ee5', loc: [25.17521251, -13.32094082]}],
                proj_status: [{source: '56747e060e8cc07115200ee5', string: 'on_hold'}],
                description: '<p>yes</p><p>no</p>'
            });
            Project.create({
                _id:'56a930f41b5482a31231ef45',
                proj_id: 'ae-alri-yqcee',
                proj_name: 'Alpamarca Rio Pallanga',
                proj_established_source: '56747e060e8cc07115200ee6',
                proj_country: [{source: '56747e060e8cc07115200ee6', country: '56a7e6c02302369318e16bb9'}],
                proj_type: [{source: '56747e060e8cc07115200ee6', string: 'oil'}],
                proj_coordinates: [{source: '56747e060e8cc07115200ee6', loc: [-154.09667961, -43.52395855]}],
                proj_status: [{source: '56747e060e8cc07115200ee6', string: 'production'}],
                description: '<p>yes</p><p>no</p>'
            });
            Project.find({}).count().exec(function(err, project_count) {
                console.log(String(project_count), 'projects created...')
            });
        } else {
            console.log(String(project_count), 'projects exist...')
        }
    });
};
function getInitProjectCount() {
    Project.find({}).count().exec(function(err, project_count) {
        console.log(String(project_count), 'projects exist...')
    });
};

exports.getInitProjectCount = getInitProjectCount;
exports.createDefaultProjects = createDefaultProjects;