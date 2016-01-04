var projectSchema, Project,
    Schema = mongoose.Schema,
    mongoose 	= require('mongoose');

projectSchema = Schema({
//    first_name: {type:String, required:'{PATH} is required!'},
//    last_name: {type:String, required:'{PATH} is required!'},
//    username: {
//        type:String,
//        required: '{PATH} is required!',
//        unique:true
//    },
//    email: {type: String, required:'{PATH} is required'},
//    salt: {type:String, required:'{PATH} is required!'},
//    hashed_pwd: {type:String, required:'{PATH} is required!'},
//    roles: [{type:String, required:'{PATH} is required!', default:'None'}],
//    createdBy: String,
//    creationDate: {type: Date, default:Date.now},
//    address: String
//    // language: [String]
//    // groups: [String]
});

projectSchema.methods = {
//    authenticate: function(passwordToMatch) {
//        return encrypt.hashPwd(this.salt, passwordToMatch) === this.hashed_pwd;
//    },
//    hasRole: function(role) {
//        return this.roles.indexOf(role) > -1;
//    }
};

Project = mongoose.model('Project', projectSchema);

function createDefaultProjects() {
    Project.find({}).exec(function(err, projects) {
        if(projects.length === 0) {
            Project.create({

            });
            Project.create({

            });
            Project.create({

            });
            Project.create({

            });
            Project.create({

            });
        }
    });
};

exports.createDefaultProjects = createDefaultProjects;




///////////
//PROJECTS
///////////
//  - Source
//  - project name
//  - Project id
//  - Country
//  - notes
//  - Mine site or oil field name
//  - Address
//  - country
//  - coordinates
//  - location note
//  - project status - wiht time stamp
//  - aliases
//  - companies - name, share, is operator, notes
//  - contracts - title, rc link, id, notes
//  - concessions - name, country, country code, concessions id, notes
//  - commodities - commodity, type, note


//project aliases
//    - Source (#source)
//    - Project (#project)
//    - Alias (Language 1) (#project+skos:altLabel+1)
//    - Alias (Language 2) (#project+skos:altLabel+1)
//    - Alias (Language 3) (#project+skos:altLabel+2)
//    - Alias notes (#project+aliasNotes)
//
//Location, Commodity & Status
//Source
// Project
// Mine site or oil field name
// Address
// Country
// Country
// Code
// Latitute	Longitude
// Location note
// Commodity Type	Commodity	Commodity note
// Project Status
// Sample date
// Start Date (optional)
// End Date (optional)
// Status notes
//#source	#project	#project+site	#project+site+address	#-	#project+site+country+identifier	#project+site+lat	#project+site+long	#project+locationNotes	#commodity+commodityType	#commodity	#project+commodityNotes	#status+statusType	#status+trueAt	#status+startDate	#status+endDate	#project+statusNoteieies;