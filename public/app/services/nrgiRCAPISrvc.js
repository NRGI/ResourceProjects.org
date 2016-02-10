'use strict';

//angular.module('app')
//    .factory('nrgiRC-APISrvc', function(Restangular) {
//        var CompanyResource = $resource('/api/companies/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
//            query:  {method:'GET', isArray: false},
//            update: {method: 'PUT', isArray: false}
//        });
//
//        Restangular.oneUrl('test', 'http://rc-api-stage.elasticbeanstalk.com/api/contract/ocds-591adf-6396832160RC/metadata').get(function (contract) {
//            console.log(contract);
//        });
//
//        module.factory('Users', function(Restangular) {
//            return Restangular.service('users');
//        });
//
//
//        return CompanyResource;
//
//    });

angular.module('app')
    .factory('nrgiRCAPISrvc', function(Restangular) {
        return Restangular.oneUrl('contract', 'http://rc-api-stage.elasticbeanstalk.com/api/contract/ocds-591adf-6396832160RC/metadata').get();
        //return Restangular.oneUrl('contract', '').get(function (contract) {
        //    console.log(contract);
        //});
    });