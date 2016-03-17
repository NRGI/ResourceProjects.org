/////////////////
//ALIAS SCHEMA///
/////////////////
'use strict';
var mongoose = require('mongoose');

var aliasSchema, Alias,
    Schema   = mongoose.Schema,
    ObjectId = mongoose.Schema.Types.ObjectId,
    model_enu  = {
        values: 'commodity company_group company concession project sites'.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select correct model.'
    };

aliasSchema = new Schema({
    alias: String,
    code: String,
    language: String,
    reference: String,
    model: { //linked model
        type: String,
        required:'{PATH} is required!',
        enum: model_enu},
    source: {
        type: ObjectId,
        ref: 'Sources'}
});

//aliasSchema.plugin(mongooseHistory, hst_options);

Alias = mongoose.model('Alias', aliasSchema);

function createDefaultAliases() {
    Alias.find({}).exec(function(err, aliases) {
        if(aliases.length === 0) {
            //commodity aliases
            Alias.create({_id: '56a6ac8f6c1ac5811ae27988', code: 'alu', reference:'wb', model: 'commodity'});
            Alias.create({_id: '56a6ac8f6c1ac5811ae27989', code: 'alum', reference:'imf', model: 'commodity'});
            Alias.create({_id: '56a6ac8f6c1ac5811ae2798a', code: 'Aluminium', reference:'fr', model: 'commodity'});
            Alias.create({_id: '56a6ac8f6c1ac5811ae2798d', code: 'gol', reference:'wb', model: 'commodity'});
            Alias.create({_id: '56a6ac8f6c1ac5811ae2798e', code: 'au', reference:'imf', model: 'commodity'});
            Alias.create({_id: '56a6ac8f6c1ac5811ae2798f', code: 'hyd', reference:'wb', model: 'commodity'});
            Alias.create({_id: '56a6ac8f6c1ac5811ae27990', code: 'hydro', reference:'imf', model: 'commodity'});
            Alias.create({_id: '56a6ac8f6c1ac5811ae27991', code: 'diam', reference:'wb', model: 'commodity'});
            Alias.create({_id: '56a6ac8f6c1ac5811ae27992', code: 'dmnd', reference:'imf', model: 'commodity'});

            //company group aliases
            Alias.create({_id:'56a7d2e642074281134a60f3', alias:'Dutch Shell', language:'en', model:'company_group', source:'56747e060e8cc07115200ee6'});
            Alias.create({_id:'56a7d3bf64a708b1136ba7a5', alias:'Dutch Shell', language:'en', model:'company_group', source:'56747e060e8cc07115200ee3'});
            Alias.create({_id:'56a7d2e642074281134a60f4', alias:'black gold', language:'en', model:'company_group', source:'56747e060e8cc07115200ee3'});

            //companies
            Alias.create({_id:'56a7d55eb04a1f2214b7b1dd', alias:'company one aaa', language:'en', model:'company', source:'56747e060e8cc07115200ee5'});
            Alias.create({_id:'56a7d55eb04a1f2214b7b1de', alias:'company two bbb', language:'en', model:'company', source:'56747e060e8cc07115200ee6'});
            Alias.create({_id:'56a7d55eb04a1f2214b7b1df', alias:'company three ccc', language:'en', model:'company', source:'56747e060e8cc07115200ee6'});
            Alias.create({_id:'56a7d55eb04a1f2214b7b1e0', alias:'BP ccc', language:'fr', model:'company', source:'56747e060e8cc07115200ee4'});

            //concessions
            Alias.create({_id:'56a7d75bd9caddb614ab02b3', alias:'Block aye', language:'en', model:'concession', source:'56747e060e8cc07115200ee4'});
            Alias.create({_id:'56a7d75bd9caddb614ab02b4', alias:'Block no way', language:'fr', model:'concession', source:'56747e060e8cc07115200ee5'});
            Alias.create({_id:'56a7d75bd9caddb614ab02b5', alias:'Block BBBBB', language:'en', model:'concession', source:'56747e060e8cc07115200ee3'});

            //projects
            Alias.create({_id:'56a939e649434cfc1354d64b', alias: 'project aye', language:'en', model: 'project', source:'56747e060e8cc07115200ee4'});
            Alias.create({_id:'56a939e649434cfc1354d64c', alias: 'project aaaa', language:'fr', model: 'project', source:'56747e060e8cc07115200ee6'});
            Alias.create({_id:'56a939e649434cfc1354d64d', alias: 'project bbb', language:'en', model: 'project', source:'56747e060e8cc07115200ee4'});
            Alias.create({_id:'56a939e649434cfc1354d64e', alias: 'project ccc', language:'en', model: 'project', source:'56747e060e8cc07115200ee3'});

            //sites
            Alias.create({_id:'56a939e64ddd4cfc1354d64b', alias: 'site 1111', language:'en', model: 'sites', source:'56747e060e8cc07115200ee4'});
            Alias.create({_id:'56a939e64ddffffc1354d64b', alias: 'field 1111', language:'en', model: 'sites', source:'56747e060e8cc07115200ee4'});

            console.log('Aliases created...')
        } else {
            console.log(String(aliases.length), 'aliases exist...')
        }
    });
};

exports.createDefaultAliases = createDefaultAliases;