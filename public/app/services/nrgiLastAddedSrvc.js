'use strict';

angular.module('app')
    .factory('nrgiLastAddedSrvc', function($resource) {
        var LastAddedResource = $resource('/api/last_added', {}, {
            query:  {method:'GET', isArray: false}
        });

        return LastAddedResource;

    });