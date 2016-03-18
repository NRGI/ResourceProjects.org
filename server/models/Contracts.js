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
    contract_id: String //from rc.org
    //contract_name: String, //from rc.org
    //contract_type: [fact], //geographic type i.e. onshore, off shore, etc.
    //country: [fact]
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
        }
    });
};

exports.createDefaultContracts = createDefaultContracts;