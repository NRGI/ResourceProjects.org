/////////////
//PRODUCTION
/////////////
//  - Country
//  - Project
//  - Company
//  - Price Unit


///////////
//PRODUCTION
///////////
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var productionSchema, Production,
    deepPopulate    = require('mongoose-deep-populate')(mongoose),
    Schema          = mongoose.Schema,
    fact            = require("./Facts"),
    ObjectId        = Schema.Types.ObjectId,
//    mixedSchema     = Schema.Types.Mixed,
    source          = {type: ObjectId, ref: 'Source'},
    country         = {type: ObjectId, ref: 'Country'},
    project         = {type: ObjectId, ref: 'Project'},
    site            = {type: ObjectId, ref: 'Site'},
    concession      = {type: ObjectId, ref: 'Concession'},
    transfer_level_enu      = {
        values: 'country project site field concession'.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select country, site, field or project.'
    },
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
    hst_options         = {customCollectionName: 'production_hst'};

productionSchema = new Schema ({
    source: source,
    production_year: Number,
    production_unit: String,
    production_volume: Number,
    production_commodity: {
        type: ObjectId,
        ref: 'Commodity'},
    production_price: Number,
    production_price_unit: String,
    production_level: String,
    production_level: {
        type: String,
        enum: transfer_level_enu},
    //production_note: htmlSettings
    production_note: String,
    //LINKS
    country: country,
    project: project,
    site: site,
    concession: concession
});

productionSchema.plugin(mongooseHistory, hst_options);
productionSchema.plugin(deepPopulate);
Production = mongoose.model('Production', productionSchema);

function createDefaultProduction() {
    Production.find({}).exec(function (err, production) {
        if (production.length === 0) {
            Production.create({
                _id: '56be54f9d7bff9921c93c985',
                source: '56747e060e8cc07115200ee4',
                production_year: 2009,
                production_unit: 'barrels',
                production_volume: 105491,
                production_commodity: '56a13e9942c8bef50ec2e9e8',
                production_price: 154,
                production_level: 'project',
                production_price_unit: 'USD',
                project: '56a930f41b5482a31231ef42',
                concession: '56a2b8236e585b7316655794',
                country: '56a7e6c02302369318e16bb8'
            });
            Production.create({
                _id: '56be54f9d7bff9921c93c986',
                source: '56747e060e8cc07115200ee4',
                production_year: 2009,
                production_unit: 'barrels',
                production_volume: 105491,
                production_commodity: '56a13e9942c8bef50ec2e9e8',
                production_price: 154,
                production_level: 'project',
                production_price_unit: 'USD',
                project: '56a930f41b5482a31231ef42',
                concession: '56a2b8236e585b7316655794',
                country: '56a7e6c02302369318e16bb8'
            });
            Production.create({
                _id: '56be54f9d7bff9921c93c987',
                source: '56747e060e8cc07115200ee4',
                production_year: 2009,
                production_unit: 'barrels',
                production_volume: 105491,
                production_commodity: '56a13e9942c8bef50ec2e9e8',
                production_price: 154,
                production_level: 'project',
                production_price_unit: 'USD',
                project: '56a930f41b5482a31231ef42',
                country: '56a7e6c02302369318e16bb8'
            });
            Production.create({
                _id: '56be54f9d7bff9921c93c988',
                source: '56747e060e8cc07115200ee4',
                production_year: 2009,
                production_unit: 'barrels',
                production_volume: 105491,
                production_commodity: '56a13e9942c8bef50ec2e9e8',
                production_price: 154,
                production_level: 'project',
                production_price_unit: 'USD',
                country: '56a7e6c02302369318e16bb8'
            });
            Production.create({
                _id: '56be54f9d7bff9921c93c989',
                source: '56747e060e8cc07115200ee4',
                production_year: 2009,
                production_unit: 'barrels',
                production_volume: 105491,
                production_commodity: '56a13e9942c8bef50ec2e9e8',
                production_price: 154,
                production_level: 'project',
                production_price_unit: 'USD',
                project: '56a930f41b5482a31231ef42'
            });
            Production.create({
                _id: '56be54f9d7bff9921c93c990',
                source: '56747e060e8cc07115200ee4',
                production_year: 2009,
                production_unit: 'barrels',
                production_volume: 105491,
                production_commodity: '56a13e9942c8bef50ec2e9e8',
                production_price: 154,
                production_level: 'project',
                production_price_unit: 'USD',
                project: '56a930f41b5482a31231ef42'
            });
            Production.create({
                _id: '56be54f9d7bff99ppp93c990',
                source: '56747e060e8cc07115200ee4',
                production_year: 2009,
                production_unit: 'barrels',
                production_volume: 105491,
                production_commodity: '56a13e9942c8bef50ec2e9e8',
                production_price: 15400000,
                production_level: 'site',
                production_price_unit: 'USD',
                site: '56eb117c0007bf5b2a3e4b71'
            });
            Production.create({
                _id: '56be54f9000ff9921c93c990',
                source: '56747e060e8cc07115200ee4',
                production_year: 2009,
                production_unit: 'barrels',
                production_volume: 105491,
                production_commodity: '56a13e9942c8bef50ec2e9e8',
                production_price: 154,
                production_level: 'field',
                production_price_unit: 'USD'
            });
            console.log('Production figures created...');
        } else {
            console.log(String(production.length), 'production figures exist...')
        }
    });
}

exports.createDefaultProduction = createDefaultProduction;