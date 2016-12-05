var errorList=[];
exports.errorFunction = function(err,type){
	err = new Error('Error: '+err);
	errorList.push({type:type, message:err.toString()})
	return errorList;
}