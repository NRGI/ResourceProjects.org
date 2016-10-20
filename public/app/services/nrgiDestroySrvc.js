'use strict';

angular.module('app')
    // DO NOT MERGE TO PRODUCTION! FOR STAGING USE ONLY!
    .factory('nrgiDestroySrvc', function($resource) {
        var DestroyResource = $resource('/api/destroy', {}, {
            query: {method: 'GET', isArray: false}
        });

        return DestroyResource;
    });