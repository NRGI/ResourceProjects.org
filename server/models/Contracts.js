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
    contract_id: String, //from rc.org
    oo_contract_id: String, //from open oil repository
    contract_url: String //for tracking non-RC contracts
});

Contract = mongoose.model('Contract', contractSchema);

function createDefaultContracts() {
    Contract.find({}).exec(function(err, contracts) {
        if(contracts.length === 0) {
            Contract.create({
                _id: '56a2eb4345d114c30439ec20',
               contract_id: 'ocds-591adf-YE2702919895RC',
            });
            Contract.create({
                _id: '56a2eb4345d114c30439ec22',
                contract_id: 'ocds-591adf-PH9670211788RC',
            });
            Contract.create({
                _id: '56a2eb4345d114c30439ec21',
                contract_id: 'ocds-591adf-PH0149652678RC'
            });
            console.log('Contracts created...');
        } else {
            console.log(String(contracts.length), 'contracts exist...')
        }
    });
};

exports.createDefaultContracts = createDefaultContracts;