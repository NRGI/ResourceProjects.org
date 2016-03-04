'use strict';

angular.module('app')
    .factory('nrgiDatasetMethodSrvc', function(
        $http,
        $q,
        nrgiDatasetSrvc
    ) {
        return {
            createDataset: function(new_dataset_data) {
                var new_dataset = new nrgiDatasetSrvc(new_dataset_data);
                var dfd = $q.defer();

                new_dataset.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            deleteDataset: function(dataset_deletion) {
                var dfd = $q.defer();
                var delete_ID = new nrgiDatasetSrvc();
                delete_ID.id = dataset_deletion;

                delete_ID.$delete().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            },
            updateDataset: function(new_dataset_data) {
                var dfd = $q.defer();
                new_dataset_data.$update().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            },
            createAction: function(new_action_data) {
                var new_action = new nrgiActionSrvc(new_action_data);
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