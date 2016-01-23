////////////////
//LINK SCHEMA///
////////////////
'use strict';
var linkSchema,
    mongoose    = require('mongoose'),
    Schema      = mongoose.Schema,
    ObjectId    = Schema.Types.ObjectId,
    //Sources     = mongoose.model('Sources'),
    //MixedSchema = Schema.Types.Mixed,
    entity_enu  = {
        values: 'commodity company company_group concession'.split(' '),
        //values: 'contract project '.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select company, concession, contract, country, project, or company group.'
    };

linkSchema = new Schema({
    commodity: {type: ObjectId, ref: 'Commodities'},
    company: {type: ObjectId, ref: 'Companies'},
    company_group: {type: ObjectId, ref: 'CompanyGroups'},
    source: {
        type: ObjectId,
        ref: 'Sources',
        required:'{PATH} is required!'}, //source._id
    entity: { //linked entity
        type: String,
        required:'{PATH} is required!',
        enum: entity_enu},
    //company group specific
    company_group_start_date: Date,
    company_group_end_date: Date,
    //licensee specific
    ownership_stake: Number

});

module.exports = linkSchema;