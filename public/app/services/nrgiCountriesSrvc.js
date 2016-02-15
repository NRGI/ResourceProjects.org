'use strict';

angular.module('app')
    .factory('nrgiCountriesSrvc', function($resource) {
        var CountriesResource = $resource('/api/countries/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return CountriesResource;
    });