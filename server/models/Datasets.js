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
    Dataset.find({}).count().exec(function(err, dataset_count) {
        if(dataset_count === 0) {
            console.log('no datasets, creating some fake ones');
            Dataset.create({
                name: "Google Sheet: Angola 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1e3bLjskAGs8R_XzOe7aPUXaArGQkFrY3GrjatHH1zz4/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Nigeria 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/19gMEPl45wHtRpAd_e_-nViQPWr16GgKhuRqoPE0L-YU/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Kosmos 2014 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1iQf7_o1bB-EnE40SK6CsPuyFs15E2cYxxMx0flYLfuM/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Ghana Mining Resource Projects 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1RYMJ7EYo7mXeWNyiAHQ4tVYc2fr24Gvz4CZYts0aHy0/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Mali 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/19J14ioJhvJQlR-ep4yEFwbjzYjAfMjs9cz5lmecBpyQ/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Tullow 2013 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1t3qQE1KNzJDoBpEPoDEbexWa4SB6PxO-zlYaA4DMUWs/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Tullow 2014-2015 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1CKWJrSbMqE5r9XunC3a0B-J8pMo25YqrkryxrFSpT8A/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Norwegian Companies 2014 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1jIVRaxC8LclLZMyp1bNcPwJCTYhtetfVeUIU7e5BNiY/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: PH-EITI 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1-Vu0QetYrZsYs8U8YIPL1Nylo4g-kgp8p1k7dHaZyMo/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: EITI 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1lkfW-q63eq-f_75af6uMkEC0hcvALgyGynIO8vaKw1k/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Mexico 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1ZQek6krFfsM5aDFFUGQuX9Cfsch2_5EFMQaaKU3oMp4/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: World Bank - Africa Map Mines locations 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1a7On-q2xenf-y4FuH-w5RIyd1S78swmz_LfQ-OG3iVU/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Peru 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1q3iJB-e6VF-JFENOUq5lqPq5oqe5u5YCU2JPOZDtZSs/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Statoil 2014 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1D_s0mAC6YORN5kqBBKZ6mIvCZhVC_YzDlviEnvgYRFg/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Statoil 2015 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1Ay3jFZKR6IwnbnLCmR2_oMZEB8F6wf0rDvUNKSzV1-0/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: BHP biliton 2015 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1lLxP5gHU8ekn8PW9WGvf9B713PJHHEJev23hoVXcf74/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Jubilee links 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1z8Rlu24CFeoyL38L9pc0hE3JaijSZ-kVbE90hxIj5Ds/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Total 2015 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1xrcXsTup5ZVYbz6Nq2z2egqIzc1DQxl1cr9w4psL79w/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                _id: '56737e170e8cc07115211ee4',
                name: "Companies House API",
                type: "Incremental API",
                source_url: 'https://extractives.companieshouse.gov.uk/api/',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            }, function(err) {
            console.log(err);
            });
            Dataset.find({}).count().exec(function(err, dataset_count) {
                console.log(String(dataset_count), 'datasets created...');
            });
        } else {
            console.log(String(dataset_count), 'datasets exist...');
        }
    });
};

exports.createDefaultDatasets = createDefaultDatasets;