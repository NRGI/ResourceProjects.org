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
                status: '='
            },
            templateUrl: '/partials/directives/templates/nrgi-site-table'
        };
    });
