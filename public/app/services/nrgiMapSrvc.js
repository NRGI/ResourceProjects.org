'use strict';

angular.module('app')
    .factory('nrgiCountryCoordinatesSrvc', function($resource) {
        var CountriesResource = $resource('/api/coordinate/:type/:_id', {_id: "@id",type:"@type"}, {
            query:  {method:'GET', isArray: false}
        });

        return CountriesResource;
    })
    .factory('nrgiMainMaprvc', function($resource) {
        var CountriesResource = $resource('/api/main_map/', {}, {
            query:  {method:'GET', isArray: false}
        });

        return CountriesResource;
    })