'use strict';

angular.module('app')
    .factory('nrgiDuplicatesSrvc', function($resource) {
        var DuplicateResource = $resource('/api/duplicates/:id/:action', {id: "@id", action: "@action"}, {
            query:  {method: 'GET', isArray: true}
        });

        return DuplicateResource;
    });