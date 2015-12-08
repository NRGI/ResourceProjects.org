angular.module('app').value('nrgiToastr', toastr);

angular.module('app').factory('nrgiNotifier', function(nrgiToastr) {
  return {
    notify: function(msg) {
      nrgiToastr.success(msg);
      console.log(msg);
    },
    error: function(msg) {
    	nrgiToastr.error(msg);
    	console.log(msg);
    }
  }
})