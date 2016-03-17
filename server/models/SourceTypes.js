//////////////////
//SOURCE SCHEMA///
//////////////////
'use strict';
var mongoose = require('mongoose');
require('mongoose-html-2').loadType(mongoose);

var sourceTypeSchema, SourceType,
    Schema          = mongoose.Schema,
    ObjectId        = Schema.Types.ObjectId,
    HTML            = mongoose.Types.Html,
    htmlSettings    = {
        type: HTML,
        setting: {
            allowedTags: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'del'],
            allowedAttributes: {
                'a': ['href']
            }
        }
    };

sourceTypeSchema = new Schema({
    source_type_name: String,
    source_type_id: String, // loaded, edit. api
    //source_type_id: String,
    source_type_authority: String,
    source_type_examples: String,
    source_type_url_type: String,
    source_type_notes: String
});

SourceType = mongoose.model('SourceType', sourceTypeSchema);

function createDefaultSourceTypes() {
    SourceType.find({}).exec(function(err, source_types) {
        if(source_types.length === 0) {
            SourceType.create({_id:'56e873691d1d2a3824141427',source_type_name:'Voluntary payment disclosure',source_type_id:'vpd',source_type_authority:'Authoritative source',source_type_examples:'Voluntary company disclosure - (eg. http://www.kosmosenergy.com/responsibility/transparency.php)',source_type_url_type:'Direct link to data in HTML report'});
            SourceType.create({_id:'56e873691d1d2a3824141429',source_type_name:'Mandatory payment disclosure',source_type_id:'mpd',source_type_authority:'Authoritative source',source_type_examples:'Mandatory company disclosure (eg. http://www.detnor.no/wp-content/uploads/2015/03/DETNOR-Annual-Report-2014.pdf?d5b1f2 )',source_type_url_type:'Direct link to data in PDF report'});
            SourceType.create({_id:'56e873691d1d2a3824141428',source_type_name:'EITI report',source_type_id:'eiti',source_type_authority:'Authoritative source',source_type_examples:'EITI report (eg. https://eiti.org/files/EITI-2010-2011-oil-final.pdf)',source_type_url_type:'Direct link to data in XLS report'});
            SourceType.create({_id:'56e873691d1d2a382414142e',source_type_name:'Government report',source_type_id:'govreport',source_type_authority:'Authoritative source',source_type_examples:'Government report (eg. http://www.minfin.gv.ao/docs/dspPetrolDiamond.htm)',source_type_url_type:'Direct link to image or other displaying of information'});
            SourceType.create({_id:'56e873691d1d2a382414142a',source_type_name:'Government database',source_type_id:'govdb',source_type_authority:'Authoritative source',source_type_examples:'Cadastres, etc.',source_type_url_type:'Information not accessible via direct URL'});
            SourceType.create({_id:'56e873691d1d2a382414142b',source_type_name:'Other authoritative source',source_type_id:'otherauth',source_type_authority:'Authoritative source',source_type_examples:'Other source',source_type_url_type:'Other'});
            SourceType.create({_id:'56e873691d1d2a382414142c',source_type_name:'Extractive company report',source_type_id:'companyreport',source_type_authority:'Authoritative source',source_type_examples:'Annual report, stock exchange filing, '});
            SourceType.create({_id:'56e873691d1d2a3824141433',source_type_name:'International organization report',source_type_id:'ioreport',source_type_authority:'Authoritative source',source_type_examples:'IMF, WB, EIA reports'});
            SourceType.create({_id:'56e873691d1d2a3824141431',source_type_name:'Company database',source_type_id:'companydb',source_type_authority:'Authoritative source'});
            SourceType.create({_id:'56e873691d1d2a382414142d',source_type_name:'Wikipedia',source_type_id:'wikipedia',source_type_authority:'Non-authoritative source'});
            SourceType.create({_id:'56e873691d1d2a382414142f',source_type_name:'Google maps',source_type_id:'googlemaps',source_type_authority:'Non-authoritative source'});
            SourceType.create({_id:'56e873691d1d2a3824141430',source_type_name:'Press article',source_type_id:'press',source_type_authority:'Non-authoritative source'});
            SourceType.create({_id:'56e873691d1d2a3824141432',source_type_name:'Other non-authoritative source',source_type_id:'othernonauth',source_type_authority:'Non-authoritative source'});
            console.log('Source types created...');
        }
    });
};

exports.createDefaultSourceTypes = createDefaultSourceTypes;