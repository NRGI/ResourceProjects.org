/////////////////////////
//IMPORTSOURCES SCHEMA///
/////////////////////////
'use strict';
var mongoose = require('mongoose');

var importSourceSchema, ImportSource,
    Schema      = mongoose.Schema,
    ObjectId    = Schema.Types.ObjectId,
    entity_enu      = {
        values: 'company company_group concession contract project production site transfer source link'.split(' '),
        //values: ' project '.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select company, company_group, concession, contract, project, site, production, transfer, source or link.'
    };

importSourceSchema = new Schema({
    obj: {type: ObjectId}, //No ref
    actions: [{type: ObjectId, ref: 'Action'}],
    entity: {
        type: String,
        required:'{PATH} is required!',
        enum: entity_enu}
});

ImportSource = mongoose.model('ImportSource', importSourceSchema);

function getInitImportSourceCount() {
    ImportSource.find({}).count().exec(function(err, is_count) {
        console.log(String(is_count), 'import source(s) exist...')
    });
};

exports.getInitImportSourceCount = getInitImportSourceCount;


