angular.module('app')
    .factory('nrgiConcessionsMethodSrvc', function(
        $q,
        nrgiConcessionsSrvc
    ) {
        return {
            createConcession: function(new_concession_data) {
                var new_concession = new nrgiConcessionsSrvc(new_concession_data);
                var dfd = $q.defer();

                new_concession.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            updateConcession: function(new_concession_data) {
                var dfd = $q.defer();
                new_concession_data.$update().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            },
            deleteConcession: function(concession_deletion) {
                var dfd = $q.defer();
                var delete_ID = new nrgiConcessionsSrvc();
                delete_ID.id = concession_deletion;

                delete_ID.$delete().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            }
        }
    });