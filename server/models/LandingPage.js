//////////////////
//SOURCE SCHEMA///
//////////////////
'use strict';
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var landingPageSchema, LandingPage,
    Schema          = mongoose.Schema,
    ObjectId        = Schema.Types.ObjectId,
    HTML            = mongoose.Types.Html,
    htmlSettings    = {
        type: HTML,
        setting: {
            allowedTags: [ 'h1', 'h2','h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
                'nl', 'li', 'b', 'i','u', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
                'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre','img','pre','strike'],
            allowedAttributes: {
                '*': [ 'href', 'align', 'alt', 'center', 'bgcolor','style' ],
                a: [ 'href', 'name', 'target' ],
                img: [ 'src','class']
            },
            selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],
            allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ],
            allowedSchemesByTag: {}
        }
    };

landingPageSchema = new Schema({
    landing_text: htmlSettings
});

LandingPage = mongoose.model('LandingPage', landingPageSchema);

function createDefaultLandingPage() {
    LandingPage.find({}).count().exec(function(err, landing_page_count) {
        if(landing_page_count === 0) {
            LandingPage.create({_id:"57639b9e2b50bbd70c2ff251",landing_text:'<h2>An open-source data repository on oil, gas and mining projects</h2><p>Across the world, governments and companies are involved in natural resource projects, generating billions of dollars. Continued effort in making the sector more transparent has led to an increasing amount of information becoming available, but this information is currently underutilized partly due to difficulties and costs in accessing it.</p><p>ResourceProjects.org provides a platform to collect and search extractive project information using open data. It aims to harvest data on project-by-project payments to governments based on recent mandatory disclosure legislation in the EU, Norway, US and Canada as well as in EITI reports. ResourceProjects.org then links that data to associated information such as project location and status, associated contracts, companies and licenses from a variety of government and industry sources. The platform will make it easier for journalists, CSOs, researchers and government officials to search, access and download relevant data originating from these various sources.</p><p>ResourceProjects.org is a prototype under development. Current data on the site is illustrative only, and no warranty of its accuracy or completeness is provided. ResourceProjects.org is licensed under CC-BY-SA.</p>'});
           } else {
            console.log(String(landing_page_count), 'landing page exist...')
        }
    });
};

exports.createDefaultLandingPage = createDefaultLandingPage;