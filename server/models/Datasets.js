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
    actions: [{type: ObjectId, ref: 'Action'}]
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
        }
    });
};

exports.createDefaultDatasets = createDefaultDatasets;