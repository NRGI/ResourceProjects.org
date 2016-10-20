////////////////////
//CONTRACT SCHEMA///
////////////////////

'use strict';
var mongoose = require('mongoose');

var contractSchema, Contract,
    Schema   = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;


contractSchema = new Schema ({
    contract_title: String, //Used in extreme cases where we just want to link things together that are working together but have no contract details
    contract_id: String, //from rc.org
    oo_contract_id: String, //from open oil repository
    contract_url: String //for tracking non-RC contracts
});

Contract = mongoose.model('Contract', contractSchema);

function createDefaultContracts() {
    Contract.find({}).count().exec(function(err, contract_count) {
        if(contract_count === 0) {
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
            Contract.find({}).count().exec(function(err, contract_count) {
                console.log(String(contract_count), 'contracts created...')
            });
        } else {
            console.log(String(contract_count), 'contracts exist...')
        }
    });
};
function getInitContractCount() {
    Contract.find({}).count().exec(function(err, contract_count) {
        console.log(String(contract_count), 'contracts exist...')
    });
};

exports.getInitContractCount = getInitContractCount;
exports.createDefaultContracts = createDefaultContracts;