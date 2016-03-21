///////////////
//DATASETS (ETL)
///////////////
'use strict'
var datasetSchema, Dataset,
    mongoose = require('mongoose'),
    Schema   = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId

datasetSchema = new Schema ({
    name: String,
    source_url: String,
    created: { type: Date, default: Date.now },
    created_by: {type: ObjectId, ref: 'User'},
    actions: [{type: ObjectId, ref: 'Action'}],
    type: { type: String, default: 'Google Sheets'}
});

Dataset = mongoose.model('Dataset', datasetSchema);

function createDefaultDatasets() {
    Dataset.find({}).exec(function(err, datasets) {
        if(datasets.length === 0) {
            console.log('no datasets, creating some fake ones');
            Dataset.create({
                name: "Google Sheet: Angola 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/1j9IDzCxCd2a70viGa8UejqWfxJDrUS87u7ROl8p8Hgc/pub?output=csv',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                _id: '56737e170e8cc07115211ee4',
                name: "Companies House API",
                type: "Placeholder for CRON Job",
                source_url: 'https://extractives.companieshouse.gov.uk/api/',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: ['56737e170e4ac07115211ee4']
            }, function(err, model) {
            console.log(err);
            });
        } else {
            console.log(String(datasets.length), 'datasets exist...')
        }
    });
};

exports.createDefaultDatasets = createDefaultDatasets;