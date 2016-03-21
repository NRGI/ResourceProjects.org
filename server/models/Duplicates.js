////////////////
//LINK SCHEMA///
////////////////
'use strict';
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var duplicateSchema, Duplicate,
    deepPopulate    = require('mongoose-deep-populate')(mongoose),
    Schema          = mongoose.Schema,
    ObjectId        = Schema.Types.ObjectId,
    entity_enu      = {
        values: 'commodity company company_group concession contract project production site transfer'.split(' '),
        //values: ' project '.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select company, concession, contract, country, project, site, production transfer, or company group.'
    };

duplicateSchema = new Schema({
    original: {type: ObjectId},
    duplicate: {type: ObjectId},
    resolved: {type: Boolean},
    isDuplicate: {type: Boolean, default: true},
    resolved_by: {type: ObjectId, ref: 'User'},
    created_date: {type: Date, default: Date.now},
    created_from: {type: ObjectId, ref: 'Action'},
    resolved_date: {type: Date, default: Date.now},
    notes: {type: String},
    entity: {
        type: String,
        required:'{PATH} is required!',
        enum: entity_enu}
});

duplicateSchema.plugin(deepPopulate);

Duplicate = mongoose.model('Duplicate', duplicateSchema);

function createDefaultDuplicates() {
    Duplicate.find({}).exec(function(err, duplicates) {
        if(duplicates.length === 0) {
            Duplicate.create({
                original:'56a13a758f224f670e6a376a',
                duplicate:'56a13a758d224f670e6b377a',
                resolved: false,
                created_from: '56737e170e4ac07115211ee4',
                entity:'company'
            }, function(err, model) {
            console.log(err);
            });
            console.log('Test duplicate created...');
        } else {
            console.log(String(duplicates.length), 'duplicate(s) exist...')
        }
    });
};

exports.createDefaultDuplicates = createDefaultDuplicates;