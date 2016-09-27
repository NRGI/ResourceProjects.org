'use strict';

angular.module('app')
    .factory('nrgiTransfersSrvc', function($resource) {
        var TransferResource = $resource('/api/transfers/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            // queryCached: {method:'GET', isArray: false, cache: true},
            update: {method: 'PUT', isArray: false}
        });

        return TransferResource;
    })
    .factory('nrgiTransfersByGovSrvc', function($resource) {
        var TransferResource = $resource('/api/transfersGov/:limit/:skip', {limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            // queryCached: {method:'GET', isArray: false, cache: true},
            update: {method: 'PUT', isArray: false}
        });

        return TransferResource;
    });