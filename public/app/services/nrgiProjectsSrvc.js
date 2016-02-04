'use strict';

angular.module('app')
    .factory('nrgiProjectsSrvc', function($http,$q) {
        return {
            getAllProjects:function(limit,skip) {
                var dfd = $q.defer();
                $http.get('/api/projects/'+limit +'/'+skip).then(function (response) {
                    if(response.data) {
                        dfd.resolve(response.data);
                    } else {
                        dfd.resolve(false);
                    }
                });
                return dfd.promise;
            },
            getProjectById:function(id) {
                var dfd = $q.defer();
                $http.get('/api/project/'+id).then(function (response) {
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