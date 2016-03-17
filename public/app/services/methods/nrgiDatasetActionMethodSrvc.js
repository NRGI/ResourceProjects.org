'use strict';

angular.module('app')
    .factory('nrgiDatasetActionMethodSrvc', function(
        $http,
        $q,
        nrgiDatasetActionSrvc
    ) {
        return {
            createAction: function(new_action_data) {
                var new_action = new nrgiDatasetActionSrvc(new_action_data);
                var dfd = $q.defer();

                new_action.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            }
        }
    });