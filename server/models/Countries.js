////////////
//COUNTRIES
////////////
'use strict';
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);
var countrySchema, Country,
    links    = require('./Links'),
    deepPopulate    = require('mongoose-deep-populate')(mongoose),
    Schema   = mongoose.Schema,
    fact     = require("./Facts"),
    ObjectId = Schema.Types.ObjectId;

countrySchema = new Schema({
    iso2: String,
    name: String,
    country_aliases: [{
        type: ObjectId,
        ref: 'Alias'}],
    projects:[fact],
    country_type: [fact],
    country_commodity: [fact]
});

//countrySchema.plugin(mongooseHistory, options);

countrySchema.plugin(deepPopulate);
Country = mongoose.model('Country', countrySchema);

function createDefaultCountries() {
    Country.find({}).exec(function(err, countries) {
        if(countries.length === 0) {
            Country.create({_id:'56a7e6c02302369318e16bb8', iso2:'BG', name:'Bulgaria',country_type: [{source: '56747e060e8cc07115200ee3', string: 'mining'}],
                country_commodity: [{source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9e8'}]});
            Country.create({_id:'56a7e6c02302369318e16bb9', iso2:'AF', name:'Afghanistan',country_type: [{source: '56747e060e8cc07115200ee3', string: 'mining'}],
                country_commodity: [{source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9e8'}]});
            Country.create({_id:'56a7e6c02302369318e16bba', iso2:'NG', name:'Nigeria',country_type: [{source: '56747e060e8cc07115200ee3', string: 'mining'}],
                country_commodity: [{source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9e8'}]});
            Country.create({_id:'56a8d7d08e7079da05d6b542', iso2:'GH', name:'Ghana',country_type: [{source: '56747e060e8cc07115200ee3', string: 'mining'}],
                country_commodity: [{source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9e8'}]});
           //Country.create({
            //    _id:'56a7e6c02302369318e16bb8',
            //    iso2:'BG',
            //    name:'Bulgaria',
            //    country_type: [{source: '56747e060e8cc07115200ee3', string: 'mining'}],
            //    country_commodity: [{source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9e8'}]
            //});
            //Country.create({_id:'56a7e6c02302369318e16bb9', iso2:'AF', name:'Afghanistan',country_type: [{source: '56747e060e8cc07115200ee3', string: 'mining'}],
            //    country_commodity: [{source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9e8'}]});
            //Country.create({_id:'56a7e6c02302369318e16bba', iso2:'NG', name:'Nigeria',country_type: [{source: '56747e060e8cc07115200ee3', string: 'mining'}],
            //    country_commodity: [{source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9e8'}]});
            //Country.create({_id:'56a8d7d08e7079da05d6b542', iso2:'GH', name:'Ghana',country_type: [{source: '56747e060e8cc07115200ee3', string: 'mining'}],
            //    country_commodity: [{source: '56747e060e8cc07115200ee3', commodity: '56a13e9942c8bef50ec2e9e8'}]});


            Country.create({_id:'56a7e6c02302369318e16bb8',iso2:'AD',name:'Andorra',cctld:'.ad'});
            Country.create({_id:'56a7e6c02302369318e16bb9',iso2:'AE',name:'United Arab Emirates',cctld:'.ae'});
            Country.create({_id:'56a7e6c02302369318e16bba',iso2:'AF',name:'Afghanistan',cctld:'.af'});
            Country.create({_id:'56a8d7d08e7079da05d6b542',iso2:'AG',name:'Antigua and Barbuda',cctld:'.ag'});
            Country.create({iso2:'AI',name:'Anguilla',cctld:'.ai',notes:'AI previously represented French Afar and Issas'});
            Country.create({iso2:'AL',name:'Albania',cctld:'.al'});
            Country.create({iso2:'AM',name:'Armenia',cctld:'.am'});
            Country.create({iso2:'AO',name:'Angola',cctld:'.ao'});
            Country.create({iso2:'AQ',name:'Antarctica',cctld:'.aq',notes:'"Covers the territories south of 60° south latitude Code taken from name in French: *Antarctique*"'});
            Country.create({iso2:'AR',name:'Argentina',cctld:'.ar'});
            Country.create({iso2:'AS',name:'American Samoa',cctld:'.as'});
            Country.create({iso2:'AT',name:'Austria',cctld:'.at'});
            Country.create({iso2:'AU',name:'Australia',cctld:'.au',notes:'Includes the Ashmore and Cartier Islands and the Coral Sea Islands'});
            Country.create({iso2:'AW',name:'Aruba',cctld:'.aw'});
            Country.create({iso2:'AX',name:'Aland Islands !Åland Islands',cctld:'.ax',notes:'An autonomous province of Finland'});
            Country.create({iso2:'AZ',name:'Azerbaijan',cctld:'.az'});
            Country.create({iso2:'BA',name:'Bosnia and Herzegovina',cctld:'.ba'});
            Country.create({iso2:'BB',name:'Barbados',cctld:'.bb'});
            Country.create({iso2:'BD',name:'Bangladesh',cctld:'.bd'});
            Country.create({iso2:'BE',name:'Belgium',cctld:'.be'});
            Country.create({iso2:'BF',name:'Burkina Faso',cctld:'.bf',notes:'Name changed from *Upper Volta* (HV)'});
            Country.create({iso2:'BG',name:'Bulgaria',cctld:'.bg'});
            Country.create({iso2:'BH',name:'Bahrain',cctld:'.bh'});
            Country.create({iso2:'BI',name:'Burundi',cctld:'.bi'});
            Country.create({iso2:'BJ',name:'Benin',cctld:'.bj',notes:'Name changed from *Dahomey* (DY)'});
            Country.create({iso2:'BL',name:'Saint Barthélemy',cctld:'.bl'});
            Country.create({iso2:'BM',name:'Bermuda',cctld:'.bm'});
            Country.create({iso2:'BN',name:'Brunei Darussalam',cctld:'.bn',notes:'ISO country name follows UN designation (common name: *Brunei*)'});
            Country.create({iso2:'BO',name:'Bolivia, Plurinational State of',cctld:'.bo',notes:'"ISO country name follows UN designation (common name and previous ISO country name: *Bolivia*)"'});
            Country.create({iso2:'BQ',name:'Bonaire, Sint Eustatius and Saba',cctld:'.bq',notes:'"Consists of three Caribbean ""special municipalities"", which are part of the Netherlands proper: Bonaire, Sint Eustatius, and Saba (the BES Islands) Previous ISO country name: *Bonaire, Saint Eustatius and Saba* BQ previously represented British Antarctic Territory"'});
            Country.create({iso2:'BR',name:'Brazil',cctld:'.br'});
            Country.create({iso2:'BS',name:'Bahamas',cctld:'.bs'});
            Country.create({iso2:'BT',name:'Bhutan',cctld:'.bt'});
            Country.create({iso2:'BV',name:'Bouvet Island',cctld:'.bv',notes:'Belongs to Norway'});
            Country.create({iso2:'BW',name:'Botswana',cctld:'.bw'});
            Country.create({iso2:'BY',name:'Belarus',cctld:'.by',notes:'"Code taken from previous ISO country name: *Byelorussian SSR* (now assigned ISO 3166-3 code BYAA) Code assigned as the country was already a UN member since 1945[16]"'});
            Country.create({iso2:'BZ',name:'Belize',cctld:'.bz'});
            Country.create({iso2:'CA',name:'Canada',cctld:'.ca'});
            Country.create({iso2:'CC',name:'Cocos (Keeling) Islands',cctld:'.cc'});
            Country.create({iso2:'CD',name:'Congo, the Democratic Republic of the',cctld:'.cd',notes:'Name changed from *Zaire* (ZR)'});
            Country.create({iso2:'CF',name:'Central African Republic',cctld:'.cf'});
            Country.create({iso2:'CG',name:'Congo',cctld:'.cg'});
            Country.create({iso2:'CH',name:'Switzerland',cctld:'.ch',notes:'Code taken from name in Latin: *Confoederatio Helvetica*'});
            Country.create({iso2:'CI',name:'Cote d\'Ivoire',cctld:'.ci'});
            Country.create({iso2:'CK',name:'Cook Islands',cctld:'.ck'});
            Country.create({iso2:'CL',name:'Chile',cctld:'.cl'});
            Country.create({iso2:'CM',name:'Cameroon',cctld:'.cm'});
            Country.create({iso2:'CN',name:'China',cctld:'.cn'});
            Country.create({iso2:'CO',name:'Colombia',cctld:'.co'});
            Country.create({iso2:'CR',name:'Costa Rica',cctld:'.cr'});
            Country.create({iso2:'CU',name:'Cuba',cctld:'.cu'});
            Country.create({iso2:'CV',name:'Cabo Verde',cctld:'.cv'});
            Country.create({iso2:'CW',name:'Curaçao',cctld:'.cw'});
            Country.create({iso2:'CX',name:'Christmas Island',cctld:'.cx'});
            Country.create({iso2:'CY',name:'Cyprus',cctld:'.cy'});
            Country.create({iso2:'CZ',name:'Czech Republic',cctld:'.cz'});
            Country.create({iso2:'DE',name:'Germany',cctld:'.de',notes:'"Code taken from name in German: *Deutschland* Code used for West Germany before 1990 (previous ISO country name: *Germany, Federal Republic of*)"'});
            Country.create({iso2:'DJ',name:'Djibouti',cctld:'.dj',notes:'Name changed from *French Afar and Issas* (AI)'});
            Country.create({iso2:'DK',name:'Denmark',cctld:'.dk'});
            Country.create({iso2:'DM',name:'Dominica',cctld:'.dm'});
            Country.create({iso2:'DO',name:'Dominican Republic',cctld:'.do'});
            Country.create({iso2:'DZ',name:'Algeria',cctld:'.dz',notes:'Code taken from name in Kabyle: *Dzayer*'});
            Country.create({iso2:'EC',name:'Ecuador',cctld:'.ec'});
            Country.create({iso2:'EE',name:'Estonia',cctld:'.ee',notes:'Code taken from name in Estonian: *Eesti*'});
            Country.create({iso2:'EG',name:'Egypt',cctld:'.eg'});
            Country.create({iso2:'EH',name:'Western Sahara',cctld:'.eh',notes:'"Previous ISO country name: *Spanish Sahara* (code taken from name in Spanish:  *Sahara español*)"'});
            Country.create({iso2:'ER',name:'Eritrea',cctld:'.er'});
            Country.create({iso2:'ES',name:'Spain',cctld:'.es',notes:'Code taken from name in Spanish: *España*'});
            Country.create({iso2:'ET',name:'Ethiopia',cctld:'.et'});
            Country.create({iso2:'FI',name:'Finland',cctld:'.fi'});
            Country.create({iso2:'FJ',name:'Fiji',cctld:'.fj'});
            Country.create({iso2:'FK',name:'Falkland Islands (Malvinas)',cctld:'.fk'});
            Country.create({iso2:'FM',name:'Micronesia, Federated States of',cctld:'.fm',notes:'Previous ISO country name: *Micronesia*'});
            Country.create({iso2:'FO',name:'Faroe Islands',cctld:'.fo'});
            Country.create({iso2:'FR',name:'France',cctld:'.fr',notes:'Includes Clipperton Island'});
            Country.create({iso2:'GA',name:'Gabon',cctld:'.ga'});
            Country.create({iso2:'GB',name:'United Kingdom of Great Britain and Northern Ireland',cctld:'".gb (.uk)"',notes:'"Code taken from *Great Britain* (from official name: *United Kingdom of Great Britain and Northern Ireland*)[17] .uk is the primary ccTLD of the United Kingdom instead of .gb (see code UK, which is exceptionally reserved)"'});
            Country.create({iso2:'GD',name:'Grenada',cctld:'.gd'});
            Country.create({iso2:'GE',name:'Georgia',cctld:'.ge',notes:'GE previously represented Gilbert and Ellice Islands'});
            Country.create({iso2:'GF',name:'French Guiana',cctld:'.gf',notes:'Code taken from name in French: *Guyane française*'});
            Country.create({iso2:'GG',name:'Guernsey',cctld:'.gg',notes:'a British Crown dependency'});
            Country.create({iso2:'GH',name:'Ghana',cctld:'.gh'});
            Country.create({iso2:'GI',name:'Gibraltar',cctld:'.gi'});
            Country.create({iso2:'GL',name:'Greenland',cctld:'.gl'});
            Country.create({iso2:'GM',name:'Gambia',cctld:'.gm'});
            Country.create({iso2:'GN',name:'Guinea',cctld:'.gn'});
            Country.create({iso2:'GP',name:'Guadeloupe',cctld:'.gp'});
            Country.create({iso2:'GQ',name:'Equatorial Guinea',cctld:'.gq',notes:'Code taken from name in French: *Guinée équatoriale*'});
            Country.create({iso2:'GR',name:'Greece',cctld:'.gr'});
            Country.create({iso2:'GS',name:'South Georgia and the South Sandwich Islands',cctld:'.gs'});
            Country.create({iso2:'GT',name:'Guatemala',cctld:'.gt'});
            Country.create({iso2:'GU',name:'Guam',cctld:'.gu'});
            Country.create({iso2:'GW',name:'Guinea-Bissau',cctld:'.gw'});
            Country.create({iso2:'GY',name:'Guyana',cctld:'.gy'});
            Country.create({iso2:'HK',name:'Hong Kong',cctld:'.hk'});
            Country.create({iso2:'HM',name:'Heard Island and McDonald Islands',cctld:'.hm'});
            Country.create({iso2:'HN',name:'Honduras',cctld:'.hn'});
            Country.create({iso2:'HR',name:'Croatia',cctld:'.hr',notes:'Code taken from name in Croatian: *Hrvatska*'});
            Country.create({iso2:'HT',name:'Haiti',cctld:'.ht'});
            Country.create({iso2:'HU',name:'Hungary',cctld:'.hu'});
            Country.create({iso2:'ID',name:'Indonesia',cctld:'.id'});
            Country.create({iso2:'IE',name:'Ireland',cctld:'.ie'});
            Country.create({iso2:'IL',name:'Israel',cctld:'.il'});
            Country.create({iso2:'IM',name:'Isle of Man',cctld:'.im',notes:'a British Crown dependency'});
            Country.create({iso2:'IN',name:'India',cctld:'.in'});
            Country.create({iso2:'IO',name:'British Indian Ocean Territory',cctld:'.io'});
            Country.create({iso2:'IQ',name:'Iraq',cctld:'.iq'});
            Country.create({iso2:'IR',name:'Iran, Islamic Republic of',cctld:'.ir',notes:'ISO country name follows UN designation (common name: *Iran*)'});
            Country.create({iso2:'IS',name:'Iceland',cctld:'.is',notes:'Code taken from name in Icelandic: *Ísland*'});
            Country.create({iso2:'IT',name:'Italy',cctld:'.it'});
            Country.create({iso2:'JE',name:'Jersey',cctld:'.je',notes:'a British Crown dependency'});
            Country.create({iso2:'JM',name:'Jamaica',cctld:'.jm'});
            Country.create({iso2:'JO',name:'Jordan',cctld:'.jo'});
            Country.create({iso2:'JP',name:'Japan',cctld:'.jp'});
            Country.create({iso2:'KE',name:'Kenya',cctld:'.ke'});
            Country.create({iso2:'KG',name:'Kyrgyzstan',cctld:'.kg'});
            Country.create({iso2:'KH',name:'Cambodia',cctld:'.kh',notes:'"Code taken from former name: *Khmer Republic* Previous ISO country name: *Kampuchea*"'});
            Country.create({iso2:'KI',name:'Kiribati',cctld:'.ki'});
            Country.create({iso2:'KM',name:'Comoros',cctld:'.km',notes:'Code taken from name in Comorian: *Komori*'});
            Country.create({iso2:'KN',name:'Saint Kitts and Nevis',cctld:'.kn',notes:'Previous ISO country name: *Saint Kitts-Nevis-Anguilla*'});
            Country.create({iso2:'KP',name:'Korea, Democratic People\'s Republic of',cctld:'.kp',notes:'ISO country name follows UN designation (common name: *North Korea*)'});
            Country.create({iso2:'KR',name:'Korea, Republic of',cctld:'.kr',notes:'ISO country name follows UN designation (common name: *South Korea*)'});
            Country.create({iso2:'KW',name:'Kuwait',cctld:'.kw'});
            Country.create({iso2:'KY',name:'Cayman Islands',cctld:'.ky'});
            Country.create({iso2:'KZ',name:'Kazakhstan',cctld:'.kz',notes:'Previous ISO country name: *Kazakstan*'});
            Country.create({iso2:'LA',name:'Lao People\'s Democratic Republic',cctld:'.la',notes:'ISO country name follows UN designation (common name: *Laos*)'});
            Country.create({iso2:'LB',name:'Lebanon',cctld:'.lb'});
            Country.create({iso2:'LC',name:'Saint Lucia',cctld:'.lc'});
            Country.create({iso2:'LI',name:'Liechtenstein',cctld:'.li'});
            Country.create({iso2:'LK',name:'Sri Lanka',cctld:'.lk'});
            Country.create({iso2:'LR',name:'Liberia',cctld:'.lr'});
            Country.create({iso2:'LS',name:'Lesotho',cctld:'.ls'});
            Country.create({iso2:'LT',name:'Lithuania',cctld:'.lt'});
            Country.create({iso2:'LU',name:'Luxembourg',cctld:'.lu'});
            Country.create({iso2:'LV',name:'Latvia',cctld:'.lv'});
            Country.create({iso2:'LY',name:'Libya',cctld:'.ly',notes:'Previous ISO country name: *Libyan Arab Jamahiriya*'});
            Country.create({iso2:'MA',name:'Morocco',cctld:'.ma',notes:'Code taken from name in French: *Maroc*'});
            Country.create({iso2:'MC',name:'Monaco',cctld:'.mc'});
            Country.create({iso2:'MD',name:'Moldova, Republic of',cctld:'.md',notes:'"ISO country name follows UN designation (common name and previous ISO country name: *Moldova*)"'});
            Country.create({iso2:'ME',name:'Montenegro',cctld:'.me'});
            Country.create({iso2:'MF',name:'Saint Martin (French part)',cctld:'.mf',notes:'The Dutch part of Saint Martin island is assigned code SX'});
            Country.create({iso2:'MG',name:'Madagascar',cctld:'.mg'});
            Country.create({iso2:'MH',name:'Marshall Islands',cctld:'.mh'});
            Country.create({iso2:'MK',name:'Macedonia, the former Yugoslav Republic of',cctld:'.mk',notes:'"ISO country name follows UN designation (due to Macedonia naming dispute; official name used by country itself: *Republic of Macedonia*) Code taken from name in Macedonian: *Makedonija*"'});
            Country.create({iso2:'ML',name:'Mali',cctld:'.ml'});
            Country.create({iso2:'MM',name:'Myanmar',cctld:'.mm',notes:'Name changed from *Burma* (BU)'});
            Country.create({iso2:'MN',name:'Mongolia',cctld:'.mn'});
            Country.create({iso2:'MO',name:'Macao',cctld:'.mo',notes:'Previous ISO country name: *Macau*'});
            Country.create({iso2:'MP',name:'Northern Mariana Islands',cctld:'.mp'});
            Country.create({iso2:'MQ',name:'Martinique',cctld:'.mq'});
            Country.create({iso2:'MR',name:'Mauritania',cctld:'.mr'});
            Country.create({iso2:'MS',name:'Montserrat',cctld:'.ms'});
            Country.create({iso2:'MT',name:'Malta',cctld:'.mt'});
            Country.create({iso2:'MU',name:'Mauritius',cctld:'.mu'});
            Country.create({iso2:'MV',name:'Maldives',cctld:'.mv'});
            Country.create({iso2:'MW',name:'Malawi',cctld:'.mw'});
            Country.create({iso2:'MX',name:'Mexico',cctld:'.mx'});
            Country.create({iso2:'MY',name:'Malaysia',cctld:'.my'});
            Country.create({iso2:'MZ',name:'Mozambique',cctld:'.mz'});
            Country.create({iso2:'NA',name:'Namibia',cctld:'.na'});
            Country.create({iso2:'NC',name:'New Caledonia',cctld:'.nc'});
            Country.create({iso2:'NE',name:'Niger',cctld:'.ne'});
            Country.create({iso2:'NF',name:'Norfolk Island',cctld:'.nf'});
            Country.create({iso2:'NG',name:'Nigeria',cctld:'.ng'});
            Country.create({iso2:'NI',name:'Nicaragua',cctld:'.ni'});
            Country.create({iso2:'NL',name:'Netherlands',cctld:'.nl'});
            Country.create({iso2:'NO',name:'Norway',cctld:'.no'});
            Country.create({iso2:'NP',name:'Nepal',cctld:'.np'});
            Country.create({iso2:'NR',name:'Nauru',cctld:'.nr'});
            Country.create({iso2:'NU',name:'Niue',cctld:'.nu'});
            Country.create({iso2:'NZ',name:'New Zealand',cctld:'.nz'});
            Country.create({iso2:'OM',name:'Oman',cctld:'.om'});
            Country.create({iso2:'PA',name:'Panama',cctld:'.pa'});
            Country.create({iso2:'PE',name:'Peru',cctld:'.pe'});
            Country.create({iso2:'PF',name:'French Polynesia',cctld:'.pf',notes:'Code taken from name in French: *Polynésie française*'});
            Country.create({iso2:'PG',name:'Papua New Guinea',cctld:'.pg'});
            Country.create({iso2:'PH',name:'Philippines',cctld:'.ph'});
            Country.create({iso2:'PK',name:'Pakistan',cctld:'.pk'});
            Country.create({iso2:'PL',name:'Poland',cctld:'.pl'});
            Country.create({iso2:'PM',name:'Saint Pierre and Miquelon',cctld:'.pm'});
            Country.create({iso2:'PN',name:'Pitcairn',cctld:'.pn'});
            Country.create({iso2:'PR',name:'Puerto Rico',cctld:'.pr'});
            Country.create({iso2:'PS',name:'Palestine, State of',cctld:'.ps',notes:'"Previous ISO country name: *Palestinian Territory, Occupied* Consists of the West Bank and the Gaza Strip"'});
            Country.create({iso2:'PT',name:'Portugal',cctld:'.pt'});
            Country.create({iso2:'PW',name:'Palau',cctld:'.pw'});
            Country.create({iso2:'PY',name:'Paraguay',cctld:'.py'});
            Country.create({iso2:'QA',name:'Qatar',cctld:'.qa'});
            Country.create({iso2:'RE',name:'Reunion !Réunion',cctld:'.re'});
            Country.create({iso2:'RO',name:'Romania',cctld:'.ro'});
            Country.create({iso2:'RS',name:'Serbia',cctld:'.rs',notes:'"Code taken from official name: *Republic of Serbia* *(see Serbian country codes)*"'});
            Country.create({iso2:'RU',name:'Russian Federation',cctld:'.ru',notes:'ISO country name follows UN designation (common name: *Russia*)'});
            Country.create({iso2:'RW',name:'Rwanda',cctld:'.rw'});
            Country.create({iso2:'SA',name:'Saudi Arabia',cctld:'.sa'});
            Country.create({iso2:'SB',name:'Solomon Islands',cctld:'.sb',notes:'Code taken from former name: *British Solomon Islands*'});
            Country.create({iso2:'SC',name:'Seychelles',cctld:'.sc'});
            Country.create({iso2:'SD',name:'Sudan',cctld:'.sd'});
            Country.create({iso2:'SE',name:'Sweden',cctld:'.se'});
            Country.create({iso2:'SG',name:'Singapore',cctld:'.sg'});
            Country.create({iso2:'SH',name:'Saint Helena, Ascension and Tristan da Cunha',cctld:'.sh',notes:'Previous ISO country name: *Saint Helena*'});
            Country.create({iso2:'SI',name:'Slovenia',cctld:'.si'});
            Country.create({iso2:'SJ',name:'Svalbard and Jan Mayen',cctld:'.sj',notes:'Consists of two arctic territories of Norway: Svalbard and Jan Mayen'});
            Country.create({iso2:'SK',name:'Slovakia',cctld:'.sk',notes:'SK previously represented Sikkim'});
            Country.create({iso2:'SL',name:'Sierra Leone',cctld:'.sl'});
            Country.create({iso2:'SM',name:'San Marino',cctld:'.sm'});
            Country.create({iso2:'SN',name:'Senegal',cctld:'.sn'});
            Country.create({iso2:'SO',name:'Somalia',cctld:'.so'});
            Country.create({iso2:'SR',name:'Suriname',cctld:'.sr'});
            Country.create({iso2:'SS',name:'South Sudan',cctld:'.ss'});
            Country.create({iso2:'ST',name:'Sao Tome and Principe',cctld:'.st'});
            Country.create({iso2:'SV',name:'El Salvador',cctld:'.sv'});
            Country.create({iso2:'SX',name:'Sint Maarten (Dutch part)',cctld:'.sx',notes:'The French part of Saint Martin island is assigned code MF'});
            Country.create({iso2:'SY',name:'Syrian Arab Republic',cctld:'.sy',notes:'ISO country name follows UN designation (common name: *Syria*)'});
            Country.create({iso2:'SZ',name:'Swaziland',cctld:'.sz'});
            Country.create({iso2:'TC',name:'Turks and Caicos Islands',cctld:'.tc'});
            Country.create({iso2:'TD',name:'Chad',cctld:'.td',notes:'Code taken from name in French: *Tchad*'});
            Country.create({iso2:'TF',name:'French Southern Territories',cctld:'.tf',notes:'"Covers the French Southern and Antarctic Lands except Adélie Land Code taken from name in French: *Terres australes françaises*"'});
            Country.create({iso2:'TG',name:'Togo',cctld:'.tg'});
            Country.create({iso2:'TH',name:'Thailand',cctld:'.th'});
            Country.create({iso2:'TJ',name:'Tajikistan',cctld:'.tj'});
            Country.create({iso2:'TK',name:'Tokelau',cctld:'.tk'});
            Country.create({iso2:'TL',name:'Timor-Leste',cctld:'.tl',notes:'Name changed from *East Timor* (TP)'});
            Country.create({iso2:'TM',name:'Turkmenistan',cctld:'.tm'});
            Country.create({iso2:'TN',name:'Tunisia',cctld:'.tn'});
            Country.create({iso2:'TO',name:'Tonga',cctld:'.to'});
            Country.create({iso2:'TR',name:'Turkey',cctld:'.tr'});
            Country.create({iso2:'TT',name:'Trinidad and Tobago',cctld:'.tt'});
            Country.create({iso2:'TV',name:'Tuvalu',cctld:'.tv'});
            Country.create({iso2:'TW',name:'Taiwan, Province of China',cctld:'.tw',notes:'"Covers the current jurisdiction of the Republic of China except Kinmen and Lienchiang ISO country name follows UN designation (due to political status of Taiwan within the UN)[17]"'});
            Country.create({iso2:'TZ',name:'Tanzania, United Republic of',cctld:'.tz',notes:'ISO country name follows UN designation (common name: *Tanzania*)'});
            Country.create({iso2:'UA',name:'Ukraine',cctld:'.ua',notes:'"Previous ISO country name: *Ukrainian SSR* Code assigned as the country was already a UN member since 1945[16]"'});
            Country.create({iso2:'UG',name:'Uganda',cctld:'.ug'});
            Country.create({iso2:'UM',name:'United States Minor Outlying Islands',cctld:'.um',notes:'"Consists of nine minor insular areas of the United States: Baker Island, Howland Island, Jarvis Island, Johnston Atoll, Kingman Reef, Midway Islands, Navassa Island, Palmyra Atoll, and Wake Island"'});
            Country.create({iso2:'US',name:'United States of America',cctld:'.us'});
            Country.create({iso2:'UY',name:'Uruguay',cctld:'.uy'});
            Country.create({iso2:'UZ',name:'Uzbekistan',cctld:'.uz'});
            Country.create({iso2:'VA',name:'Holy See',cctld:'.va',notes:'"Covers Vatican City, territory of the Holy See Previous ISO country name: *Vatican City State (Holy See)*"'});
            Country.create({iso2:'VC',name:'Saint Vincent and the Grenadines',cctld:'.vc'});
            Country.create({iso2:'VE',name:'Venezuela, Bolivarian Republic of',cctld:'.ve',notes:'"ISO country name follows UN designation (common name and previous ISO country name: *Venezuela*)"'});
            Country.create({iso2:'VG',name:'Virgin Islands, British',cctld:'.vg'});
            Country.create({iso2:'VI',name:'Virgin Islands, U.S.',cctld:'.vi'});
            Country.create({iso2:'VN',name:'Viet Nam',cctld:'.vn',notes:'ISO country name follows UN designation (common name: *Vietnam*)'});
            Country.create({iso2:'VU',name:'Vanuatu',cctld:'.vu',notes:'Name changed from *New Hebrides* (NH)'});
            Country.create({iso2:'WF',name:'Wallis and Futuna',cctld:'.wf'});
            Country.create({iso2:'WS',name:'Samoa',cctld:'.ws',notes:'Code taken from former name: *Western Samoa*'});
            Country.create({iso2:'YE',name:'Yemen',cctld:'.ye',notes:'"Previous ISO country name: *Yemen, Republic of* Code used for North Yemen before 1990"'});
            Country.create({iso2:'YT',name:'Mayotte',cctld:'.yt'});
            Country.create({iso2:'ZA',name:'South Africa',cctld:'.za',notes:'Code taken from name in Dutch: *Zuid-Afrika*'});
            Country.create({iso2:'ZM',name:'Zambia',cctld:'.zm'});
            Country.create({iso2:'ZW',name:'Zimbabwe',cctld:'.zw',notes:'Name changed from *Southern Rhodesia* (RH)'});

            console.log('Countries created...');
        }
    });
};

exports.createDefaultCountries = createDefaultCountries;