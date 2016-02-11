var Source 		= require('mongoose').model('Source'),
	User 		= require('mongoose').model('User'),
	Link 	        = require('mongoose').model('Link'),
	async           = require('async'),
	encrypt 	= require('../utilities/encryption');
//.populate('comments.author', 'firstName lastName role')
exports.getSources = function(req, res) {
	var source_len, link_len, source_counter, link_counter,
		limit = Number(req.params.limit),
		skip = Number(req.params.skip);

	async.waterfall([
		sourceCount,
		getSourceSet,
		getSourceLinks
	], function (err, result) {
		if (err) {
			res.send(err);
		}
	});

	function sourceCount(callback) {
		Source.find({}).count().exec(function(err, source_count) {
			if(source_count) {
				callback(null, source_count);
			} else {
				callback(err);
			}
		});
	}

	function getSourceSet(source_count, callback) {
		Source.find(req.query)
			.sort({
				source_name: 'asc'
			})
			.skip(skip)
			.limit(limit)
			.lean()
			.exec(function(err, sources) {
				console.log(skip,sources.length);
				if(sources) {
					callback(null, source_count, sources);
				} else {
					callback(err);
				}
			});
	}
	function getSourceLinks(source_count, sources, callback) {
		source_len = sources.length;
		source_counter = 0;
		sources.forEach(function (c) {
			Link.find({source: c._id})
				.populate('project')
				.exec(function(err, links) {
					++source_counter;
					link_len = links.length;
					link_counter = 0;
					c.projects = 0;
					links.forEach(function(link) {
						++link_counter;
						switch (link.entities.pop('company')) {
							case 'project':
								c.projects += 1;
								break;
							//
							default:
								console.log('error');
						}

					});
					if(source_counter == source_len && link_counter == link_len) {
						res.send({data:sources, count:source_count});
					}
				});
		});
	}


	//var count;var sources=[];
	//Source.find(req.query).exec(function(err, source) {
	//	count = source.length;
	//	if(source.length!=0) {
	//		source = source.slice(req.params.skip, Number(req.params.limit) + Number(req.params.skip));
	//		source.forEach(function (item) {
	//			sources.push({
	//				_id:item._id,
	//				source_name:item.source_name,
	//				source_type:item.source_type,
	//				source_date:item.source_date,
	//				projects:item.projects.length
	//			})
	//		});
	//		res.send({data: sources, count: count});
	//	}else{
	//		res.send({data: source, count: count});
	//	}
	//});
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