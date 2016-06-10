'use strict';

angular.module('app')
    .factory('nrgiSourceTypesSrvc', function($resource) {
        var SourceTypeResource = $resource('/api/sourcetypes/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return SourceTypeResource;
    });