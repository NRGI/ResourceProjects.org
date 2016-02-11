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
        values: 'commodity company company_group concession contract project'.split(' '),
        //values: ' project '.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select company, concession, contract, country, project, or company group.'
    };

linkSchema = new Schema({
    commodity: {type: ObjectId, ref: 'Commodity'},
    company: {type: ObjectId, ref: 'Company'},
    company_group: {type: ObjectId, ref: 'CompanyGroup'},
    concession: {type: ObjectId, ref: 'Concession'},
    contract: {type: ObjectId, ref: 'Contract'},
    project: {type: ObjectId, ref: 'Project'},
    source: {type: ObjectId, ref: 'Source'},
    entities: [{ //linked entity
        type: String,
        required:'{PATH} is required!',
        enum: entity_enu}],
    ////company group specific
    //company_group_start_date: Date,
    //company_group_end_date: Date,
    ////licensee specific
    //ownership_stake: Number

});

//linkSchema.plugin(mongooseHistory, hst_options);
linkSchema.plugin(deepPopulate);
Link = mongoose.model('Link', linkSchema);

function createDefaultLinks() {
    Link.find({}).exec(function(err, links) {
        if(links.length === 0) {
            Link.create({_id:'56a8e342b9a34fbb07013c5f',company_group:'56a14d8ee47b92f110ce9a57',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee5',entities:['company','company_group']});
            Link.create({_id:'56b923ea7a800a0d19c5f872', company_group:'56a14d8ee47b92f110ce9a58',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee5',entities:['company','company_group']});
            Link.create({_id:'56b92074a836fc16182ed7de',project:'56a930f41b5482a31231ef42',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee6',entities:['company','project']});
            Link.create({_id:'56b92074a836fc16182ed7e0',project:'56a930f41b5482a31231ef43',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee6',entities:['company','project']});
            Link.create({_id:'56b92074a836fc16182ed7df',project:'56a930f41b5482a31231ef44',company:'56a13a758f224f670e6a376a',source:'56747e060e8cc07115200ee6',entities:['company','project']});
            Link.create({_id:'56a8def185d9580a07c58280',commodity:'56a13e9942c8bef50ec2e9e8',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee6',entities:['company','commodity']});
            Link.create({_id:'56a8def185d9580a07c58281',commodity:'56a13e9942c8bef50ec2e9eb',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee6',entities:['company','commodity']});
            Link.create({_id:'56a8def666d9580a07c58281',commodity:'56a13e9942c8bef50ec2e9eb',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee4',entities:['company','commodity']});
            Link.create({_id:'56a8dfbfee9e493007085bce',commodity:'56a13e9942c8bef50ec2e9e8',company:'56a13a758f224f670e6a376a',source:'56747e060e8cc07115200ee4',entities:['company','commodity']});
            Link.create({_id:'56a8e070121b00500792c2eb',commodity:'56a13e9942c8bef50ec2e9e8',company:'56a13a758f224f670e6a376c',source:'56747e060e8cc07115200ee3',entities:['company','commodity']});
            Link.create({_id:'56a8e66f405f534508e8586f',contract:'56a2eb4345d114c30439ec20',company:'56a13a758f224f670e6a376a',source:'56747e060e8cc07115200ee6',entities:['company','contract']});
            Link.create({_id:'56a8e000000f534508e8586f',contract:'56a2eb4345d114c30439ec20',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee6',entities:['company','contract']});
            Link.create({_id:'56a8e4acf77930f50708881e',concession:'56a2b8236e585b7316655794',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee6',entities:['company','concession']});
            Link.create({_id:'56a8e5320fa7dd0d0817beff',concession:'56a2b8236e585b7316655794',company:'56a13a758f224f670e6a376a',source:'56747e060e8cc07115200ee5',entities:['company','concession']});

            //transfer links
            //country
            //companies
            //project



            //Link.create({_id:'56a8de666666580a07c58280',commodity:'56a13e9942c8bef50ec2e9e8',project:'56a930f41b5482a31231ef42',source:'56747e060e8cc07115200ee6',entities:['project','commodity']});
            //Link.create({_id:'56a8def16666580a07c58281',commodity:'56a13e9942c8bef50ec2e9eb',project:'56a930f41b5482a31231ef43',source:'56747e060e8cc07115200ee6',entities:['project','commodity']});


            //Link.create({_id:'56a8e778c052957008a847a7',concession:'56a2b8236e585b7316655794',commodity:'56a13e9942c8bef50ec2e9f1',source:'56747e060e8cc07115200ee6',entities:['concession','commodity']});
            //Link.create({_id:'56a8e778c052957008a847a8',concession:'56a2b8236e585b7316655794',commodity:'56a13e9942c8bef50ec2e9eb',source:'56747e060e8cc07115200ee6',entities:['concession','commodity']});
            //Link.create({_id:'56a8e834bd760b92085829de',concession:'56a2b8236e585b731665579d',commodity:'56a13e9942c8bef50ec2e9f1',source:'56747e060e8cc07115200ee5',entities:['commodity','concession']});
            //Link.create({_id:'56a8e834bd760b92085829df',concession:'56a2b8236e585b731665579d',commodity:'56a13e9942c8bef50ec2e9eb',source:'56747e060e8cc07115200ee5',entities:['commodity','concession']});
            //Link.create({_id:'56a8e91f514d14b5080599e0',concession:'56a2b8236e585b7316655794',contract:'56a2eb4345d114c30439ec20',source:'56747e060e8cc07115200ee6',entities:['concession','contract']});
            //Link.create({_id:'56a8e9408c2925be086967b6',concession:'56a2b8236e585b731665579d',contract:'56a2eb4345d114c30439ec22',source:'56747e060e8cc07115200ee5',entities:['concession','contract']});

            //
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