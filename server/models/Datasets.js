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
                name: "Google Sheet: Angola 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/1j9IDzCxCd2a70viGa8UejqWfxJDrUS87u7ROl8p8Hgc/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Kosmos 2014 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/1PqOOcgbshEVo54oMJenW8HBWekAAOlnm2XKW7NE4MQA/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Ghana Mining Resource Projects 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/1SM6TEDpVIAMOSN_b2zF8LnoPezOveihOM3zqC9FLZNU/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Mali 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/1bdDzInl_sn6TIbAuSF49b3flzbdJHvuSOdskmByaInE/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Norway Tullow 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/1VAIeZus4yscc5J2hSS1OBbD_9TCvu7YukAExupFwZp4/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Tullow 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/1FFFmO6y62NCM8eJKGs_QWnEImwzU0RJ26EYwRh8qCpk/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Norwegian Companies 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/1KDhQpIXLcy4uI8FJ17W9r7NPQIiQBdzjSzSCX7K9L7w/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: PH-EITI 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/1S3aECv4WlUG1d0rIGVY7GJOdVNwWwPHR6z-r3J5Xnz0/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: EITI 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/1_A02orMgpdlhdj5FheurrnY4ieO0HdTQNJ33pBjuYpY/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            // Dataset.create({
            //     name: "Google Sheet: Mexico 0.5",
            //     source_url: 'https://docs.google.com/spreadsheets/d/1bONyv_X918RZMDLmJ2kdDxHYy5IuImvI3c0CMkYSKEg/pub',
            //     created: Date.now(),
            //     created_by: '56d011292cb1766d0c308ec0',
            //     actions: []
            // });
            Dataset.create({
                name: "Google Sheet: World Bank - Africa Map Mines locations 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/16EP82rUWlA3lc9j6rTINjbayOPP18IDtn6BKI8E3TM4/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Peru 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/1gl3syhKsI-pR_lx3KykuKOLnHrp7ir2fRxjaPTO3DgM/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Statoil 2014 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/17FDwVbDCReeWxufE2Gab1yw1PqJpQIt6pASM92d7sl4/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Statoil 2015 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/1nArJqi0RnyZ_WsKO9zxCSZGkG5ltonPVnoSvIZVWpww/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: BHP biliton 2015 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/1UpwgMY6djRS209444hEyil_UOE0NyNIA3d0a7Zi4tsc/pub',
                created: Date.now(),
                created_by: '56d011292cb1766d0c308ec0',
                actions: []
            });
            Dataset.create({
                name: "Google Sheet: Jubilee links 0.5",
                source_url: 'https://docs.google.com/spreadsheets/d/1SRn_oxLcpio_H_ihqSKQWuDmJS-1LWMIv1xW8py8p9A/pub',
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
            Dataset.find({}).count().exec(function(err, dataset_count) {
                console.log(String(dataset_count), 'datasets created...')
            });
        } else {
            console.log(String(dataset_count), 'datasets exist...')
        }
    });
};

exports.createDefaultDatasets = createDefaultDatasets;