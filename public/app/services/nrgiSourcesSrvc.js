'use strict';

angular.module('app')
    .factory('nrgiSourcesSrvc', function($resource) {
        var SourceResource = $resource('/api/sources/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return SourceResource;
    });