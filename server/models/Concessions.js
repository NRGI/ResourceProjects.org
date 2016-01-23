////////////////////////
///CONCESSIONS SCHEMA///
////////////////////////
'use strict';
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var sourceSchema, concessionSchema, Concession,
    Schema          = mongoose.Schema,
    aliases         = require('./Aliases'),
    links           = require('./Links'),
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

sourceSchema = new Schema({
    source: source,
    //approved: Boolean,
    value: String
});

concessionSchema = new Schema ({
    //Metadata
    concession_name: String,
    concession_aliases: [aliases],
    concession_established_source: source,
    description: htmlSettings,
    concession_country: [sourceSchema],
    concession_status: [sourceSchema], //status i.e. exploration, production, etc.
    concession_type: [sourceSchema], //geographic type i.e. onshore, off shore, etc.

    //External Links
    oo_concession_id: String,
    oo_url_api: String,
    oo_url_wiki: String,
    oo_source_date: Date,
    oo_details: mixedSchema,

    //Links
    sources: [source],
    commodities: [links],
    companies: [links],
    contracts: [links],
    //projects: [links],
    //sources: [ObjectId]
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
                concession_aliases: [
                    {alias: 'Block aye',language: 'en',source: '56747e060e8cc07115200ee4'},
                    {alias: 'Block no way',language: 'fr',source: '56747e060e8cc07115200ee5'}
                ],
                concession_established_source: '56747e060e8cc07115200ee6',
                description: '<p>yes</p><p>no</p>',
                concession_country: [{source: '56747e060e8cc07115200ee6', string: 'BG'}],
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
                },

                ////Links
                sources: ['56747e060e8cc07115200ee4','56747e060e8cc07115200ee5','56747e060e8cc07115200ee6'],
                commodities: [
                    {commodity: '56a13e9942c8bef50ec2e9f1',source:'56747e060e8cc07115200ee6',entity:'commodity'},
                    {commodity: '56a13e9942c8bef50ec2e9eb',source:'56747e060e8cc07115200ee6',entity:'commodity'}
                ],
                companies: [
                    {company:'56a13a758f224f670e6a376a',source:'56747e060e8cc07115200ee6',entity:'company'}
                ],
                contracts: [
                    {contract:'56a2eb4345d114c30439ec20',source:'56747e060e8cc07115200ee6',entity:'contract'}
                ]
            });
            Concession.create({
                _id: '56a2b8236e585b731665579d',
                concession_name: 'Block B',
                concession_aliases: [
                    {alias: 'Block BBBBB',language: 'en',source: '56747e060e8cc07115200ee3'}
                ],
                concession_established_source: '56747e060e8cc07115200ee5',
                description: '<p>yes</p><p>no</p>',
                concession_country: [{source: '56747e060e8cc07115200ee5', string: 'BG'}],
                concession_status: [{source: '56747e060e8cc07115200ee5', string: 'exploration'}],
                concession_type: [{source: '56747e060e8cc07115200ee5', string: 'offshore'}],

                //External Links
                oo_concession_id: 'junkid',
                oo_url_api: 'http://api.openoil.net/concession/BR/ES-M-525',
                oo_url_wiki: 'http://repository.openoil.net/wiki/Brazil',
                oo_source_date: new Date(),

                ////Links
                sources: ['56747e060e8cc07115200ee5','56747e060e8cc07115200ee3'],
                commodities: [
                    {commodity: '56a13e9942c8bef50ec2e9f1',source:'56747e060e8cc07115200ee5',entity:'commodity'},
                    {commodity: '56a13e9942c8bef50ec2e9eb',source:'56747e060e8cc07115200ee5',entity:'commodity'}
                ],
                companies: [
                    {company:'56a13a758f224f670e6a376a',source:'56747e060e8cc07115200ee5',entity:'company'}
                ],
                contracts: [
                    {contract:'56a2eb4345d114c30439ec22',source:'56747e060e8cc07115200ee5',entity:'contract'}
                ]
            });
            console.log('***Concessions Added');
        }
    });
};

exports.createDefaultConcessions = createDefaultConcessions;