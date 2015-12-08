var mongoose 	= require('mongoose'),
	encrypt		= require('../utilities/encryption');

var userSchema = mongoose.Schema({
	first_name: {type:String, required:'{PATH} is required!'},
	last_name: {type:String, required:'{PATH} is required!'},
	username: {
		type:String,
		required: '{PATH} is required!',
		unique:true
	},
	email: {type: String, required:'{PATH} is required'},
	salt: {type:String, required:'{PATH} is required!'},
	hashed_pwd: {type:String, required:'{PATH} is required!'},
	roles: [{type:String, required:'{PATH} is required!', default:'None'}],
	createdBy: String,
	creationDate: {type: Date, default:Date.now},
	address: String
	// language: [String]
	// groups: [String]
});

userSchema.methods = {
	authenticate: function(passwordToMatch) {
			return encrypt.hashPwd(this.salt, passwordToMatch) === this.hashed_pwd;
	},
	hasRole: function(role) {
			return this.roles.indexOf(role) > -1;
	}
};

var User = mongoose.model('User', userSchema);

function createDefaultUsers() {
	User.find({}).exec(function(err, collection) {
		if(collection.length === 0) {
			var salt, hash;
			salt = encrypt.createSalt();
			hash = encrypt.hashPwd(salt, 'jcust');
			User.create({first_name:'Jim',last_name:'Cust',username:'jcust',email:'jcust@resourcegovernance.org',salt: salt, hashed_pwd: hash,roles: 'supervisor'});
			salt = encrypt.createSalt();
			hash = encrypt.hashPwd(salt, 'cperry');
			User.create({first_name:'Chris',last_name:'Perry',username:'cperry',email:'cperry@resourcegovernance.org',salt: salt,hashed_pwd: hash,roles: 'researcher',assessments:[]});
			salt = encrypt.createSalt();
			hash = encrypt.hashPwd(salt, 'apederson');
			User.create({first_name:'Anders',last_name:'Pederson',username:'apederson',email:'apederson@resourcegovernance.org',salt: salt,hashed_pwd: hash,roles: 'reviewer',assessments:[]});
			salt = encrypt.createSalt();
			hash = encrypt.hashPwd(salt, 'ahasermann');
			User.create({first_name:'Anna',last_name:'Hasermann',username:'ahasermann',email:'ahasermann@resourcegovernance.org',salt: salt,hashed_pwd: hash,roles:'researcher',assessments:[]});
			salt = encrypt.createSalt();
			hash = encrypt.hashPwd(salt, 'mkauffmann');
			User.create({first_name:'Mayeul',last_name:'Kauffmann',username:'mkauffmann',email:'mkauffmann@resourcegovernance.org',salt:salt,hashed_pwd: hash,roles:'reviewer',assessments:[]});
		}
	})
};


exports.createDefaultUsers = createDefaultUsers;