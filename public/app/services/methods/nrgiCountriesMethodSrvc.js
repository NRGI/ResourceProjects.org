angular.module('app')
    .factory('nrgiCountriesMethodSrvc', function(
        $q,
        nrgiCountriesSrvc
    ) {
        return {
            createSource: function(new_country_data) {
                var new_country = new nrgiCountriesSrvc(new_country_data);
                var dfd = $q.defer();

                new_country.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            deleteSource: function(country_deletion) {
                var dfd = $q.defer();
                var delete_ID = new nrgiCountriesSrvc();
                delete_ID.id = country_deletion;

                delete_ID.$delete().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            },
            updateSource: function(new_country_data) {
                var dfd = $q.defer();
                new_country_data.$update().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            }
        }
    });