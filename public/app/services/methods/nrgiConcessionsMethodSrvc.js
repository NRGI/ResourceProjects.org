angular.module('app')
    .factory('nrgiConcessionsMethodSrvc', function(
        $q,
        nrgiConcessionsSrvc
    ) {
        return {
            createCompany: function(new_concession_data) {
                var new_concession = new nrgiConcessionsSrvc(new_concession_data);
                var dfd = $q.defer();

                new_concession.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            deleteCompany: function(concession_deletion) {
                var dfd = $q.defer();
                var delete_ID = new nrgiConcessionsSrvc();
                delete_ID.id = concession_deletion;

                delete_ID.$delete().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            },
            updateCompany: function(new_concession_data) {
                var dfd = $q.defer();
                new_concession_data.$update().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            }
        }
    });

'use strict';

//angular.module('app')
//    .factory('nrgiConcessionsSrvc', function($http,$q) {
//        return {
//            getAllConcessions:function(limit,skip) {
//                var dfd = $q.defer();
//                $http.get('/api/concessions/'+limit+"/"+skip).then(function (response) {
//                    if(response.data) {
//                        dfd.resolve(response.data);
//                    } else {
//                        dfd.resolve(false);
//                    }
//                });
//                return dfd.promise;
//            },
//            getConcessionById:function(id) {
//                var dfd = $q.defer();
//                $http.get('/api/concessions/'+id).then(function (response) {
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