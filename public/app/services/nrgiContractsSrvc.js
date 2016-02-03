'use strict';

angular.module('app')
    .factory('nrgiContractsSrvc', function($http,$q) {
        return {
            getAllContracts:function(limit,skip) {
                var dfd = $q.defer();
                $http.get('/api/contracts').then(function (response) {
                    if(response.data) {
                        dfd.resolve(response.data);
                    } else {
                        dfd.resolve(false);
                    }
                });
                return dfd.promise;
            },
            getContractById:function(id) {
                var dfd = $q.defer();
                $http.get('/api/contract/'+id).then(function (response) {
                    if(response.data) {
                        dfd.resolve(response.data);
                    } else {
                        dfd.resolve(false);
                    }
                });
                return dfd.promise;
            }
        }
    });