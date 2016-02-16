'use strict';

angular
    .module('app')
    .directive('nrgiProductionTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiProductionTableCtrl',
            scope: {
                productions: '='
            },
            templateUrl: '/partials/directives/templates/nrgi-production-table'
        };
    });
