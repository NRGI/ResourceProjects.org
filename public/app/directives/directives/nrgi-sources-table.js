'use strict';

angular
    .module('app')
    .directive('nrgiSourcesTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiSourcesTableCtrl',
            scope: {
                id:'=',
                type:'='
            },
            templateUrl: '/partials/directives/templates/nrgi-sources-table'
        };
    });
