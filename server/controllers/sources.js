var Source 		= require('mongoose').model('Source'),
	User 		= require('mongoose').model('User'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getSources = function(req, res) {
	var count;
	Source.find(req.query).exec(function(err, source) {
		count = source.length;
		source =source.slice(req.params.skip,Number(req.params.limit)+Number(req.params.skip));
		res.send({data:source,count:count});
	});
};
exports.getSourceByID = function(req, res) {
	var created ='';
	Source.findOne({_id:req.params.id}).exec(function(err, source) {
		User.findOne({_id:source.create_author.toString()}).exec(function(err, user) {
			if(user!=null) {
				created = user.first_name + " " + user.last_name;
			}
			res.send({data:source,created:created});
		})
	});
};