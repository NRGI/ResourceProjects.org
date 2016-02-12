///////////
//TRANSFER
///////////
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var transferSchema, Transfer,
    Schema          = mongoose.Schema,
    fact            = require("./Facts"),
//    ObjectId        = Schema.Types.ObjectId,
//    mixedSchema     = Schema.Types.Mixed,
    source          = {type: ObjectId, ref: 'Sources'},
//    HTML            = mongoose.Types.Html,
//    htmlSettings    = {
//        type: HTML,
//        setting: {
//            allowedTags: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'del'],
//            allowedAttributes: {
//                'a': ['href']
//            }
//        }
//    },
    mongooseHistory = require('mongoose-history'),
    hst_options         = {customCollectionName: 'transfer_hst'},
    transfer_audit_type_enu      = {
        values: 'government_receipt company_payment'.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select government_receipt or company_payment.'
    };

transferSchema = new Schema ({
    transfer_type: String,
    source: source,
    transfer_audit_type: {
        type: String,
        required:'{PATH} is required!',
        enum: transfer_audit_type_enu},
    transfer_year: Number,
    transfer_unit: String,
    transfer_value: Number,
    //transfer_note: htmlSettings,
    //transfer_note: String,
    tranfer_gov_entity: String,
    tranfer_gov_entity_id: String,

    //links
    //country
    //companies
    //project

//    - Report Line Item
//    - transfer Level - country or project
//    - Accounting Basis

});

transferSchema.plugin(mongooseHistory, hst_options);

Transfer = mongoose.model('Transfer', transferSchema);





// Year
// Paid by
// Paid to
// Payment or receipt?