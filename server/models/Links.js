////////////////
//LINK SCHEMA///
////////////////
'use strict';
var linkSchema, Link,
    mongoose    = require('mongoose'),
    Schema      = mongoose.Schema,
    ObjectId    = Schema.Types.ObjectId,
    //Sources     = mongoose.model('Sources'),
    //MixedSchema = Schema.Types.Mixed,
    entity_enu  = {
        values: 'commodity company company_group concession contract'.split(' '),
        //values: ' project '.split(' '),
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

//Link = mongoose.model('Link', linkSchema);
//
//function createDefaultLinks() {
//    Link.find({}).exec(function(err, links) {
//        if(links.length === 0) {
//            Link.create({
//
//            });
//        };
//    });
//};
//
//exports.createDefaultLinks = createDefaultLinks;