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
    hst_options         = {customCollectionName: 'concession_hst'},
    status_enu  = {
        values: 'exploration development production on_hold inactive unknown'.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select company, concession, contract, country, project, or company group.'
    };

concessionSchema = new Schema ({
    //Metadata
    concession_name: String,
    concession_aliases: [{
        type: ObjectId,
        ref: 'Alias'}],
    concession_established_source: source,
    description: htmlSettings,
    concession_country: [fact],
    concessiom_operated_by: [fact],
    proj_company_share: [fact],
    concession_status: [{
        source: source,
        string: {
            type: String,
            enum: status_enu,
            default: 'unknown'},
        timestamp: {
            type: Date,
            default: Date.now()}}],
    concession_type: [fact], //geographic type i.e. onshore, off shore, etc.
    concession_commodity: [fact],
    concession_polygon: [fact],

    //External Links
    oo_concession_id: String,
    oo_url_api: String,
    oo_url_wiki: String,
    oo_source_date: Date,
    oo_details: mixedSchema
});

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
                concession_country: [{source: '56747e060e8cc07115200ee6', country: '56a7e6c02302369318e16bb8'}],
                concession_status: [{source: '56747e060e8cc07115200ee6', string: 'exploration'}],
                concession_type: [{source: '56747e060e8cc07115200ee6', string: 'offshore'}],
                concession_commodity: [{source: '56747e060e8cc07115200ee5', commodity: '56a13e9942c8bef50ec2e9eb'}, {source: '56747e060e8cc07115200ee5', commodity: '56a13e9942c8bef50ec2e9e8'}],
                // concession_polygon: [{
                //     polygon: {
                //         type: 'Polygon',
                //         coordinates: [ [ [ [ 11.748649323579226, -17.210253839242714 ], [ 11.307674202275505, -17.210102480701448 ], [ 11.310530637241978, -16.400985109343015 ], [ 11.812405260618743, -16.401159036494015 ], [ 11.816784178829087, -16.508152467400027 ], [ 11.813456662642464, -16.60839467745107 ], [ 11.81393202209779, -16.701299832830344 ], [ 11.80394947353795, -16.731802955904314 ], [ 11.800146597895962, -16.778231171873589 ], [ 11.784935095328619, -16.781872121336452 ], [ 11.767822154940232, -16.767763053628805 ], [ 11.741202025447263, -16.711316321438986 ], [ 11.73787450926064, -16.663961021315856 ], [ 11.729318039066445, -16.638912613779251 ], [ 11.716483333775139, -16.506785168128829 ], [ 11.709828301401888, -16.499948526745378 ], [ 11.694141439379218, -16.502227434060607 ], [ 11.66514451261008, -16.542331804535664 ], [ 11.713155817588515, -16.690372155115245 ], [ 11.73787450926064, -16.756384010602229 ], [ 11.769248233305914, -16.793249638635288 ], [ 11.762593200932665, -16.815547594428416 ], [ 11.773526468402993, -16.847397267462977 ], [ 11.771149671126858, -16.880606216395435 ], [ 11.754987449648992, -16.906077616742849 ], [ 11.749283136186163, -17.101546585959174 ], [ 11.748649323579226, -17.210253839242714 ] ] ] ]
                //     },
                //     source: '56747e060e8cc07115200ee6'
                // }],
            
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
                concession_country: [{source: '56747e060e8cc07115200ee5', country: '56a7e6c02302369318e16bb8'}],
                concession_status: [{source: '56747e060e8cc07115200ee5', string: 'exploration'}],
                concession_type: [{source: '56747e060e8cc07115200ee5', string: 'offshore'}],
                concession_commodity: [{source: '56747e060e8cc07115200ee5', commodity: '56a13e9942c8bef50ec2e9eb'}],

                //External Links
                oo_concession_id: 'junkid',
                oo_url_api: 'http://api.openoil.net/concession/BR/ES-M-525',
                oo_url_wiki: 'http://repository.openoil.net/wiki/Brazil',
                oo_source_date: new Date()
            });
            console.log('Concessions created...');
        } else {
            console.log(String(concessions.length), 'concessions exist...')
        }
    });
};

exports.createDefaultConcessions = createDefaultConcessions;