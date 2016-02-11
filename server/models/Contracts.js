////////////////////
//CONTRACT SCHEMA///
////////////////////

'use strict';
var mongoose = require('mongoose');

var sourceSchema, contractSchema, Contract,
    Schema   = mongoose.Schema,
    fact            = require("./Facts"),
    ObjectId = Schema.Types.ObjectId,
    source   = {type: ObjectId, ref: 'Sources'};


contractSchema = new Schema ({
    //Metadata
    contract_id: String, //from rc.org
    contract_name: String, //from rc.org
    contract_type: [fact], //geographic type i.e. onshore, off shore, etc.
    country: [fact],
    // Links
    //sources: [source],
    //commodities: [{
    //    type: ObjectId,
    //    ref: 'Commodities'}],
    //companies: [{
    //    type: ObjectId,
    //    ref: 'Companies'}],
    //concessions: [{
    //    type: ObjectId,
    //    ref: 'Concessions'}],
    //projects: [{
    //    type: ObjectId,
    //    ref: 'Projects'}]
});

Contract = mongoose.model('Contract', contractSchema);

function createDefaultContracts() {
    Contract.find({}).exec(function(err, contracts) {
        if(contracts.length === 0) {
            Contract.create({
                _id: '56a2eb4345d114c30439ec20',
                contract_id: 'junkid1',
                contract_name: 'junkid1',
                //sources: ['56747e060e8cc07115200ee6'],\
                companies: ['56a8e66f405f534508e8586f'],
                concessions: ['56a8e91f514d14b5080599e0']
            });
            Contract.create({
                _id: '56a2eb4345d114c30439ec22',
                contract_id: 'junkid2',
                //sources: ['56747e060e8cc07115200ee5'],
                concessions: ['56a8e9408c2925be086967b6']
            });
            Contract.create({
                _id: '56a2eb4345d114c30439ec21',
                contract_id: 'junkid3',
                //sources: [''],
            });
            console.log('Contracts created...');
        }
    });
};

exports.createDefaultContracts = createDefaultContracts;