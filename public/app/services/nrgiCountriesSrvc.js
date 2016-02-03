'use strict';

angular.module('app')
    .factory('nrgiCountriesSrvc', function($http,$q) {
        return {
            getAllCountries:function() {
                var dfd = $q.defer();
                $http.get('/api/countries').then(function (response) {
                    if(response.data) {
                        dfd.resolve(response.data);
                    } else {
                        dfd.resolve(false);
                    }
                });
                return dfd.promise;
            },
            getCountryById:function(id) {
                var dfd = $q.defer();
                $http.get('/api/countries/'+id).then(function (response) {
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