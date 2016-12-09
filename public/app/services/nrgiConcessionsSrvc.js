'use strict';

angular.module('app')
    .factory('nrgiConcessionsSrvc', function($resource) {
        var ConcessionResource = $resource('/api/concessions/:limit/:skip/:data/:_id', {_id: "@id", limit: "@limit", skip: "@skip", data: "@data"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ConcessionResource;

    })
    .factory('nrgiConcessionDataSrvc', function($resource) {
        var ConcessionResource = $resource('/api/concession/data/:_id', {_id: "@id", data: "@data"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ConcessionResource;

    });