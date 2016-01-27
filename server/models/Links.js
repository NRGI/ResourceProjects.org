////////////////
//LINK SCHEMA///
////////////////
'use strict';
var linkSchema, Link,
    mongoose    = require('mongoose'),
    Schema      = mongoose.Schema,
    ObjectId    = Schema.Types.ObjectId,
    //MixedSchema = Schema.Types.Mixed,
    entity_enu  = {
        values: 'commodity company company_group concession contract'.split(' '),
        //values: ' project '.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select company, concession, contract, country, project, or company group.'
    };

linkSchema = new Schema({
    commodity: {type: ObjectId, ref: 'Commodities'},
    company: {type: ObjectId, ref: 'Companies'},
    company_group: {type: ObjectId, ref: 'CompanyGroups'},
    concession: {type: ObjectId, ref: 'Concessions'},
    contract: {type: ObjectId, ref: 'Contracts'},
    project: {type: ObjectId, ref: 'Projects'},
    source: {type: ObjectId, ref: 'Sources'},
    entities: [{ //linked entity
        type: String,
        required:'{PATH} is required!',
        enum: entity_enu}],
    //company group specific
    company_group_start_date: Date,
    company_group_end_date: Date,
    //licensee specific
    ownership_stake: Number

});

//linkSchema.plugin(mongooseHistory, hst_options);

Link = mongoose.model('Link', linkSchema);

function createDefaultLinks() {
    Link.find({}).exec(function(err, links) {
        if(links.length === 0) {
            Link.create({_id:'56a8def185d9580a07c58280',commodity:'56a13e9942c8bef50ec2e9e8',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee6',entities:['company','commodity']});
            Link.create({_id:'56a8def185d9580a07c58281',commodity:'56a13e9942c8bef50ec2e9eb',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee6',entities:['company','commodity']});
            Link.create({_id:'56a8dfbfee9e493007085bce',commodity:'56a13e9942c8bef50ec2e9e8',company:'56a13a758f224f670e6a376a',source:'56747e060e8cc07115200ee4',entities:['company','commodity']});
            Link.create({_id:'56a8e070121b00500792c2eb',commodity:'56a13e9942c8bef50ec2e9e8',company:'56a13a758f224f670e6a376c',source:'56747e060e8cc07115200ee3',entities:['company','commodity']});
            Link.create({_id:'56a8e342b9a34fbb07013c5f',company_group:'56747e060e8cc07115200ee4',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee5',entities:['company','company_group'],company_group_start_date: new Date(), company_group_end_date: new Date()});
            Link.create({_id:'56a8e4acf77930f50708881e',concession:'56a2b8236e585b7316655794',company:'56a13a758f224f670e6a376e',source:'56747e060e8cc07115200ee6',entities:['company','concession']});
            Link.create({_id:'56a8e5320fa7dd0d0817beff',concession:'56a2b8236e585b7316655794',company:'56a13a758f224f670e6a376a',source:'56747e060e8cc07115200ee5',entities:['company','concession']});
            Link.create({_id:'56a8e66f405f534508e8586f',contract:'56a2eb4345d114c30439ec20',company:'56a13a758f224f670e6a376a',source:'56747e060e8cc07115200ee6',entities:['company','contract']});
            Link.create({_id:'56a8e778c052957008a847a7',concession:'56a2b8236e585b7316655794',commodity:'56a13e9942c8bef50ec2e9f1',source:'56747e060e8cc07115200ee6',entities:['concession','commodity']});
            Link.create({_id:'56a8e778c052957008a847a8',concession:'56a2b8236e585b7316655794',commodity:'56a13e9942c8bef50ec2e9eb',source:'56747e060e8cc07115200ee6',entities:['concession','commodity']});
            Link.create({_id:'56a8e834bd760b92085829de',concession:'56a2b8236e585b731665579d',commodity:'56a13e9942c8bef50ec2e9f1',source:'56747e060e8cc07115200ee5',entities:['commodity','concession']});
            Link.create({_id:'56a8e834bd760b92085829df',concession:'56a2b8236e585b731665579d',commodity:'56a13e9942c8bef50ec2e9eb',source:'56747e060e8cc07115200ee5',entities:['commodity','concession']});
            Link.create({_id:'56a8e91f514d14b5080599e0',concession:'56a2b8236e585b7316655794',contract:'56a2eb4345d114c30439ec20',source:'56747e060e8cc07115200ee6',entities:['concession','contract']});
            Link.create({_id:'56a8e9408c2925be086967b6',concession:'56a2b8236e585b731665579d',contract:'56a2eb4345d114c30439ec22',source:'56747e060e8cc07115200ee5',entities:['concession','contract']});

            //Link.create({company_group:'',company:'',source:'',entities:['company','company_group']});
            //Link.create({company_group:'',company:'',source:'',entities:['company','company_group']});
            //Link.create({company_group:'',company:'',source:'',entities:['company','company_group']});
            //Link.create({company_group:'',company:'',source:'',entities:['company','company_group']});

            console.log('Links created...');
        }
    });
};

exports.createDefaultLinks = createDefaultLinks;