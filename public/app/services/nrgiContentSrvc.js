'use strict';

angular.module('app')
    .factory('nrgiAboutPageContentSrvc', function($resource) {
        var ContentResource = $resource('/api/about', {}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ContentResource;
    })
    .factory('nrgiGlossaryPageContentSrvc', function($resource) {
        var ContentResource = $resource('/api/glossary', {}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ContentResource;
    })
    .factory('nrgiLandingPageContentSrvc', function($resource) {
        var ContentResource = $resource('/api/landing', {}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ContentResource;
    })