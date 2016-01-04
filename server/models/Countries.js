////////////
//COUNTRIES
////////////
'use strict';
var countrySchema, Country,
    links    = require('./Links'),
    mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

countrySchema = new Schema({
    country_ID: {
        type: String,
        required:'{PATH} is required!',
        indexed: true,
        unique: true},
    companies: [links],
    concessions: [links],
    commodities: [links]
});

//countrySchema.plugin(mongooseHistory, options);

Country = mongoose.model('Country', countrySchema);

function createDefaultCountries() {
    Country.find({}).exec(function(err, countries) {
        if(countries.length === 0) {
            console.log('no countries');
            //Country.create({
            //
            //});
            //Country.create({
            //
            //});
            //Country.create({
            //
            //});
            //Country.create({
            //
            //});
            //Country.create({
            //
            //});
        }
    });
};

exports.createDefaultCountries = createDefaultCountries;