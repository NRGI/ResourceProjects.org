/////////////////
///CONCESSIONS///
/////////////////
'use strict';
var concessionSchema, Concession,
    mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId,
    links    = require('./Links'),
    aliases  = require("./Aliases"),
    Schema   = mongoose.Schema;

concessionSchema = new Schema ({
    //Metadata
    concession_name: String,
    concession_ID: String,
    country_ID: String,
    aliases: [aliases],
    concession_record_established: {
        source: ObjectId,
        date: {
            type: Date,
            default: Date.now}
    },
    //External Links
    oo_concession_ID: String,
    //OPEN OIL STUFF
    //"details": {
    //    "Concession\u00e1rios": "*Petrobras - 65%, Inpex - 15%, PTTEP Brasil - 20%",
    //    "Contrato": "BM-ES-23",
    //    "Observacao": "",
    //    "Operador": "Petrobras",
    //    "Vencimento1\u00ba": "20.01.2012"
    //},
    //"retrieved_date": "2014-08-12",
    //"source_date": "2014-01-12",
    //"source_document": "http://www.anp.gov.br/?pg=57559",
    //"status": "",
    //"type": "",
    //"url_api": "http://api.openoil.net/concession/BR/ES-M-525",
    //"url_wiki": "http://repository.openoil.net/wiki/Brazil"

    //Links
    companies: [links],
    contracts: [links],
    projects: [links],
    sources: [ObjectId]
});

////Open Oil pull
//concessionSchema.methods = {
//    openOilPull: function() {
//
//    },
//};

Concession = mongoose.model('Concession', concessionSchema);

function createDefaultConcessions() {
    Concession.find({}).exec(function(err, concessions) {
        if(concessions.length === 0) {
            console.log('no concessions');
            //Concession.create({
            //
            //});
            //Concession.create({
            //
            //});
            //Concession.create({
            //
            //});
            //Concession.create({
            //
            //});
            //Concession.create({
            //
            //});
        }
    });
};

exports.createDefaultConcessions = createDefaultConcessions;