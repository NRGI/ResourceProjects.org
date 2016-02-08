'use strict';

angular.module('app')
    .factory('nrgiConcessionsSrvc', function($http,$q) {
        return {
            getAllConcessions:function(limit,skip) {
                var dfd = $q.defer();
                $http.get('/api/concessions/'+limit+"/"+skip).then(function (response) {
                    if(response.data) {
                        dfd.resolve(response.data);
                    } else {
                        dfd.resolve(false);
                    }
                });
                return dfd.promise;
            },
            getConcessionById:function(id) {
                var dfd = $q.defer();
                $http.get('/api/concessions/'+id).then(function (response) {
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