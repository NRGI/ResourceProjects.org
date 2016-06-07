'use strict';

angular.module('app')
    .factory('nrgiCountryCoordinatesSrvc', function($resource) {
        var CountriesResource = $resource('/api/coordinate/:type/:_id', {_id: "@id",type:"@type"}, {
            query:  {method:'GET', isArray: false}
        });

        return CountriesResource;
    })
    .factory('nrgiProjectsCoordinateSrvc', function($resource) {
        var CountriesResource = $resource('/api/projects/', {}, {
            query:  {method:'GET', isArray: false}
        });

        return CountriesResource;
    })