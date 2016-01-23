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
                _id: "569976c21dad48f614cc8125",
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
                _id: "569976c21dad48f614cc8126",
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
                _id: "569976c21dad48f614cc8127",
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
                _id: "569976c21dad48f614cc8128",
                first_name: 'David',
                last_name: 'Mihalyi',
                username: 'dmihalyi',
                email: 'dmihalyi@resourcegovernance.org',
                salt:salt,
                hashed_pwd: hash,
                role: 'admin'});

            console.log('***Users Added');
        }
    })
};

exports.createDefaultUsers = createDefaultUsers;