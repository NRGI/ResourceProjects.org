'use strict';

angular.module('app')
    .factory('nrgiDatasetSrvc', function($resource) {
        var DatasetResource = $resource('/api/datasets/:_id', {_id: "@id"}, {
            query:  {method: 'GET', isArray: false},
            update: {method: 'PUT', isArray:false},
            save: {method: 'POST', isArray:false}
        });

        return DatasetResource;
    });