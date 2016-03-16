////////////////
//LINK SCHEMA///
////////////////
'use strict';
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var linkSchema, Link,
    deepPopulate    = require('mongoose-deep-populate')(mongoose),
    Schema          = mongoose.Schema,
    ObjectId        = Schema.Types.ObjectId,
    //MixedSchema     = Schema.Types.Mixed,
    entity_enu      = {
        values: 'commodity company company_group concession contract project production transfer'.split(' '),
        //values: ' project '.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select company, concession, contract, country, project, production or company group.'
    };

linkSchema = new Schema({
    commodity: {type: ObjectId, ref: 'Commodity'},
    company: {type: ObjectId, ref: 'Company'},
    company_group: {type: ObjectId, ref: 'CompanyGroup'},
    concession: {type: ObjectId, ref: 'Concession'},
    contract: {type: ObjectId, ref: 'Contract'},
    project: {type: ObjectId, ref: 'Project'},
    transfer: {type: ObjectId, ref: 'Transfer'},
    production: {type: ObjectId, ref: 'Production'},
    source: {type: ObjectId, ref: 'Source'},
    entities: [{ //linked entity
        type: String,
        required:'{PATH} is required!',
        enum: entity_enu}]
    ////company group specific
    //company_group_start_date: Date,
    //company_group_end_date: Date,
    ////licensee specific
    //ownership_stake: Number

});

//linkSchema.plugin(mongooseHistory, hst_options);
linkSchema.plugin(deepPopulate);
//linkSchema.index({ commodity: 1, company: 1, company_group: 1, contract: 1,  concession: 1,  project: 1,  transfer: 1, production: 1}, { unique: true });

Link = mongoose.model('Link', linkSchema);

function createDefaultLinks() {
    Link.find({}).exec(function(err, links) {
        if(links.length === 0) {
            //group-company
            Link.create({_id:'56a8e342b9a34fbb07013c5f',company_group:'56a14d8ee47b92f110ce9a57',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee5',entities:['company','company_group']});
            Link.create({_id:'56b923ea7a800a0d19c5f872',company_group:'56a14d8ee47b92f110ce9a58',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee5',entities:['company','company_group']});
            //project-company
            Link.create({_id:'56b92074a836fc16182ed7de',project:'56a930f41b5482a31231ef42',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee5',entities:['company','project']});
            Link.create({_id:'56b92074a836fc16182ed7e0',project:'56a930f41b5482a31231ef43',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee5',entities:['company','project']});
            Link.create({_id:'56b92074a836fc16182ed7df',project:'56a930f41b5482a31231ef44',company:'56a13a758f224f670e6a376a',source:'56747e060e8cc07115200ee5',entities:['company','project']});
            //company-commodity
            Link.create({_id:'56a8def185d9580a07c58280',commodity:'56a13e9942c8bef50ec2e9e8',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee4',entities:['company','commodity']});
            Link.create({_id:'56a8def185d9580a07c58281',commodity:'56a13e9942c8bef50ec2e9eb',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee4',entities:['company','commodity']});
            Link.create({_id:'56a8def666d9580a07c58281',commodity:'56a13e9942c8bef50ec2e9eb',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee4',entities:['company','commodity']});
            Link.create({_id:'56a8dfbfee9e493007085bce',commodity:'56a13e9942c8bef50ec2e9e8',company:'56a13a758f224f670e6a376a',source:'56747e060e8cc07115200ee4',entities:['company','commodity']});
            Link.create({_id:'56a8e070121b00500792c2eb',commodity:'56a13e9942c8bef50ec2e9e8',company:'56a13a758f224f670e6a376c',source:'56747e060e8cc07115200ee4',entities:['company','commodity']});
            //contract-company
            Link.create({_id:'56a8e66f405f534508e8586f',contract:'56a2eb4345d114c30439ec20',company:'56a13a758f224f670e6a376a',source:'56747e060e8cc07115200ee4',entities:['company','contract']});
            Link.create({_id:'56a8e000000f534508e8586f',contract:'56a2eb4345d114c30439ec20',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee6',entities:['company','contract']});
            //concession-company
            Link.create({_id:'56a8e4acf77930f50708881e',concession:'56a2b8236e585b7316655794',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee6',entities:['company','concession']});
            Link.create({_id:'56a8e5320fa7dd0d0817beff',concession:'56a2b8236e585b7316655794',company:'56a13a758f224f670e6a376a',source:'56747e060e8cc07115200ee5',entities:['company','concession']});
            //concession-project
            Link.create({_id:'56a8e777777730f50708881e',concession:'56a2b8236e585b7316655794',project:'56a930f41b5482a31231ef43',source:'56747e060e8cc07115200ee5',entities:['project','concession']});
            Link.create({_id:'56a8e5344445dd0d0817beff',concession:'56a2b8236e585b731665579d',project:'56a930f41b5482a31231ef44',source:'56747e060e8cc07115200ee5',entities:['project','concession']});
            Link.create({_id:'56a8e5355555dd0d0817beff',concession:'56a2b8236e585b7316655794',project:'56a930f41b5482a31231ef42',source:'56747e060e8cc07115200ee5',entities:['project','concession']});
            Link.create({_id:'56b92074a4jhd786182ed7de',project:'56a930f41b5482a31231ef42',concession:'56a2b8236e585b7316655794',source:'56747e060e8cc07115200ee6',entities:['concession','project']});
            Link.create({_id:'56b92074a4449996182ed7e0',project:'56a930f41b5482a31231ef43',concession:'56a2b8236e585b7316655794',source:'56747e060e8cc07115200ee6',entities:['concession','project']});
            Link.create({_id:'56b92074a855kkk6182ed7df',project:'56a930f41b5482a31231ef44',concession:'56a2b8236e585b7316655794',source:'56747e060e8cc07115200ee6',entities:['concession','project']});
            //concession-contract
            Link.create({_id:'56a8e6658jfh534508e8586f',contract:'56a2eb4345d114c30439ec20',concession:'56a2b8236e585b7316655794',source:'56747e060e8cc07115200ee6',entities:['concession','contract']});
            Link.create({_id:'56a8e6574555534508e8586f',contract:'56a2eb4345d114c30439ec22',concession:'56a2b8236e585b7316655794',source:'56747e060e8cc07115200ee6',entities:['concession','contract']});
            Link.create({_id:'56a8e049487f534508e8586f',contract:'56a2eb4345d114c30439ec20',concession:'56a2b8236e585b731665579d',source:'56747e060e8cc07115200ee6',entities:['concession','contract']});
            Link.create({_id:'56a8e044009f534508e8586f',contract:'56a2eb4345d114c30439ec22',concession:'56a2b8236e585b731665579d',source:'56747e060e8cc07115200ee6',entities:['concession','contract']});
            //project-contract
            Link.create({_id:'56b9207ffffffc16182ed7de',project:'56a930f41b5482a31231ef42',contract:'56a2eb4345d114c30439ec20',source:'56747e060e8cc07115200ee6',entities:['contract','project']});
            Link.create({_id:'56b920dddddddc16182ed7e0',project:'56a930f41b5482a31231ef43',contract:'56a2eb4345d114c30439ec20',source:'56747e060e8cc07115200ee6',entities:['contract','project']});
            Link.create({_id:'56b92hhhhhhhhc16182ed7df',project:'56a930f41b5482a31231ef44',contract:'56a2eb4345d114c30439ec21',source:'56747e060e8cc07115200ee6',entities:['contract','project']});
            //project-commodity
            Link.create({_id:'56a8de666666580a07c58280',commodity:'56a13e9942c8bef50ec2e9e8',project:'56a930f41b5482a31231ef42',source:'56747e060e8cc07115200ee6',entities:['project','commodity']});
            Link.create({_id:'56a8def16666580a07c58281',commodity:'56a13e9942c8bef50ec2e9eb',project:'56a930f41b5482a31231ef43',source:'56747e060e8cc07115200ee6',entities:['project','commodity']});
            //company-transfer
            Link.create({transfer:'56be54f9d7bff9921c93c985',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee3',entities:['company','transfer']});
            Link.create({transfer:'56be54f9d7bff9921c93c98a',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee3',entities:['company','transfer']});
            Link.create({transfer:'56be54f9d7bff9921c93c988',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee3',entities:['company','transfer']});
            Link.create({transfer:'56be54f9d7bff9921c93c986',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee3',entities:['company','transfer']});
            //project-transfer
            Link.create({transfer:'56be54f9d7bff9dd1c93c985',project:'56a930f41b5482a31231ef42',source:'56747e060e8cc07115200ee3',entities:['project','transfer']});
            Link.create({transfer:'56be54f9d7bff9921c93c98a',project:'56a930f41b5482a31231ef42',source:'56747e060e8cc07115200ee3',entities:['project','transfer']});
            Link.create({transfer:'56be54f9d7bff9921c93c988',project:'56a930f41b5482a31231ef42',source:'56747e060e8cc07115200ee3',entities:['project','transfer']});
            Link.create({transfer:'56be54f9d7bff9921c93c986',project:'56a930f41b5482a31231ef42',source:'56747e060e8cc07115200ee3',entities:['project','transfer']});
            //project-production
            Link.create({production:'56be54f9d7bff9921c93c985',project:'56a930f41b5482a31231ef42',source:'56747e060e8cc07115200ee3',entities:['project','production']});
            Link.create({production:'56be54f9d7bff9921c93c986',project:'56a930f41b5482a31231ef42',source:'56747e060e8cc07115200ee3',entities:['project','production']});
            Link.create({production:'56be54f9d7bff9921c93c987',project:'56a930f41b5482a31231ef42',source:'56747e060e8cc07115200ee3',entities:['project','production']});
            Link.create({production:'56be54f9d7bff9921c93c988',project:'56a930f41b5482a31231ef42',source:'56747e060e8cc07115200ee3',entities:['project','production']});
            Link.create({production:'56be54f9d7bff9921c93c989',project:'56a930f41b5482a31231ef42',source:'56747e060e8cc07115200ee3',entities:['project','production']});
            Link.create({production:'56be54f9d7bff9921c93c990',project:'56a930f41b5482a31231ef42',source:'56747e060e8cc07115200ee3',entities:['project','production']});

            //Link.create({company_group:'',company:'',source:'',entities:['company','company_group']});
            //Link.create({company_group:'',company:'',source:'',entities:['company','company_group']});
            //Link.create({company_group:'',company:'',source:'',entities:['company','company_group']});
            //Link.create({company_group:'',company:'',source:'',entities:['company','company_group']});
            //
            console.log('Links created...');
        }
    });
};

exports.createDefaultLinks = createDefaultLinks;