'use strict';

angular.module('app')
    .factory('nrgiProjectsSrvc', function($resource) {
        var ProjectResource = $resource('/api/projects/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ProjectResource;
    });