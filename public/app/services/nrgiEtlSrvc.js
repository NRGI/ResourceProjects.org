'use strict';

angular.module('app')
    .factory('nrgiEtlSrvc', function($resource) {
        var EtlResource = $resource('/api/datasets/:_id', {_id: "@id"}, {
            query:  {method: 'GET', isArray: false},
            update: {method: 'PUT', isArray:false}
        });

        return EtlResource;
    });