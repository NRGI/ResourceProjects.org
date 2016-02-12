'use strict';

angular.module('app')
    .factory('nrgiCompaniesSrvc', function($resource) {
        var CompanyResource = $resource('/api/:record_type/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return CompanyResource;

    });



//angular.module('app')
//    .factory('nrgiCompaniesMethodSrvc', function($http,$q) {
//        return {
//            getAllCompanies:function(limit,skip) {
//                var dfd = $q.defer();
//                $http.get('/api/companies/'+limit +'/'+skip).then(function (response) {
//                    if(response.data) {
//                        dfd.resolve(response.data);
//                    } else {
//                        dfd.resolve(false);
//                    }
//                });
//                return dfd.promise;
//            },
//            getCompanyById:function(id) {
//                var dfd = $q.defer();
//                $http.get('/api/companies/'+id).then(function (response) {
//                    if(response.data) {
//                        dfd.resolve(response.data);
//                    } else {
//                        dfd.resolve(false);
//                    }
//                });
//                return dfd.promise;
//            },
//            getAllCompanyGroups:function(limit,skip) {
//                var dfd = $q.defer();
//                $http.get('/api/companyGroups/'+limit +'/'+skip).then(function (response) {
//                    if(response.data) {
//                        dfd.resolve(response.data);
//                    } else {
//                        dfd.resolve(false);
//                    }
//                });
//                return dfd.promise;
//            },
//            getCompanyGroupById:function(id) {
//                var dfd = $q.defer();
//                $http.get('/api/companyGroups/'+id).then(function (response) {
//                    if(response.data) {
//                        dfd.resolve(response.data);
//                    } else {
//                        dfd.resolve(false);
//                    }
//                });
//                return dfd.promise;
//            }
//        }
//    });


