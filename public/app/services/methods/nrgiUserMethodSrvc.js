'use strict';

angular.module('app')
    .factory('nrgiUserMethodSrvc', function(
        $http,
        $q,
        nrgiIdentitySrvc,
        nrgiUserSrvc
    ) {
        return {
            createUser: function(new_user_data) {
                var new_user = new nrgiUserSrvc(new_user_data);
                var dfd = $q.defer();

                new_user.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            updateUser: function(new_user_data) {
                var dfd = $q.defer();
                new_user_data.$update().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            deleteUser: function(user_deletion) {
                var dfd = $q.defer();
                var delete_ID = new nrgiUserSrvc();
                delete_ID.id = user_deletion;

                delete_ID.$delete().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            }
        }
    });