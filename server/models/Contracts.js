////////////////////
//CONTRACT SCHEMA///
////////////////////

'use strict';
var mongoose = require('mongoose');

var sourceSchema, contractSchema, Contract,
    Schema   = mongoose.Schema,
    links    = require('./Links'),
    ObjectId = Schema.Types.ObjectId,
    source   = {type: ObjectId, ref: 'Sources'};

sourceSchema = new Schema({
    source: source,
    //approved: Boolean,
    value: String
});

contractSchema = new Schema ({
    //Metadata
    contract_id: String, //from rc.org

    //Links
    sources: [source],
    commodities: [links],
    companies: [links],
    concessions: [links],
    //countries: [links],
    //projects: [links],
    //sources: [ObjectId]
});

Contract = mongoose.model('Contract', contractSchema);

function createDefaultContracts() {
    Contract.find({}).exec(function(err, contracts) {
        if(contracts.length === 0) {
            Contract.create({
                _id: '56a2eb4345d114c30439ec20'
,               contract_id: 'junkid',
                sources: ['56747e060e8cc07115200ee6'],
                //commodities: [],
                companies: [
                    {company:'56a13a758f224f670e6a376a',source:'56747e060e8cc07115200ee6',entity:'company'}
                ],
                concessions: [
                    {concession:'56a2b8236e585b7316655794',source:'56747e060e8cc07115200ee6',entity:'concession'}
                ]
            });
            Contract.create({
                _id: '56a2eb4345d114c30439ec22',
                contract_id: 'junkid',
                sources: ['56747e060e8cc07115200ee5'],
                concessions: [
                    {concession:'56a2b8236e585b731665579d',source:'56747e060e8cc07115200ee5',entity:'concession'}
                ]
            });
            Contract.create({
                _id: '56a2eb4345d114c30439ec21',
                contract_id: 'junkid',
                //sources: [''],
                //commodities: [],
                //companies: [],
                //concessions: [],
            });
            console.log('***Contracts Added');
        }
    });
};

exports.createDefaultContracts = createDefaultContracts;