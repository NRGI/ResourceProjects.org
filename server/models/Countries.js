////////////
//COUNTRIES
////////////
'use strict';
var countrySchema, Country,
    links    = require('./Links'),
    mongoose = require('mongoose'),
    Schema   = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;

countrySchema = new Schema({
    iso2: String,
    name: String,
    country_aliases: [{
        type: ObjectId,
        ref: 'Alias'}]
});

//countrySchema.plugin(mongooseHistory, options);

Country = mongoose.model('Country', countrySchema);

function createDefaultCountries() {
    Country.find({}).exec(function(err, countries) {
        if(countries.length === 0) {
            Country.create({_id:'56a7e6c02302369318e16bb8', iso2:'BG', name:'Bulgarian'});
            Country.create({_id:'56a7e6c02302369318e16bb9', iso2:'AF', name:'Afghanistan'});
            Country.create({_id:'56a7e6c02302369318e16bba', iso2:'NG', name:'Nigeria'});
            Country.create({_id:'56a8d7d08e7079da05d6b542', iso2:'GH', name:'Ghana'});
            console.log('Countries created...');
        }
    });
};

exports.createDefaultCountries = createDefaultCountries;