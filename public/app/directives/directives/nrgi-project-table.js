'use strict';

angular
    .module('app')
    .directive('nrgiProjectTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiProjectTableCtrl',
            scope: {
                projects: '=',
                country: '=',
                type: '=',
                companies: '=',
                commodity: '=',
                status: '='
            },
            templateUrl: '/partials/directives/templates/nrgi-project-table'
        };
    });
