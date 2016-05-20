'use strict';

angular.module('app')
    .factory('nrgiConcessionsSrvc', function($resource) {
        var ConcessionResource = $resource('/api/concessions/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ConcessionResource;

    });