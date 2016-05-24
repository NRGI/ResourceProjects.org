angular.module('app')
    .factory('nrgiContractsMethodSrvc', function(
        $q,
        nrgiContractsSrvc
    ) {
        return {
            createContract: function(new_contract_data) {
                var new_contract = new nrgiContractsSrvc(new_contract_data);
                var dfd = $q.defer();

                new_contract.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            deleteContract: function(contract_deletion) {
                var dfd = $q.defer();
                var delete_ID = new nrgiContractsSrvc();
                delete_ID.id = contract_deletion;

                delete_ID.$delete().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            updateContract: function(new_contract_data) {
                var dfd = $q.defer();
                new_contract_data.$update().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            }
        }
    });


//'use strict';
//
//angular.module('app')
//    .factory('nrgiContractsSrvc', function($http,$q) {
//        return {
//            getAllContracts:function(limit,skip) {
//                var dfd = $q.defer();
//                $http.get('/api/contracts/'+limit+"/"+skip).then(function (response) {
//                    if(response.data) {
//                        dfd.resolve(response.data);
//                    } else {
//                        dfd.resolve(false);
//                    }
//                });
//                return dfd.promise;
//            },
//            getContractById:function(id) {
//                var dfd = $q.defer();
//                $http.get('/api/contract/'+id).then(function (response) {
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