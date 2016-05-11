'use strict';

angular.module('app')
    .factory('nrgiCountriesSrvc', function($resource) {
        var CountriesResource = $resource('/api/countries/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return CountriesResource;
    })
    .factory('nrgiCountryCommoditiesSrvc', function($resource) {
        var CountriesResource = $resource('/api/countrycommodity/:_id', {_id: "@id"}, {
            query:  {method:'GET', isArray: false}
        });

        return CountriesResource;
    });