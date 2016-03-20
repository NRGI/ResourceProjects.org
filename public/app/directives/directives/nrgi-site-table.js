'use strict';

angular
    .module('app')
    .directive('nrgiSiteTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiSiteTableCtrl',
            scope: {
                sites: '=',
                commodity: '=',
                status: '=',
                country: '=',
                type: '='
            },
            templateUrl: '/partials/directives/templates/nrgi-site-table'
        };
    });
