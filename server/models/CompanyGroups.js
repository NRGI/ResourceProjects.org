////////////////////
///COMPANY GROUPS///
////////////////////
'use strict';
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var companyGroupSchema, CompanyGroup,
    links           = require('./Links'),
    aliases         = require("./Aliases"),
    ObjectId        = mongoose.Schema.Types.ObjectId,
    Schema          = mongoose.Schema,
    HTML            = mongoose.Types.Html,
    htmlSettings    = {
        type: HTML,
        setting: {
            allowedTags: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'del'],
            allowedAttributes: {
                'a': ['href']
            }
        }
    };

companyGroupSchema = new Schema({
    company_group_ID: {
        type:String,
        required:'{PATH} is required!',
        indexed: true,
        unique: true},
    //Metadata
    company_group_name: String,
    company_group_aliases: [aliases],
    company_group_record_established: {
        source: ObjectId,
        date: {
            type: Date,
            default: Date.now}
    },
    notes: htmlSettings,
    //External mapping
    open_corporates_group_ID: String,
    //Links
    sources: [ObjectId]
});

//pull from open corporates
//companySchema.methods = {
////    openCorporatesPull: function() {
////
////    }
//};

CompanyGroup = mongoose.model('CompanyGroup', companyGroupSchema);

function createDefaultCompanyGroups() {
    CompanyGroup.find({}).exec(function(err, company_groups) {
        if(company_groups.length === 0) {
            console.log('no company groups');
            //CompanyGroup.create({
            //
            //});
            //CompanyGroup.create({
            //
            //});
            //CompanyGroup.create({
            //
            //});
            //CompanyGroup.create({
            //
            //});
            //CompanyGroup.create({
            //
            //});
        }
    });
};

exports.createDefaultCompanyGroups = createDefaultCompanyGroups;