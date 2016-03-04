'use strict';

angular.module('app')
    .factory('nrgiDatasetActionSrvc', function($resource) {
        var DatasetActionResource = $resource('/api/datasets/:_id/actions', {_id: "@id"}, {
            save: {method: 'POST', isArray:false}
        });

        return DatasetActionResource;
    });