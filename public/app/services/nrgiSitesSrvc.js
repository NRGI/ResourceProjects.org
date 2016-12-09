'use strict';

angular.module('app')
    .factory('nrgiSitesSrvc', function($resource) {
        var SiteResource = $resource('/api/sites/:limit/:skip/:map/:data/:field/:_id', {_id: "@id", limit: "@limit", skip: "@skip", field: "@field",map: "@map",
            data: "@data"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return SiteResource;
    })