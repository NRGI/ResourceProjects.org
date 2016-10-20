'use strict';

angular.module('app')
    .factory('nrgiCountryCoordinatesSrvc', function($resource) {
        var CountriesResource = $resource('/api/coordinate/:type/:_id', {_id: "@id",type:"@type"}, {
            query:  {method:'GET', isArray: false}
        });

        return CountriesResource;
    })
    .factory('nrgiMainMapSrvc', function($resource) {
        var CountriesResource = $resource('/api/main_map/', {}, {
            query:  {method:'GET', isArray: false}
        });

        return CountriesResource;
    })
    .factory('nrgiTreeMapSrvc', function($resource) {
        var CountriesResource = $resource('/api/treemap/', {}, {
            query:  {method:'GET', isArray: false}
        });

        return CountriesResource;
    })