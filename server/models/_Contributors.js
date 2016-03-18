///////////////
//CONTRIBUTORS
///////////////
'use strict'
var contributorSchema, Contributor,
    mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId,
    Schema   = mongoose.Schema;

contributorSchema = new Schema ({
    contributor_first_name: String,
    contributor_last_name: String,
    contributor_email: String,
    contributor_URL: String,
    source_links: [ObjectId]
});

Contributor = mongoose.model('Contributor', contributorSchema);

function createDefaultContributors() {
    Contributor.find({}).exec(function(err, contributors) {
        if(contributors.length === 0) {
            console.log('no contributors');
            //Contributor.create({
            //
            //});
            //Contributor.create({
            //
            //});
            //Contributor.create({
            //
            //});
            //Contributor.create({
            //
            //});
            //Contributor.create({
            //
            //});
        }
    });
};

exports.createDefaultContributors = createDefaultContributors;