var Source 		= require('mongoose').model('Source'),
	User 		= require('mongoose').model('User'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getSources = function(req, res) {
	var count;var sources=[];
	Source.find(req.query).exec(function(err, source) {
		count = source.length;
		if(source.length!=0) {
			source = source.slice(req.params.skip, Number(req.params.limit) + Number(req.params.skip));
			source.forEach(function (item) {
				sources.push({
					_id:item._id,
					source_name:item.source_name,
					source_type:item.source_type,
					source_date:item.source_date,
					projects:item.projects.length
				})
			});
			res.send({data: sources, count: count});
		}else{
			res.send({data: source, count: count});
		}
	});
};
exports.getSourceByID = function(req, res) {
	var created =''; var sourceByID =[];
	Source.findOne({_id:req.params.id}).exec(function(err, source) {
		if(source!=null) {
			User.findOne({_id: source.create_author.toString()}).exec(function (err, user) {
				if (user != null) {
					created = user.first_name + " " + user.last_name;
				}
				sourceByID.push({
					_id: source._id,
					source_name: source.source_name,
					source_type: source.source_type,
					source_date: source.source_date,
					create_date: source.create_date,
					retrieve_date: source.retrieve_date,
					source_archive_url: source.source_archive_url,
					source_url: source.source_url,
					source_notes: source.source_notes
				});
				res.send({data: sourceByID, created: created});
			});
		}else{
			res.send({data: source, created: created});
		}
	});
};