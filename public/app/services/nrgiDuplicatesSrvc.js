'use strict';

angular.module('app')
    .factory('nrgiDuplicatesSrvc', function($resource) {
        var DuplicateResource = $resource('/api/duplicates/:limit/:skip/:id/:action', {id: "@id", action: "@action", limit: "@limit", skip: "@skip"}, {
            query:  {method: 'GET', isArray: true}
        });

        return DuplicateResource;
    });