'use strict ';
var userSchema, User,
    mongoose 	= require('mongoose'),
    Schema      = mongoose.Schema,
    encrypt		= require('../utilities/encryption');

userSchema = new Schema({
    first_name: {type:String, required: '{PATH} is required!'},
    last_name: {type:String, required: '{PATH} is required!'},
    username: {
        type:String,
        required: '{PATH} is required!',
        unique:true
    },
    email: {type: String, required: '{PATH} is required'},
    salt: {type:String, required: '{PATH} is required!'},
    hashed_pwd: {type:String, required: '{PATH} is required!'},
    role: {type:String, required: '{PATH} is required!', default: 'admin'},
    createdBy: String,
    creationDate: {type: Date, default:Date.now}
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

User = mongoose.model('User', userSchema);

function createDefaultUsers() {
    User.find({}).exec(function(err, collection) {
        if(collection.length === 0) {
            var salt, hash;
            salt = encrypt.createSalt();
            hash = encrypt.hashPwd(salt, 'jcust');
            User.create({
                first_name: 'Jim',
                last_name: 'Cust',
                username: 'jcust',
                email: 'jcust@resourcegovernance.org',
                salt:salt,
                hashed_pwd: hash,
                role: 'admin'});
            salt = encrypt.createSalt();
            hash = encrypt.hashPwd(salt, 'cperry');
            User.create({
                first_name: 'Chris',
                last_name: 'Perry',
                username: 'cperry',
                email: 'cperry@resourcegovernance.org',
                salt:salt,
                hashed_pwd: hash,
                role: 'admin'});
            salt = encrypt.createSalt();
            hash = encrypt.hashPwd(salt, 'apederson');
            User.create({
                first_name: 'Anders',
                last_name: 'Pedersen',
                username: 'apedersen',
                email: 'apedersen@resourcegovernance.org',
                salt:salt,
                hashed_pwd: hash,
                role: 'admin'});
            salt = encrypt.createSalt();
            hash = encrypt.hashPwd(salt, 'dmihalyi');
            User.create({
                first_name: 'David',
                last_name: 'Mihalyi',
                username: 'dmihalyi',
                email: 'dmihalyi@resourcegovernance.org',
                salt:salt,
                hashed_pwd: hash,
                role: 'admin'});
        }
    })
};


exports.createDefaultUsers = createDefaultUsers;