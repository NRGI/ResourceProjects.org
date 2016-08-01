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
                source_url: 'https://docs.google.com/spreadsheets/d/1xA2GdDRTWeiCa7IXBPPQf8LoQCKVtT3dtV9Dp3s2Ow4/pub',
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
                source_url: 'https://docs.google.com/spreadsheets/d/1BDs3uuWzscQDid2iVtJNtW0alrHa7WQT6sxn6JU4R6c/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Ghana Mining Resource Projects 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1dnoG8QsodrQTImWFdAkxPrMym_BpxRTipEIox9mQomk/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Mali 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1Q6EGMQdgVrzOXvBWkUo1gdjvMwTjddKyj2agl6P0TVU/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Tullow 2013 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1BDHPIfg_RNvRoHRZpW9pUNjKUcynCtdu5HVwKleCdaI/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Tullow 2014-2015 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/13wj8nRdJvrfVTKb2FYTkQ6trSYXhOVUTTXbSwt1vFZU/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Norwegian Companies 2014 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1ZzUp5OxDeSFW5Pwe-MD7cWzWu76tL_lNEbQv4UkxxnA/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: PH-EITI 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1SBFmjsLoGjvg6PIIfxttYV7bhA8jKGuTg2IuJYGUYw0/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: EITI 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1xEcpGzOMypC1K9hE6PjUz0sBrNiKkUGfC8YkZmIItfE/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Mexico 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1_hzR7mfNwlkEwmF18syHrNXtoiJbGXEwyevrJFmDtrg/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: World Bank - Africa Map Mines locations 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1_hzR7mfNwlkEwmF18syHrNXtoiJbGXEwyevrJFmDtrg/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Peru 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1Ov_a1Xa-SEMBG9lH7snujfytJQ0ujI5UApGbpc1W6ZM/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Statoil 2014 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1cSyeNKG_bOCmCLbx5HAbEYM1HO75Qk83e96UgU3ovpE/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Statoil 2015 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1v0s_BBH5XtAVgfBMU67oKKUFkqggvhKeN53ILTGwxGo/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: BHP biliton 2015 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1dcd3h75C9VXmDtR0cvoKneqnQneCbQcvSsbLd4wh6Xc/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Jubilee links 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1dcd3h75C9VXmDtR0cvoKneqnQneCbQcvSsbLd4wh6Xc/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Total 2015 0.6",
                source_url: 'https://docs.google.com/spreadsheets/d/1PNbL6GQobsOihJxFrVbKp4Gt4xdkNE15yzWeQ7HpZ_0/pub',
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