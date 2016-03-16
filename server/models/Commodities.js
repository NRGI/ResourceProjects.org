////////////////////////
///COMMODITIES SCHEMA///
////////////////////////
'use strict';
var mongoose = require('mongoose');

var commoditySchema, Commodity,
    Schema   = mongoose.Schema,
    ObjectId = Schema.Types.ObjectId,
    type_enu  = {
        values: 'mining oil_and_gas'.split(' '),
        message: 'Validator failed for `{PATH}` with value `{VALUE}`. Please select mining or oil and gas.'
    };

commoditySchema = new Schema ({
    //Metadata
    commodity_name: String,
    commodity_type: {
        type: String,
        enum: type_enu},
    commodity_id: String,
    commodity_aliases: [{
        type: ObjectId,
        ref: 'Alias'}]
    //concessions: [{
    //    type: ObjectId,
    //    ref: 'Link'}],
    //contracts: [{
    //    type: ObjectId,
    //    ref: 'Link'}],
    //companies: [{
    //    type: ObjectId,
    //    ref: 'Link'}],
    //projects: [{
    //    type: ObjectId,
    //    ref: 'Link'}]
});

Commodity = mongoose.model('Commodity', commoditySchema);

function createDefaultCommodities() {
    Commodity.find({}).exec(function(err, commodities) {
        if(commodities.length === 0) {
            //Commodity.create({
            //    _id: '56a13e9942c8bef50ec2e9e8',
            //    commodity_name: 'Aluminum',
            //    commodity_type: 'mining',
            //    commodity_aliases: ['56a6ac8f6c1ac5811ae27988','56a6ac8f6c1ac5811ae27989','56a6ac8f6c1ac5811ae2798a']
            //});
            //Commodity.create({
            //    _id: '56a13e9942c8bef50ec2e9eb',
            //    commodity_name: 'Gold',
            //    commodity_type: 'mining',
            //    commodity_aliases: ['56a6ac8f6c1ac5811ae2798d','56a6ac8f6c1ac5811ae2798e']
            //});
            //Commodity.create({
            //    _id: '56a13e9942c8bef50ec2e9ee',
            //    commodity_name: 'Hydrocarbons',
            //    commodity_type: 'Oil and Gas',
            //    commodity_aliases: ['56a6ac8f6c1ac5811ae2798f','56a6ac8f6c1ac5811ae27990']
            //});
            //Commodity.create({
            //    _id: '56a13e9942c8bef50ec2e9f1',
            //    commodity_name: 'Diamonds',
            //    commodity_type: 'mining',
            //    commodity_aliases: ['56a6ac8f6c1ac5811ae27991', '56a6ac8f6c1ac5811ae27992']
            //});
            Commodity.create({_id: '56a13e9942c8bef50ec2e9e8',commodity_name:'Antimony',commodity_type:'mining',commodity_id:'antimony',commodity_aliases: ['56a6ac8f6c1ac5811ae27988','56a6ac8f6c1ac5811ae27989','56a6ac8f6c1ac5811ae2798a']});
            Commodity.create({_id: '56a13e9942c8bef50ec2e9eb',commodity_name:'Ferrotitanium',commodity_type:'mining',commodity_id:'ferrotitanium',commodity_aliases: ['56a6ac8f6c1ac5811ae2798d','56a6ac8f6c1ac5811ae2798e']});
            Commodity.create({_id: '56a13e9942c8bef50ec2e9ee',commodity_name:'Ferrotungsten',commodity_type:'mining',commodity_id:'ferrotungsten',commodity_aliases: ['56a6ac8f6c1ac5811ae2798f','56a6ac8f6c1ac5811ae27990']});
            Commodity.create({_id: '56a13e9942c8bef50ec2e9f1',commodity_name:'Ferrovanadium',commodity_type:'mining',commodity_id:'ferrovanadium',commodity_aliases: ['56a6ac8f6c1ac5811ae27991', '56a6ac8f6c1ac5811ae27992']});
            Commodity.create({commodity_name:'Tantalum',commodity_type:'mining',commodity_id:'tantalum'});
            Commodity.create({commodity_name:'Titanium',commodity_type:'mining',commodity_id:'titanium'});
            Commodity.create({commodity_name:'Titanium Sponge',commodity_type:'mining',commodity_id:'titanium-sponge'});
            Commodity.create({commodity_name:'Tungsten',commodity_type:'mining',commodity_id:'tungsten'});
            Commodity.create({commodity_name:'Vanadium',commodity_type:'mining',commodity_id:'vanadium'});
            Commodity.create({commodity_name:'Cobalt',commodity_type:'mining',commodity_id:'cobalt'});
            Commodity.create({commodity_name:'Copper',commodity_type:'mining',commodity_id:'copper'});
            Commodity.create({commodity_name:'Ferromolybdenum',commodity_type:'mining',commodity_id:'ferromolybdenum'});
            Commodity.create({commodity_name:'Ferronickel',commodity_type:'mining',commodity_id:'ferronickel'});
            Commodity.create({commodity_name:'Lead',commodity_type:'mining',commodity_id:'lead'});
            Commodity.create({commodity_name:'Molybdenum',commodity_type:'mining',commodity_id:'molybdenum'});
            Commodity.create({commodity_name:'Nickel',commodity_type:'mining',commodity_id:'nickel'});
            Commodity.create({commodity_name:'Nickel Pig Iron',commodity_type:'mining',commodity_id:'nickel-pig-iron'});
            Commodity.create({commodity_name:'Tin',commodity_type:'mining',commodity_id:'tin'});
            Commodity.create({commodity_name:'Zinc',commodity_type:'mining',commodity_id:'zinc'});
            Commodity.create({commodity_name:'Zinc-Lead',commodity_type:'mining',commodity_id:'zinc-lead'});
            Commodity.create({commodity_name:'Bauxite-Aluminum',commodity_type:'mining',commodity_id:'bauxite-aluminum'});
            Commodity.create({commodity_name:'Alumina',commodity_type:'mining',commodity_id:'alumina'});
            Commodity.create({commodity_name:'Aluminum',commodity_type:'mining',commodity_id:'aluminum'});
            Commodity.create({commodity_name:'Bauxite',commodity_type:'mining',commodity_id:'bauxite'});
            Commodity.create({commodity_name:'Aggregates',commodity_type:'mining',commodity_id:'aggregates'});
            Commodity.create({commodity_name:'Coke',commodity_type:'mining',commodity_id:'coke'});
            Commodity.create({commodity_name:'Ferromanganese',commodity_type:'mining',commodity_id:'ferromanganese'});
            Commodity.create({commodity_name:'Hematite',commodity_type:'mining',commodity_id:'hematite'});
            Commodity.create({commodity_name:'Iron',commodity_type:'mining',commodity_id:'iron'});
            Commodity.create({commodity_name:'Iron Ore',commodity_type:'mining',commodity_id:'iron-ore'});
            Commodity.create({commodity_name:'Magnetite',commodity_type:'mining',commodity_id:'magnetite'});
            Commodity.create({commodity_name:'Manganese',commodity_type:'mining',commodity_id:'manganese'});
            Commodity.create({commodity_name:'Manganese Ore',commodity_type:'mining',commodity_id:'manganese-ore'});
            Commodity.create({commodity_name:'Metallurgical/Coking Coal',commodity_type:'mining',commodity_id:'metallurgical/coking-coal'});
            Commodity.create({commodity_name:'Quarried products',commodity_type:'mining',commodity_id:'quarried-products'});
            Commodity.create({commodity_name:'Sandstone',commodity_type:'mining',commodity_id:'sandstone'});
            Commodity.create({commodity_name:'Silicomanganese',commodity_type:'mining',commodity_id:'silicomanganese'});
            Commodity.create({commodity_name:'Steel',commodity_type:'mining',commodity_id:'steel'});
            Commodity.create({commodity_name:'Bituminous coal',commodity_type:'mining',commodity_id:'bituminous-coal'});
            Commodity.create({commodity_name:'brown coal',commodity_type:'mining',commodity_id:'brown-coal'});
            Commodity.create({commodity_name:'Coal',commodity_type:'mining',commodity_id:'coal'});
            Commodity.create({commodity_name:'coked coal',commodity_type:'mining',commodity_id:'coked-coal'});
            Commodity.create({commodity_name:'concentrated coking coal',commodity_type:'mining',commodity_id:'concentrated-coking-coal'});
            Commodity.create({commodity_name:'Fossil coal',commodity_type:'mining',commodity_id:'fossil-coal'});
            Commodity.create({commodity_name:'semi-coked coal',commodity_type:'mining',commodity_id:'semi-coked-coal'});
            Commodity.create({commodity_name:'Chromite',commodity_type:'mining',commodity_id:'chromite'});
            Commodity.create({commodity_name:'Ferrochrome',commodity_type:'mining',commodity_id:'ferrochrome'});
            Commodity.create({commodity_name:'Thermal Coal',commodity_type:'mining',commodity_id:'thermal-coal'});
            Commodity.create({commodity_name:'Uranium (U3O8)',commodity_type:'mining',commodity_id:'uranium-(u3o8)'});
            Commodity.create({commodity_name:'Ammonium Sulfate',commodity_type:'mining',commodity_id:'ammonium-sulfate'});
            Commodity.create({commodity_name:'Phosphate',commodity_type:'mining',commodity_id:'phosphate'});
            Commodity.create({commodity_name:'Potash',commodity_type:'mining',commodity_id:'potash'});
            Commodity.create({commodity_name:'Potassium Chloride',commodity_type:'mining',commodity_id:'potassium-chloride'});
            Commodity.create({commodity_name:'Potassium Nitrate',commodity_type:'mining',commodity_id:'potassium-nitrate'});
            Commodity.create({commodity_name:'Potassium Oxide',commodity_type:'mining',commodity_id:'potassium-oxide'});
            Commodity.create({commodity_name:'Potassium Sulfate',commodity_type:'mining',commodity_id:'potassium-sulfate'});
            Commodity.create({commodity_name:'Amethyst',commodity_type:'mining',commodity_id:'amethyst'});
            Commodity.create({commodity_name:'Beryl',commodity_type:'mining',commodity_id:'beryl'});
            Commodity.create({commodity_name:'Chrysoprase',commodity_type:'mining',commodity_id:'chrysoprase'});
            Commodity.create({commodity_name:'Corundum',commodity_type:'mining',commodity_id:'corundum'});
            Commodity.create({commodity_name:'Diamonds',commodity_type:'mining',commodity_id:'diamonds'});
            Commodity.create({commodity_name:'Emerald',commodity_type:'mining',commodity_id:'emerald'});
            Commodity.create({commodity_name:'Garnet',commodity_type:'mining',commodity_id:'garnet'});
            Commodity.create({commodity_name:'Jade',commodity_type:'mining',commodity_id:'jade'});
            Commodity.create({commodity_name:'Opal',commodity_type:'mining',commodity_id:'opal'});
            Commodity.create({commodity_name:'Ruby',commodity_type:'mining',commodity_id:'ruby'});
            Commodity.create({commodity_name:'Sapphire',commodity_type:'mining',commodity_id:'sapphire'});
            Commodity.create({commodity_name:'Tanzanite',commodity_type:'mining',commodity_id:'tanzanite'});
            Commodity.create({commodity_name:'Topaz',commodity_type:'mining',commodity_id:'topaz'});
            Commodity.create({commodity_name:'Heavy Mineral Sands',commodity_type:'mining',commodity_id:'heavy-mineral-sands'});
            Commodity.create({commodity_name:'Ilmenite',commodity_type:'mining',commodity_id:'ilmenite'});
            Commodity.create({commodity_name:'Iron Sand',commodity_type:'mining',commodity_id:'iron-sand'});
            Commodity.create({commodity_name:'Leucoxene',commodity_type:'mining',commodity_id:'leucoxene'});
            Commodity.create({commodity_name:'Rutile',commodity_type:'mining',commodity_id:'rutile'});
            Commodity.create({commodity_name:'Zircon',commodity_type:'mining',commodity_id:'zircon'});
            Commodity.create({commodity_name:'Zirconium',commodity_type:'mining',commodity_id:'zirconium'});
            Commodity.create({commodity_name:'3PGM+Au',commodity_type:'mining',commodity_id:'3pgm+au'});
            Commodity.create({commodity_name:'6PGM+Au',commodity_type:'mining',commodity_id:'6pgm+au'});
            Commodity.create({commodity_name:'Gold',commodity_type:'mining',commodity_id:'gold'});
            Commodity.create({commodity_name:'Iridium',commodity_type:'mining',commodity_id:'iridium'});
            Commodity.create({commodity_name:'Osmium',commodity_type:'mining',commodity_id:'osmium'});
            Commodity.create({commodity_name:'Palladium',commodity_type:'mining',commodity_id:'palladium'});
            Commodity.create({commodity_name:'Platinum',commodity_type:'mining',commodity_id:'platinum'});
            Commodity.create({commodity_name:'Platinum Group Metals',commodity_type:'mining',commodity_id:'platinum-group-metals'});
            Commodity.create({commodity_name:'Rhenium',commodity_type:'mining',commodity_id:'rhenium'});
            Commodity.create({commodity_name:'Rhodium',commodity_type:'mining',commodity_id:'rhodium'});
            Commodity.create({commodity_name:'Ruthenium',commodity_type:'mining',commodity_id:'ruthenium'});
            Commodity.create({commodity_name:'Silver',commodity_type:'mining',commodity_id:'silver'});
            Commodity.create({commodity_name:'Cerium',commodity_type:'mining',commodity_id:'cerium'});
            Commodity.create({commodity_name:'Dysprosium',commodity_type:'mining',commodity_id:'dysprosium'});
            Commodity.create({commodity_name:'Erbium',commodity_type:'mining',commodity_id:'erbium'});
            Commodity.create({commodity_name:'Europium',commodity_type:'mining',commodity_id:'europium'});
            Commodity.create({commodity_name:'Ferroniobium',commodity_type:'mining',commodity_id:'ferroniobium'});
            Commodity.create({commodity_name:'Gadolinium',commodity_type:'mining',commodity_id:'gadolinium'});
            Commodity.create({commodity_name:'Heavy Rare Earths and Yttrium',commodity_type:'mining',commodity_id:'heavy-rare-earths-and-yttrium'});
            Commodity.create({commodity_name:'Holmium',commodity_type:'mining',commodity_id:'holmium'});
            Commodity.create({commodity_name:'Indium',commodity_type:'mining',commodity_id:'indium'});
            Commodity.create({commodity_name:'Lanthanides',commodity_type:'mining',commodity_id:'lanthanides'});
            Commodity.create({commodity_name:'Lanthanum',commodity_type:'mining',commodity_id:'lanthanum'});
            Commodity.create({commodity_name:'Light Rare Earths',commodity_type:'mining',commodity_id:'light-rare-earths'});
            Commodity.create({commodity_name:'Lutetium',commodity_type:'mining',commodity_id:'lutetium'});
            Commodity.create({commodity_name:'Neodymium',commodity_type:'mining',commodity_id:'neodymium'});
            Commodity.create({commodity_name:'Niobium',commodity_type:'mining',commodity_id:'niobium'});
            Commodity.create({commodity_name:'Praseodymium',commodity_type:'mining',commodity_id:'praseodymium'});
            Commodity.create({commodity_name:'Promethium',commodity_type:'mining',commodity_id:'promethium'});
            Commodity.create({commodity_name:'Rare Earth Elements',commodity_type:'mining',commodity_id:'rare-earth-elements'});
            Commodity.create({commodity_name:'Samarium',commodity_type:'mining',commodity_id:'samarium'});
            Commodity.create({commodity_name:'Scandium',commodity_type:'mining',commodity_id:'scandium'});
            Commodity.create({commodity_name:'Terbium',commodity_type:'mining',commodity_id:'terbium'});
            Commodity.create({commodity_name:'Thulium',commodity_type:'mining',commodity_id:'thulium'});
            Commodity.create({commodity_name:'Ytterbium',commodity_type:'mining',commodity_id:'ytterbium'});
            Commodity.create({commodity_name:'Yttrium',commodity_type:'mining',commodity_id:'yttrium'});
            Commodity.create({commodity_name:'Wollastonite',commodity_type:'mining',commodity_id:'wollastonite'});
            Commodity.create({commodity_name:'Aluminous Clay',commodity_type:'mining',commodity_id:'aluminous-clay'});
            Commodity.create({commodity_name:'Arsenic',commodity_type:'mining',commodity_id:'arsenic'});
            Commodity.create({commodity_name:'Asbestos',commodity_type:'mining',commodity_id:'asbestos'});
            Commodity.create({commodity_name:'Attapulgite',commodity_type:'mining',commodity_id:'attapulgite'});
            Commodity.create({commodity_name:'Barite',commodity_type:'mining',commodity_id:'barite'});
            Commodity.create({commodity_name:'Bentonite',commodity_type:'mining',commodity_id:'bentonite'});
            Commodity.create({commodity_name:'Beryllium',commodity_type:'mining',commodity_id:'beryllium'});
            Commodity.create({commodity_name:'Bismuth',commodity_type:'mining',commodity_id:'bismuth'});
            Commodity.create({commodity_name:'Borates',commodity_type:'mining',commodity_id:'borates'});
            Commodity.create({commodity_name:'Boron',commodity_type:'mining',commodity_id:'boron'});
            Commodity.create({commodity_name:'Cadmium',commodity_type:'mining',commodity_id:'cadmium'});
            Commodity.create({commodity_name:'Caesium',commodity_type:'mining',commodity_id:'caesium'});
            Commodity.create({commodity_name:'Calcium Carbonate',commodity_type:'mining',commodity_id:'calcium-carbonate'});
            Commodity.create({commodity_name:'Calcrete',commodity_type:'mining',commodity_id:'calcrete'});
            Commodity.create({commodity_name:'Chromium',commodity_type:'mining',commodity_id:'chromium'});
            Commodity.create({commodity_name:'Clay',commodity_type:'mining',commodity_id:'clay'});
            Commodity.create({commodity_name:'Diatomite',commodity_type:'mining',commodity_id:'diatomite'});
            Commodity.create({commodity_name:'Dolomite',commodity_type:'mining',commodity_id:'dolomite'});
            Commodity.create({commodity_name:'Felspar',commodity_type:'mining',commodity_id:'felspar'});
            Commodity.create({commodity_name:'Ferrosilicon',commodity_type:'mining',commodity_id:'ferrosilicon'});
            Commodity.create({commodity_name:'Fluorite (fluorspar)',commodity_type:'mining',commodity_id:'fluorite-(fluorspar)'});
            Commodity.create({commodity_name:'Fluorspar',commodity_type:'mining',commodity_id:'fluorspar'});
            Commodity.create({commodity_name:'Frac Sand',commodity_type:'mining',commodity_id:'frac-sand'});
            Commodity.create({commodity_name:'Gallium',commodity_type:'mining',commodity_id:'gallium'});
            Commodity.create({commodity_name:'Germanium',commodity_type:'mining',commodity_id:'germanium'});
            Commodity.create({commodity_name:'Granite',commodity_type:'mining',commodity_id:'granite'});
            Commodity.create({commodity_name:'Graphite',commodity_type:'mining',commodity_id:'graphite'});
            Commodity.create({commodity_name:'Gypsum',commodity_type:'mining',commodity_id:'gypsum'});
            Commodity.create({commodity_name:'Hafnium',commodity_type:'mining',commodity_id:'hafnium'});
            Commodity.create({commodity_name:'Iodine',commodity_type:'mining',commodity_id:'iodine'});
            Commodity.create({commodity_name:'Kaolin',commodity_type:'mining',commodity_id:'kaolin'});
            Commodity.create({commodity_name:'Lime',commodity_type:'mining',commodity_id:'lime'});
            Commodity.create({commodity_name:'Lime Sands',commodity_type:'mining',commodity_id:'lime-sands'});
            Commodity.create({commodity_name:'Limestone',commodity_type:'mining',commodity_id:'limestone'});
            Commodity.create({commodity_name:'Lithium',commodity_type:'mining',commodity_id:'lithium'});
            Commodity.create({commodity_name:'Magnesite',commodity_type:'mining',commodity_id:'magnesite'});
            Commodity.create({commodity_name:'Magnesium',commodity_type:'mining',commodity_id:'magnesium'});
            Commodity.create({commodity_name:'Magnesium Chloride',commodity_type:'mining',commodity_id:'magnesium-chloride'});
            Commodity.create({commodity_name:'Marble',commodity_type:'mining',commodity_id:'marble'});
            Commodity.create({commodity_name:'Mercury',commodity_type:'mining',commodity_id:'mercury'});
            Commodity.create({commodity_name:'Mica',commodity_type:'mining',commodity_id:'mica'});
            Commodity.create({commodity_name:'Monazite',commodity_type:'mining',commodity_id:'monazite'});
            Commodity.create({commodity_name:'Perlite',commodity_type:'mining',commodity_id:'perlite'});
            Commodity.create({commodity_name:'Pyrite',commodity_type:'mining',commodity_id:'pyrite'});
            Commodity.create({commodity_name:'Rubidium',commodity_type:'mining',commodity_id:'rubidium'});
            Commodity.create({commodity_name:'Salt',commodity_type:'mining',commodity_id:'salt'});
            Commodity.create({commodity_name:'Scheelite',commodity_type:'mining',commodity_id:'scheelite'});
            Commodity.create({commodity_name:'Selenium',commodity_type:'mining',commodity_id:'selenium'});
            Commodity.create({commodity_name:'Silica',commodity_type:'mining',commodity_id:'silica'});
            Commodity.create({commodity_name:'Silica Sand',commodity_type:'mining',commodity_id:'silica-sand'});
            Commodity.create({commodity_name:'Sodium Bicarbonate',commodity_type:'mining',commodity_id:'sodium-bicarbonate'});
            Commodity.create({commodity_name:'Sodium Carbonate',commodity_type:'mining',commodity_id:'sodium-carbonate'});
            Commodity.create({commodity_name:'Sodium Sulfate',commodity_type:'mining',commodity_id:'sodium-sulfate'});
            Commodity.create({commodity_name:'Spodumene',commodity_type:'mining',commodity_id:'spodumene'});
            Commodity.create({commodity_name:'Strontium',commodity_type:'mining',commodity_id:'strontium'});
            Commodity.create({commodity_name:'Sulfur',commodity_type:'mining',commodity_id:'sulfur'});
            Commodity.create({commodity_name:'Sulfuric Acid',commodity_type:'mining',commodity_id:'sulfuric-acid'});
            Commodity.create({commodity_name:'Synthetic Rutile',commodity_type:'mining',commodity_id:'synthetic-rutile'});
            Commodity.create({commodity_name:'Talc',commodity_type:'mining',commodity_id:'talc'});
            Commodity.create({commodity_name:'Tellurium',commodity_type:'mining',commodity_id:'tellurium'});
            Commodity.create({commodity_name:'Thorium',commodity_type:'mining',commodity_id:'thorium'});
            Commodity.create({commodity_name:'Vermiculite',commodity_type:'mining',commodity_id:'vermiculite'});
            Commodity.create({commodity_name:'Zeolites',commodity_type:'mining',commodity_id:'zeolites'});
            Commodity.create({commodity_name:'Oil',commodity_type:'oil_and_gas',commodity_id:'oil'});
            Commodity.create({commodity_name:'Gas',commodity_type:'oil_and_gas',commodity_id:'gas'});
            console.log('Commodities created...');
        }
    });
};

exports.createDefaultCommodities = createDefaultCommodities;