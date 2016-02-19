angular.module('app')
    .factory('nrgiSourcesMethodSrvc', function(
        $q,
        nrgiSourcesSrvc
    ) {
        return {
            createSource: function(new_source_data) {
                var new_source = new nrgiSourcesSrvc(new_source_data);
                var dfd = $q.defer();

                new_source.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            deleteSource: function(source_deletion) {
                var dfd = $q.defer();
                var delete_ID = new nrgiSourcesSrvc();
                delete_ID.id = source_deletion;

                delete_ID.$delete().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            },
            updateSource: function(new_source_data) {
                var dfd = $q.defer();
                new_source_data.$update().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            }
        }
    });