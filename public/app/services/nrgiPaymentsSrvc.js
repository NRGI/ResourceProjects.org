'use strict';

angular.module('app')
    .factory('nrgiPaymentsSrvc', function($resource) {
        var PaymentResource = $resource('/api/payments/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return PaymentResource;
    });