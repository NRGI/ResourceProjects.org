var Transfer 		= require('mongoose').model('Transfer'),
    async           = require('async'),
    _               = require("underscore"),
    request         = require('request');

exports.getTransfers = function(req, res) {
    var transfers_len, transfers_counter,
        limit = Number(req.params.limit),
        skip = Number(req.params.skip);

    async.waterfall([
        TransferCount,
        getTransferSet
    ], function (err, result) {
        if (err) {
            res.send(err);
        } else {
            if (req.query && req.query.callback) {
                return res.jsonp("" + req.query.callback + "(" + JSON.stringify(result) + ");");
            } else {
                return res.send(result);
            }
        }
    });
    function TransferCount(callback) {
        Transfer.find({}).count().exec(function(err, transfer_count) {
            if(transfer_count) {
                callback(null, transfer_count);
            } else {
                return res.send(err);
            }
        });
    }
    function getTransferSet(transfer_count, callback) {
        Transfer.find(req.query)
            .sort({
                proj_name: 'asc'
            })
            .skip(skip)
            .limit(limit)
            .populate('country', '_id iso2 name')
            .populate('company', ' _id company_name')
            .populate('project', ' _id proj_name proj_id')
            .populate('site', ' _id site_name field')
            .populate('source', '_id source_name source_url source_date source_type_id')
            .lean()
            .exec(function(err, transfers) {
                transfers_counter = 0;
                var proj_site={},project_transfers=[];
                transfers_len = transfers.length;
                if (transfers_len > 0) {
                    transfers.forEach(function (transfer) {
                        proj_site={};
                        if(transfer.project!=undefined){
                            proj_site =  {name:transfer.project.proj_name,_id:transfer.project.proj_id,type:'project'}
                        }
                        if(transfer.site!=undefined){
                            if(transfer.site.field){
                                proj_site =  {name:transfer.site.site_name,_id:transfer.site._id,type:'field'}
                            }
                            if(!transfer.site.field){
                                proj_site =  {name:transfer.site.site_name,_id:transfer.site._id,type:'site'}
                            }
                        }
                        ++transfers_counter;
                        if (!project_transfers.hasOwnProperty(transfer._id)) {
                            console.log(proj_site,Object.keys(proj_site).length)
                            if(Object.keys(proj_site).length != 0) {
                                project_transfers.push({
                                    _id: transfer._id,
                                    transfer_year: transfer.transfer_year,
                                    country: {
                                        name: transfer.country.name,
                                        iso2: transfer.country.iso2
                                    },
                                    transfer_type: transfer.transfer_type,
                                    transfer_unit: transfer.transfer_unit,
                                    transfer_value: transfer.transfer_value,
                                    proj_site: proj_site
                                });
                            }
                        }
                        if (transfer.company && transfer.company!=undefined&&Object.keys(proj_site).length != 0) {
                            _.last(project_transfers).company = {
                                _id: transfer.company._id,
                                company_name: transfer.company.company_name
                            };
                        }
                        if (transfers_counter === transfers_len) {
                            project_transfers = _.map(_.groupBy(project_transfers,function(doc){
                                return doc._id;
                            }),function(grouped){
                                return grouped[0];
                            });
                            transfers = project_transfers;
                            callback(null, {data: transfers, count: transfer_count});
                        }
                    });
                } else {
                    callback(null, {data: transfers, count: transfer_count});
                }
            });
    }
};