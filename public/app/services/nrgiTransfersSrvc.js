'use strict';

angular.module('app')
    .factory('nrgiTransfersSrvc', function($resource) {
        var TransferResource = $resource('/api/transfers/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return TransferResource;
    });