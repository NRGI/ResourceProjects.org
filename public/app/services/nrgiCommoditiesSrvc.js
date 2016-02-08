'use strict';

angular.module('app')
    .factory('nrgiCommoditiesSrvc', function($http,$q) {
        return {
            getAllCommodities:function(limit,skip) {
                var dfd = $q.defer();
                $http.get('/api/commodities/'+limit+"/"+skip).then(function (response) {
                    if(response.data) {
                        dfd.resolve(response.data);
                    } else {
                        dfd.resolve(false);
                    }
                });
                return dfd.promise;
            },
            getCoommodityById:function(id) {
                var dfd = $q.defer();
                $http.get('/api/commodities/'+id).then(function (response) {
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