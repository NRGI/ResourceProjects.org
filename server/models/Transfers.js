///////////
//TRANSFER
///////////
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var transferSchema, Transfer,
    deepPopulate    = require('mongoose-deep-populate')(mongoose),
    Schema          = mongoose.Schema,
    ObjectId        = Schema.Types.ObjectId,
    source          = {type: ObjectId, ref: 'Source'},
    company         = {type: ObjectId, ref: 'Company', default: null}, //null default makes controller life much easier as company is not always present
    country         = {type: ObjectId, ref: 'Country'},
    project         = {type: ObjectId, ref: 'Project'},
    site            = {type: ObjectId, ref: 'Site'},
    concession      = {type: ObjectId, ref: 'Concession'},
    mongooseHistory = require('mongoose-history'),
    hst_options         = {customCollectionName: 'transfer_hst'},
    transfer_audit_type_enu      = {
        values: 'government_receipt company_payment reconciled unknown'.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select government_receipt, company_payment, reconciled or unknown.'
    },
    transfer_level_enu      = {
        values: 'country company project site field concession unknown'.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select concession, country, site, field, project, company or unknown.'
    },
    transfer_accounting_basis_enu      = {
        values: 'cash accrual unknown'.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select cash or accrual.'
    };

transferSchema = new Schema ({
    transfer_type: String,
    transfer_type_classification: String,
    source: source,
    transfer_audit_type: {
        type: String,
        required:'{PATH} is required!',
        enum: transfer_audit_type_enu},
    transfer_year: Number,
    transfer_unit: String,
    transfer_value: Number,
    //transfer_note: htmlSettings,
    transfer_note: String,
    transfer_label: String,
    transfer_gov_entity: String,
    transfer_gov_entity_id: String,
    //transfer_line_item: String,
    transfer_level: {
        type: String,
        enum: transfer_level_enu},
    transfer_accounting_basis: {
        type: String,
        enum: transfer_accounting_basis_enu},
    company: company,
    country: country,
    project: project,
    site: site,
    concession: concession
});

transferSchema.plugin(mongooseHistory, hst_options);
transferSchema.plugin(deepPopulate);
Transfer = mongoose.model('Transfer', transferSchema);

function createDefaultTransfers() {
    Transfer.find({}).count().exec(function (err, transfer_count) {
        if (transfer_count === 0) {
            Transfer.create({
                _id: '56be54f9d7bff9dd1c93c985',
                transfer_type: 'Total',
                source: '56747e060e8cc07115200ee4',
                transfer_audit_type: 'government_receipt',
                transfer_year: 2009,
                transfer_unit: 'USD',
                transfer_value: 1394922844,
                transfer_level: 'project',
                transfer_accounting_basis: 'cash',
                company: '56a13a758f224f670e6a376e',
                country: '56a7e6c02302369318e16bb8',
                project: '56a930f41b5482a31231ef42',
                concession: '56a2b8236e585b7316655794'
            });
            Transfer.create({
                _id: '56be54f9d7bff9921c93c98a',
                transfer_type: 'Total',
                source: '56747e060e8cc07115200ee4',
                transfer_audit_type: 'government_receipt',
                transfer_year: 2012,
                transfer_unit: 'USD',
                transfer_value: 4102721984,
                transfer_level: 'project',
                transfer_accounting_basis: 'cash',
                company: '56a13a758f224f670e6a376e',
                country: '56a7e6c02302369318e16bb8',
                project: '56a930f41b5482a31231ef42'
            });
            Transfer.create({
                _id: '56be54f9d7bff9921c93c988',
                transfer_type: 'Total',
                source: '56747e060e8cc07115200ee4',
                transfer_audit_type: 'company_payment',
                transfer_year: 2012,
                transfer_unit: 'USD',
                transfer_value: 4102721984,
                transfer_level: 'project',
                transfer_accounting_basis: 'cash',
                company: '56a13a758f224f670e6a376e',
                country: '56a7e6c02302369318e16bb8',
                project: '56a930f41b5482a31231ef42',
                concession: '56a2b8236e585b7316655794'
            });
            Transfer.create({
                _id: '56be54f9d7bff9921c93c986',
                transfer_type: 'Total',
                source: '56747e060e8cc07115200ee4',
                transfer_audit_type: 'government_receipt',
                transfer_year: 2010,
                transfer_unit: 'USD',
                transfer_value: 1394922844,
                transfer_level: 'project',
                transfer_accounting_basis: 'cash',
                company: '56a13a758f224f670e6a376e',
                country: '56a7e6c02302369318e16bb8',
                project: '56a930f41b5482a31231ef42'
            });
            Transfer.create({
                _id: '56be54f9d7bff9921c93c987',
                transfer_type: 'Total',
                source: '56747e060e8cc07115200ee4',
                transfer_audit_type: 'government_receipt',
                transfer_year: 2011,
                transfer_unit: 'USD',
                transfer_value: 1394922844,
                transfer_level: 'project',
                transfer_accounting_basis: 'cash',
                company: '56a13a758f224f670e6a376e',
                country: '56a7e6c02302369318e16bb8'
            });
            Transfer.create({
                _id: '56be54f9d7bff9921c93c989',
                transfer_type: 'Total',
                source: '56747e060e8cc07115200ee4',
                transfer_audit_type: 'government_receipt',
                transfer_year: 2015,
                transfer_unit: 'USD',
                transfer_value: 1394922844,
                transfer_level: 'project',
                transfer_accounting_basis: 'cash',
                company: '56a13a758f224f670e6a376e',
                country: '56a7e6c02302369318e16bb8'
            });
            Transfer.create({
                _id: '56be54f9d7bfflll1c93c985',
                transfer_type: 'Total site',
                source: '56747e060e8cc07115200ee4',
                transfer_audit_type: 'government_receipt',
                transfer_year: 2009,
                transfer_unit: 'USD',
                transfer_value: 1394922844,
                transfer_level: 'site',
                transfer_accounting_basis: 'cash',
                company: '56a13a758f224f670e6a376e',
                country: '56a7e6c02302369318e16bb8',
                site: '56eb117c0007bf5b2a3e4b71'
            });
            Transfer.create({
                _id: '56be54f9dffff9dd1c93c985',
                transfer_type: 'Total field',
                source: '56747e060e8cc07115200ee4',
                transfer_audit_type: 'government_receipt',
                transfer_year: 2009,
                transfer_unit: 'USD',
                transfer_value: 1394922844,
                transfer_level: 'field',
                transfer_accounting_basis: 'cash',
                company: '56a13a758f224f670e6a376e',
                country: '56a7e6c02302369318e16bb8',
                site: '56eb117c0007bf5b2a3e4b76'
            });
            Transfer.find({}).count().exec(function(err, transfer_count) {
                console.log(String(transfer_count), 'transfer figures created...')
            });
        } else {
            console.log(String(transfer_count), 'transfer figures exist...')
        }
    });
}
function getInitTransferCount() {
    Transfer.find({}).count().exec(function(err, transfer_count) {
        console.log(String(transfer_count), 'transfer figures exist...')
    });
};

exports.getInitTransferCount = getInitTransferCount;
exports.createDefaultTransfers = createDefaultTransfers;