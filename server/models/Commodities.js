/////////////////
///COMMODITIES///
/////////////////
'use strict';
var commoditySchema, Commodity,
    mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId,
    Schema   = mongoose.Schema;

commoditySchema = new Schema ({
    //Metadata
    commodity_name: String,
    commodity_ID: String
    //aliases: [links.Aliases]
});

Commodity = mongoose.model('Commodity', commoditySchema);

function createDefaultCommodities() {
    Commodity.find({}).exec(function(err, commodities) {
        if(commodities.length === 0) {
            console.log('no commodities');
            //Commodity.create({
            //
            //});
            //Commodity.create({
            //
            //});
            //Commodity.create({
            //
            //});
            //Commodity.create({
            //
            //});
            //Commodity.create({
            //
            //});
        }
    });
};

exports.createDefaultCommodities = createDefaultCommodities;