'use strict';

angular
    .module('app')
    .directive('nrgiSourcesTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiSourcesTableCtrl',
            scope: {
                sources: '='
            },
            templateUrl: '/partials/directives/templates/nrgi-sources-table'
        };
    });
