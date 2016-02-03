'use strict';

angular.module('app')
    .factory('nrgiCompaniesSrvc', function($http,$q) {
        return {
            getAllCompanies:function(limit,skip) {
                var dfd = $q.defer();
                $http.get('/api/companies/'+limit +'/'+skip).then(function (response) {
                    if(response.data) {
                        dfd.resolve(response.data);
                    } else {
                        dfd.resolve(false);
                    }
                });
                return dfd.promise;
            },
            getCompanyById:function(id) {
                var dfd = $q.defer();
                $http.get('/api/companies/'+id).then(function (response) {
                    if(response.data) {
                        dfd.resolve(response.data);
                    } else {
                        dfd.resolve(false);
                    }
                });
                return dfd.promise;
            },
            getAllCompanyGroups:function() {
                var dfd = $q.defer();
                $http.get('/api/companyGroups').then(function (response) {
                    if(response.data) {
                        dfd.resolve(response.data);
                    } else {
                        dfd.resolve(false);
                    }
                });
                return dfd.promise;
            },
            getCompanyGroupById:function(id) {
                var dfd = $q.defer();
                $http.get('/api/companyGroups/'+id).then(function (response) {
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