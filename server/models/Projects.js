/////////////////////
///PROJECTS SCHEMA///
/////////////////////
'use strict';
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var projectSchema, Project,
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
    country: [fact],
    proj_type: [fact],
    proj_site_name: [fact],
    proj_address: [fact],
    proj_coordinates: [fact],
    proj_status: [fact],
    description: htmlSettings,

    ////Links
    //sources: [source],
    //commodities: [links],
    //concessions: [links],
    //companies: [links],
    //contracts: [links]
});

projectSchema.methods = {
//    authenticate: function(passwordToMatch) {
//        return encrypt.hashPwd(this.salt, passwordToMatch) === this.hashed_pwd;
//    },
//    hasRole: function(role) {
//        return this.roles.indexOf(role) > -1;
//    }
};

projectSchema.plugin(mongooseHistory, hst_options);

Project = mongoose.model('Project', projectSchema);

function createDefaultProjects() {
    Project.find({}).exec(function(err, projects) {
        if(projects.length === 0) {
            console.log('***No Projects...');
            //Project.create({
            //
            //});
            //Project.create({
            //
            //});
            //Project.create({
            //
            //});
            //Project.create({
            //
            //});
            //Project.create({
            //
            //});
        }
    });
};

exports.createDefaultProjects = createDefaultProjects;