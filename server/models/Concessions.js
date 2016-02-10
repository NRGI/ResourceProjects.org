////////////////////////
///CONCESSIONS SCHEMA///
////////////////////////
'use strict';
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var sourceSchema, concessionSchema, Concession,
    Schema          = mongoose.Schema,
    fact            = require("./Facts"),
    ObjectId        = Schema.Types.ObjectId,
    mixedSchema     = Schema.Types.Mixed,
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
    hst_options         = {customCollectionName: 'concession_hst'};

concessionSchema = new Schema ({
    //Metadata
    concession_name: String,
    concession_aliases: [{
        type: ObjectId,
        ref: 'Alias'}],
    concession_established_source: source,
    description: htmlSettings,
    concession_country: [fact],
    concession_status: [fact], //status i.e. exploration, production, etc.
    concession_type: [fact], //geographic type i.e. onshore, off shore, etc.

    //External Links
    oo_concession_id: String,
    oo_url_api: String,
    oo_url_wiki: String,
    oo_source_date: Date,
    oo_details: mixedSchema,

    //Links
    //sources: [source],
    commodities: [{
        type: ObjectId,
        ref: 'Link'}],
    companies: [{
        type: ObjectId,
        ref: 'Link'}],
    contracts: [{
        type: ObjectId,
        ref: 'Link'}],
    projects: [{
        type: ObjectId,
        ref: 'Link'}],
});

////Open Oil pull
//concessionSchema.methods = {
//    openOilPull: function() {
//
//    },
//};

concessionSchema.plugin(mongooseHistory, hst_options);

Concession = mongoose.model('Concession', concessionSchema);

function createDefaultConcessions() {
    Concession.find({}).exec(function(err, concessions) {
        if(concessions.length === 0) {
            Concession.create({
                _id: '56a2b8236e585b7316655794',
                concession_name: 'Block A',
                concession_aliases: ['56a7d75bd9caddb614ab02b3','56a7d75bd9caddb614ab02b4'],
                concession_established_source: '56747e060e8cc07115200ee6',
                description: '<p>yes</p><p>no</p>',
                concession_country: [{source: '56747e060e8cc07115200ee6', string: '56a7e6c02302369318e16bb8'}],
                concession_status: [{source: '56747e060e8cc07115200ee6', string: 'exploration'}],
                concession_type: [{source: '56747e060e8cc07115200ee6', string: 'offshore'}],

                //External Links
                oo_concession_id: 'junkid',
                oo_url_api: 'http://api.openoil.net/concession/BR/ES-M-525',
                oo_url_wiki: 'http://repository.openoil.net/wiki/Brazil',
                oo_source_date: new Date(),
                oo_details: {
                    'Concession\u00e1rios': '*Petrobras - 65%, Inpex - 15%, PTTEP Brasil - 20%',
                    'Contrato': 'BM-ES-23',
                    'Observacao': '',
                    'Operador': 'Petrobras',
                    'Vencimento1\u00ba': '20.01.2012'
                }
            });
            Concession.create({
                _id: '56a2b8236e585b731665579d',
                concession_name: 'Block B',
                concession_aliases: ['56a7d75bd9caddb614ab02b5'],
                concession_established_source: '56747e060e8cc07115200ee5',
                description: '<p>yes</p><p>no</p>',
                concession_country: [{source: '56747e060e8cc07115200ee5', string: '56a7e6c02302369318e16bb8'}],
                concession_status: [{source: '56747e060e8cc07115200ee5', string: 'exploration'}],
                concession_type: [{source: '56747e060e8cc07115200ee5', string: 'offshore'}],

                //External Links
                oo_concession_id: 'junkid',
                oo_url_api: 'http://api.openoil.net/concession/BR/ES-M-525',
                oo_url_wiki: 'http://repository.openoil.net/wiki/Brazil',
                oo_source_date: new Date()
            });
            console.log('Concessions created...');
        }
    });
};

exports.createDefaultConcessions = createDefaultConcessions;