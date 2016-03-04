'use strict';

angular.module('app')
    .factory('nrgiGroupsSrvc', function($resource) {
        var GroupResource = $resource('/api/companyGroups/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return GroupResource;

    });
