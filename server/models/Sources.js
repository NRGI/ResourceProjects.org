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
    create_author: [{
            type: ObjectId,
            ref: 'User'}],
    create_date: {
        type: Date,
        default: Date.now}
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
                create_author: '569976c21dad48f614cc8125'
            });
            Source.create({
                _id: '56747e060e8cc07115200ee5',
                source_name: 'source 2',
                source_type: 'source id 2',
                source_type_id: 'source_id_2',
                source_url: 'google.com',
                source_archive_url: 'sheets.google.com',
                source_notes: 'notes notes notes notes notes notes notes notes notes notes notes notes notes notes',
                create_author: '569976c21dad48f614cc8126'
            });
            Source.create({
                _id: '56747e060e8cc07115200ee6',
                source_name: 'source 3',
                source_type: 'source id 3',
                source_type_id: 'source_id_3',
                source_url: 'google.com',
                source_archive_url: 'sheets.google.com',
                source_notes: 'notes notes notes notes notes notes notes notes notes notes notes notes notes notes',
                create_author: '569976c21dad48f614cc8126'
            });
            Source.create({
                _id: '56747e060e8cc07115200ee3',
                source_name: 'source 4',
                source_type: 'source id 4',
                source_type_id: 'source_id_4',
                source_url: 'google.com',
                source_archive_url: 'sheets.google.com',
                source_notes: 'notes notes notes notes notes notes notes notes notes notes notes notes notes notes'
            });
            console.log('Sources created...');
        }
    });
};

exports.createDefaultSources = createDefaultSources;