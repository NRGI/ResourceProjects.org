/////////////////
//FACTS SCHEMA///
/////////////////
'use strict';
var mongoose = require('mongoose');

var factSchema, Fact,
    Schema      = mongoose.Schema,
    ObjectId    = Schema.Types.ObjectId,
    source      = {type: ObjectId, ref: 'Sources'};

factSchema = new Schema({
    source: source,
    //approved: Boolean,
    country: {
        type: ObjectId,
        ref: 'Country'},
    commodity: {
        type: ObjectId,
        ref: 'Commodity'},
    company: {
        type: ObjectId,
        ref: 'Company'},
    string: String,
    number: Number,
    date: Date,
    timestamp: {
        type: Date,
        default: Date.now()},
    loc: {
        type: [Number],  // [<longitude>, <latitude>]
        index: '2d'      // create the geospatial index
    },
    //poly: {
    //    type: {
    //        type: String,
    //        enum: ['LineString', 'Polygon'],
    //        default: 'Polygon'
    //    },
    //    coordinates: [
    //        { type: [
    //            { type: [ Number ] }
    //        ] }
    //    ]
    //}
});

module.exports = factSchema;