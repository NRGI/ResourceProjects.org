////////////
//CONTRACTS
////////////
'use strict';
var contractSchema, Contract,
    mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId,
    links    = require('./Links'),
    Schema   = mongoose.Schema;

contractSchema = new Schema ({
    //Metadata
    contract_ID: String, //from rc.org
    //Links
    companies: [links],
    commodities: [links],
    concessions: [links],
    countries: [links],
    projects: [links],
    sources: [ObjectId]
});

Contract = mongoose.model('Contract', contractSchema);

function createDefaultContracts() {
    Contract.find({}).exec(function(err, contracts) {
        if(contracts.length === 0) {
            console.log('no contracts');
            //Contract.create({
            //
            //});
            //Contract.create({
            //
            //});
            //Contract.create({
            //
            //});
            //Contract.create({
            //
            //});
            //Contract.create({
            //
            //});
        }
    });
};

exports.createDefaultContracts = createDefaultContracts;