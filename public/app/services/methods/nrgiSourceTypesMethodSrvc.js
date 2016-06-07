angular.module('app')
    .factory('nrgiSourceTypesMethodSrvc', function(
        $q,
        nrgiSourceTypesSrvc
    ) {
        return {
            createSourceType: function(new_sourceType_data) {
                var new_sourceType = new nrgiSourceTypesSrvc(new_sourceType_data);
                var dfd = $q.defer();

                new_sourceType.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            updateSourceType: function(new_sourceType_data) {
                var dfd = $q.defer();
                new_sourceType_data.$update().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            deleteSourceType: function(sourceType_deletion) {
                var dfd = $q.defer();
                var delete_ID = new nrgiSourceTypesSrvc();
                delete_ID.id = sourceType_deletion;

                delete_ID.$delete().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            }
        }
    });