////////////////////////
///COMMODITIES SCHEMA///
////////////////////////
'use strict';
var mongoose = require('mongoose');

var commoditySchema, Commodity,
    Schema   = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;

commoditySchema = new Schema ({
    //Metadata
    commodity_name: String,
    commodity_type: String,
    commodity_aliases: [{
        type: ObjectId,
        ref: 'Alias'}],
    concessions: [{
        type: ObjectId,
        ref: 'Link'}],
    contracts: [{
        type: ObjectId,
        ref: 'Link'}],
    companies: [{
        type: ObjectId,
        ref: 'Link'}],
    projects: [{
        type: ObjectId,
        ref: 'Link'}]
});

Commodity = mongoose.model('Commodity', commoditySchema);

function createDefaultCommodities() {
    Commodity.find({}).exec(function(err, commodities) {
        if(commodities.length === 0) {
            Commodity.create({
                _id: '56a13e9942c8bef50ec2e9e8',
                commodity_name: 'Aluminum',
                commodity_type: 'Mining',
                commodity_aliases: ['56a6ac8f6c1ac5811ae27988','56a6ac8f6c1ac5811ae27989','56a6ac8f6c1ac5811ae2798a']
            });
            Commodity.create({
                _id: '56a13e9942c8bef50ec2e9eb',
                commodity_name: 'Gold',
                commodity_type: 'Mining',
                commodity_aliases: ['56a6ac8f6c1ac5811ae2798d','56a6ac8f6c1ac5811ae2798e']
            });
            Commodity.create({
                _id: '56a13e9942c8bef50ec2e9ee',
                commodity_name: 'Hydrocarbons',
                commodity_type: 'Oil and Gas',
                commodity_aliases: ['56a6ac8f6c1ac5811ae2798f','56a6ac8f6c1ac5811ae27990']
            });
            Commodity.create({
                _id: '56a13e9942c8bef50ec2e9f1',
                commodity_name: 'Diamonds',
                commodity_type: 'Mining',
                commodity_aliases: ['56a6ac8f6c1ac5811ae27991', '56a6ac8f6c1ac5811ae27992']
            });
            console.log('Commodities created...');
        }
    });
};

exports.createDefaultCommodities = createDefaultCommodities;