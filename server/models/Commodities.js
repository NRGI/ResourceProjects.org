/////////////////
///COMMODITIES///
/////////////////
'use strict';
var mongoose = require('mongoose');

var commoditySchema, Commodity,
    Schema   = mongoose.Schema,
    aliases  = require('./Aliases'),
    ObjectId = Schema.Types.ObjectId;

commoditySchema = new Schema ({
    //Metadata
    commodity_name: String,
    commodity_code: {
        type: String,
        unique: true
    },
    commodity_aliases: [aliases]
});

Commodity = mongoose.model('Commodity', commoditySchema);

function createDefaultCommodities() {
    Commodity.find({}).exec(function(err, commodities) {
        if(commodities.length === 0) {
            Commodity.create({
                _id: '56a13e9942c8bef50ec2e9e8',
                commodity_name: 'Aluminum',
                commodity_code: 'al',
                commodity_aliases: [
                    {code: 'alu', reference: 'wb'},
                    {code: 'alum', reference: 'imf'},
                    {alias: 'Aluminium', language: 'fr'}
                ]

            });
            Commodity.create({
                _id: '56a13e9942c8bef50ec2e9eb',
                commodity_name: 'Gold',
                commodity_code: 'go',
                commodity_aliases: [
                    {code: 'gol', reference: 'wb'},
                    {code: 'au', reference: 'imf'}
                ]
            });
            Commodity.create({
                _id: '56a13e9942c8bef50ec2e9ee',
                commodity_name: 'Hydrocarbons',
                commodity_code: 'hy',
                commodity_aliases: [
                    {code: 'hyd', reference: 'wb'},
                    {code: 'hydro', reference: 'imf'}
                ]
            });
            Commodity.create({
                _id: '56a13e9942c8bef50ec2e9f1',
                commodity_name: 'Diamonds',
                commodity_code: 'di',
                commodity_aliases: [
                    {code: 'diam', reference: 'wb'},
                    {code: 'dmnd', reference: 'imf'}
                ]
            });
            console.log('***Commodities Added');
        }
    });
};

exports.createDefaultCommodities = createDefaultCommodities;