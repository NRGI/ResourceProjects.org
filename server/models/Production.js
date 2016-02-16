/////////////
//PRODUCTION
/////////////
//  - Source
//  - Country
//  - Country ID
//  - Project
//  - Company
//  - Production Year
//  - Volume
//  - Production Unit
//  - Commodity	Price
//  - Price Unit
//  - Production notes


///////////
//PRODUCTION
///////////
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var productionSchema, Prodaction,
    deepPopulate    = require('mongoose-deep-populate')(mongoose),
    Schema          = mongoose.Schema,
    fact            = require("./Facts"),
    ObjectId        = Schema.Types.ObjectId,
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
    hst_options         = {customCollectionName: 'production_hst'};

productionSchema = new Schema ({
    source: source,
    production_year: Number,
    production_unit: String,
    production_volume: Number,
    production_commodity: {
        type: ObjectId,
        ref: 'Commodity'
    },
    production_project: {
        type: ObjectId,
        ref: 'Project'
    },
    production_price: Number,
    production_price_per_unit: String
});

//Link.create({transfer:'56be54f9d7bff9921c93c985',company:'56a13a758f224f670e6a376e',source:'56a13a758f224f670e6a376a',entities:['company','transfer']});
//Link.create({transfer:'56be54f9d7bff9921c93c98a',company:'56a13a758f224f670e6a376e',source:'56a13a758f224f670e6a376a',entities:['company','transfer']});
//Link.create({transfer:'56be54f9d7bff9921c93c988',company:'56a13a758f224f670e6a376e',source:'56a13a758f224f670e6a376a',entities:['company','transfer']});
//Link.create({transfer:'56be54f9d7bff9921c93c986',company:'56a13a758f224f670e6a376e',source:'56a13a758f224f670e6a376a',entities:['company','transfer']});


productionSchema.plugin(mongooseHistory, hst_options);
productionSchema.plugin(deepPopulate);
Production = mongoose.model('Production', productionSchema);


function createDefaultProductions() {
    Production.find({}).exec(function (err, prodactions) {
        if (prodactions.length === 0) {
            Production.create({
                _id: '56be54f9d7bff9921c93c985',
                source: '56747e060e8cc07115200ee4',
                production_year: 2009,
                production_unit: 'USD',
                production_volume: 105491,
                production_commodity: '56a13e9942c8bef50ec2e9e8',
                production_project: '56a930f41b5482a31231ef42',
                production_price: 154,
                production_price_per_unit: 'cash'
            });
            Production.create({
                _id: '56be54f9d7bff9921c93c986',
                source: '56747e060e8cc07115200ee4',
                production_year: 2009,
                production_unit: 'USD',
                production_volume: 105491,
                production_commodity: '56a13e9942c8bef50ec2e9e8',
                production_project: '56a930f41b5482a31231ef42',
                production_price: 154,
                production_price_per_unit: 'cash'
            });
            Production.create({
                _id: '56be54f9d7bff9921c93c987',
                source: '56747e060e8cc07115200ee4',
                production_year: 2009,
                production_unit: 'USD',
                production_volume: 105491,
                production_commodity: '56a13e9942c8bef50ec2e9e8',
                production_project: '56a930f41b5482a31231ef42',
                production_price: 154,
                production_price_per_unit: 'cash'
            });
            Production.create({
                _id: '56be54f9d7bff9921c93c988',
                source: '56747e060e8cc07115200ee4',
                production_year: 2009,
                production_unit: 'USD',
                production_volume: 105491,
                production_commodity: '56a13e9942c8bef50ec2e9e8',
                production_project: '56a930f41b5482a31231ef42',
                production_price: 154,
                production_price_per_unit: 'cash'
            });
            Production.create({
                _id: '56be54f9d7bff9921c93c989',
                source: '56747e060e8cc07115200ee4',
                production_year: 2009,
                production_unit: 'USD',
                production_volume: 105491,
                production_commodity: '56a13e9942c8bef50ec2e9e8',
                production_project: '56a930f41b5482a31231ef42',
                production_price: 154,
                production_price_per_unit: 'cash'
            });
            Production.create({
                _id: '56be54f9d7bff9921c93c990',
                source: '56747e060e8cc07115200ee4',
                production_year: 2009,
                production_unit: 'USD',
                production_volume: 105491,
                production_commodity: '56a13e9942c8bef50ec2e9e8',
                production_project: '56a930f41b5482a31231ef42',
                production_price: 154,
                production_price_per_unit: 'cash'
            });
            console.log('Projects created...');
        }
    });
}

exports.createDefaultProductions = createDefaultProductions;