'use strict';

angular
    .module('app')
    .directive('nrgiConcessionTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiConcessionTableCtrl',
            scope: {
                concessions: '='
            },
            templateUrl: '/partials/directives/templates/nrgi-concession-table'
        };
    });
