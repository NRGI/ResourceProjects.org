angular.module('app')
    .factory('nrgiContentMethodSrvc', function(
        $q
    ) {
        return {
            updateContentPage: function(new_about_page_data) {
                var dfd = $q.defer();
                new_about_page_data.$update().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            }
        }
    });