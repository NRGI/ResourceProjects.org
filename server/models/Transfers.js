///////////
//TRANSFER
///////////
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var transferSchema, Transfer,
    Schema          = mongoose.Schema,
//    fact            = require("./Facts"),
//    ObjectId        = Schema.Types.ObjectId,
//    mixedSchema     = Schema.Types.Mixed,
//    source          = {type: ObjectId, ref: 'Sources'},
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
    hst_options         = {customCollectionName: 'transfer_hst'};

transferSchema = new Schema ({
    ////Metadata
    //concession_name: String,
    //concession_aliases: [{
    //    type: ObjectId,
    //    ref: 'Alias'}],
    //concession_established_source: source,
    //description: htmlSettings,
    //concession_country: [fact],
    //concession_status: [fact], //status i.e. exploration, production, etc.
    //concession_type: [fact], //geographic type i.e. onshore, off shore, etc.
    //concession_commodity: [fact],
    //
    ////External Links
    //oo_concession_id: String,
    //oo_url_api: String,
    //oo_url_wiki: String,
    //oo_source_date: Date,
    //oo_details: mixedSchema
});

transferSchema.plugin(mongooseHistory, hst_options);

Transfer = mongoose.model('Transfer', transferSchema);


//    - Payment Type - payment or reciept
//    - Type Code
//    - Source
//    - Country
//    - Country Code
//    - Company Name
//    - Report Line Item
//    - Project Name
//    - transfer Year
//    - transfer Level - country or project
//    - transfer Unit / Currency
//    - Accounting Basis
//    - transfer Value
//    - transfer note
//    - Government entity
//    - Government entity identifier


// Year
// Paid by
// Paid to
// Payment or receipt?