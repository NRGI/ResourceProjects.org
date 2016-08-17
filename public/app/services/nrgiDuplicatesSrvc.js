'use strict';

angular.module('app')
    .factory('nrgiDuplicatesSrvc', function($resource) {
        var DuplicateResource = $resource('/api/duplicates/:type/:limit/:skip/:id/:action', {id: "@id", action: "@action", limit: "@limit", skip: "@skip", type: "@type"}, {
            query:  {method: 'GET', isArray: false}
        });

        return DuplicateResource;
    });