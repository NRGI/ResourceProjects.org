'use strict';

angular.module('app')
    .factory('nrgiSitesSrvc', function($resource) {
        var SiteResource = $resource('/api/sites/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return SiteResource;
    });