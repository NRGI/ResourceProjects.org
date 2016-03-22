'use strict';

angular
    .module('app')
    .directive('nrgiProductionTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiProductionTableCtrl',
            scope: {
                production: '=',
                project_link: '='
            },
            templateUrl: '/partials/directives/templates/nrgi-production-table'
        };
    });
