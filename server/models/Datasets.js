///////////////
//DATASETS (ETL)
///////////////
'use strict'
var datasetSchema, Dataset,
    mongoose = require('mongoose'),
    Schema   = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId;

datasetSchema = new Schema ({
    name: String,
    //original_file: String,
    source_url: String,
    created: { type: Date, default: Date.now },
    modified: Date,
    created_by: {type: ObjectId, ref: 'User'},
    //actions: [{type: ObjectId, ref: 'Action'}]
    actions: [{
        name: String,
        started: Date,
        finished: Date,
        started_by: {type: ObjectId, ref: 'User'},
        status: String,
        details: String
    }]
});

Dataset = mongoose.model('Dataset', datasetSchema);

function createDefaultDatasets() {
    Dataset.find({}).exec(function(err, datasets) {
        if(datasets.length === 0) {
            console.log('no datasets, creating some fake ones');
            Dataset.create({
                name: "A Google Sheet",
                original_file: 'sources.ods',
                source_url: 'http://nrgi.org/sources.ods',
                created: Date.now(),
                modified: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: [
                    {
                        name: "Extract from Google Sheets",
                        started: Date.now(),
                        finished: Date.now(),
                        started_by: '56d011292cb1766d0c308ec0',
                        status: 'Success',
                        details: 'I like Google Sheets'
                    },
                    {
                        name: "Transform to Model",
                        started: Date.now(),
                        finished: Date.now(),
                        started_by: '56d011292cb1766d0c308ec0',
                        status: 'Success',
                        details: 'Found 50 companies, 20 contracts and 5 sausages'
                    },
                    {
                        name: "Load to DB (staged)",
                        started: Date.now(),
                        finished: Date.now(),
                        started_by: '56d011292cb1766d0c308ec0',
                        status: 'Failed',
                        details: 'I didn\'t like the data'
                    }]
            });
            Dataset.create({
                name: "Companies House Update",
                original_file: 'sources2.ods',
                source_url: 'http://nrgi.org/sources2.ods',
                created: Date.now(),
                modified: null,
                created_by: '56d011292cb1766d0c308ec0',
                actions: [
                    {
                        name: "Extract from Companies House API",
                        started: Date.now(),
                        finished: Date.now(),
                        started_by: '56d011292cb1766d0c308ec0',
                        status: 'Success',
                        details: 'tasty API'
                    },
                    {
                        name: "Transform to Model",
                        started: Date.now(),
                        finished: Date.now(),
                        started_by: '56d011292cb1766d0c308ec0',
                        status: 'Success',
                        details: 'Good good'
                    },
                    {
                        name: "Load to DB (staged)",
                        started: Date.now(),
                        finished: Date.now(),
                        started_by: '56d011292cb1766d0c308ec0',
                        status: 'Success',
                        details: 'Alls well'
                    }]
            });
        }
    });
};

exports.createDefaultDatasets = createDefaultDatasets;