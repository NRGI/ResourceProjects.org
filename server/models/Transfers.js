///////////
//TRANSFER
///////////
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var transferSchema, Transfer,
    deepPopulate    = require('mongoose-deep-populate')(mongoose),
    Schema          = mongoose.Schema,
    fact            = require("./Facts"),
    ObjectId        = Schema.Types.ObjectId,
//    mixedSchema     = Schema.Types.Mixed,
    source          = {type: ObjectId, ref: 'Sources'},
    //HTML            = mongoose.Types.Html,
    //htmlSettings    = {
    //    type: HTML,
    //    setting: {
    //        allowedTags: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'del'],
    //        allowedAttributes: {
    //            'a': ['href']
    //        }
    //    }
    //},
    mongooseHistory = require('mongoose-history'),
    hst_options         = {customCollectionName: 'transfer_hst'},
    transfer_audit_type_enu      = {
        values: 'government_receipt company_payment'.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select government_receipt or company_payment.'
    },
    transfer_level_enu      = {
        values: 'country project'.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select country or project.'
    },
    transfer_accounting_basis_enu      = {
        values: 'cash accrual'.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select cash or accrual.'
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
    transfer_company: {
        type: ObjectId,
        ref: 'Company'
    },
    transfer_country: {
        type: ObjectId,
        ref: 'Country'
    },
    //transfer_concession: {
    //    type: ObjectId,
    //    ref: 'Concession'
    //},
    //transfer_project: {
    //    type: ObjectId,
    //    ref: 'Project'
    //},
    //transfer_note: htmlSettings,
    transfer_note: String,
    transfer_gov_entity: String,
    transfer_gov_entity_id: String,
    transfer_line_item: String,
    transfer_level: {
        type: String,
        enum: transfer_level_enu},
    transfer_accounting_basis: {
        type: String,
        enum: transfer_accounting_basis_enu}
});




transferSchema.plugin(mongooseHistory, hst_options);
transferSchema.plugin(deepPopulate);
Transfer = mongoose.model('Transfer', transferSchema);


function createDefaultTransfers() {
    Transfer.find({}).exec(function (err, transfers) {
        if (transfers.length === 0) {
            Transfer.create({
                _id: '56be54f9d7bff9dd1c93c985',
                transfer_type: 'Total',
                source: '56747e060e8cc07115200ee4',
                transfer_audit_type: 'government_receipt',
                transfer_year: 2009,
                transfer_unit: 'USD',
                transfer_value: 1394922844,
                transfer_company: '56a13a758f224f670e6a376e',
                transfer_country: '56a7e6c02302369318e16bb8',
                transfer_concession: '56a2b8236e585b7316655794',
                //transfer_note: '',
                //transfer_note: '',
                //tranfer_gov_entity: '',
                //tranfer_gov_entity_id: '',
                //transfer_line_item: '',
                transfer_level: 'project',
                transfer_accounting_basis: 'cash'
            });
            Transfer.create({
                _id: '56be54f9d7bff9921c93c98a',
                transfer_type: 'Total',
                source: '56747e060e8cc07115200ee4',
                transfer_audit_type: 'government_receipt',
                transfer_year: 2012,
                transfer_unit: 'USD',
                transfer_value: 4102721984,
                transfer_company: '56a13a758f224f670e6a376e',
                transfer_country: '56a7e6c02302369318e16bb8',
                transfer_concession: '56a2b8236e585b7316655794',
                //transfer_note: '',
                //transfer_note: '',
                //tranfer_gov_entity: '',
                //tranfer_gov_entity_id: '',
                //transfer_line_item: '',
                transfer_level: 'project',
                transfer_accounting_basis: 'cash'
            });
            Transfer.create({
                _id: '56be54f9d7bff9921c93c988',
                transfer_type: 'Total',
                source: '56747e060e8cc07115200ee4',
                transfer_audit_type: 'company_payment',
                transfer_year: 2012,
                transfer_unit: 'USD',
                transfer_value: 4102721984,
                transfer_company: '56a13a758f224f670e6a376e',
                transfer_country: '56a7e6c02302369318e16bb8',
                transfer_concession: '56a2b8236e585b7316655794',
                //transfer_note: '',
                //transfer_note: '',
                //tranfer_gov_entity: '',
                //tranfer_gov_entity_id: '',
                //transfer_line_item: '',
                transfer_level: 'project',
                transfer_accounting_basis: 'cash'
            });
            Transfer.create({
                _id: '56be54f9d7bff9921c93c986',
                transfer_type: 'Total',
                source: '56747e060e8cc07115200ee4',
                transfer_audit_type: 'government_receipt',
                transfer_year: 2010,
                transfer_unit: 'USD',
                transfer_value: 1394922844,
                transfer_company: '56a13a758f224f670e6a376e',
                transfer_country: '56a7e6c02302369318e16bb8',
                transfer_concession: '56a2b8236e585b7316655794',
                //transfer_note: '',
                //transfer_note: '',
                //tranfer_gov_entity: '',
                //tranfer_gov_entity_id: '',
                //transfer_line_item: '',
                transfer_level: 'project',
                transfer_accounting_basis: 'cash'
            });
            Transfer.create({
                _id: '56be54f9d7bff9921c93c987',
                transfer_type: 'Total',
                source: '56747e060e8cc07115200ee4',
                transfer_audit_type: 'government_receipt',
                transfer_year: 2011,
                transfer_unit: 'USD',
                transfer_value: 1394922844,
                transfer_company: '56a13a758f224f670e6a376e',
                transfer_country: '56a7e6c02302369318e16bb8',
                transfer_concession: '56a2b8236e585b7316655794',
                //transfer_note: '',
                //transfer_note: '',
                //tranfer_gov_entity: '',
                //tranfer_gov_entity_id: '',
                //transfer_line_item: '',
                transfer_level: 'project',
                transfer_accounting_basis: 'cash'
            });
            Transfer.create({
                _id: '56be54f9d7bff9921c93c989',
                transfer_type: 'Total',
                source: '56747e060e8cc07115200ee4',
                transfer_audit_type: 'government_receipt',
                transfer_year: 2015,
                transfer_unit: 'USD',
                transfer_value: 1394922844,
                transfer_company: '56a13a758f224f670e6a376e',
                transfer_country: '56a7e6c02302369318e16bb8',
                transfer_concession: '56a2b8236e585b7316655794',
                //transfer_note: '',
                //transfer_note: '',
                //tranfer_gov_entity: '',
                //tranfer_gov_entity_id: '',
                //transfer_line_item: '',
                transfer_level: 'project',
                transfer_accounting_basis: 'cash'
            });
            console.log('Projects created...');
        }
    });
}

exports.createDefaultTransfers = createDefaultTransfers;