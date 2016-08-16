'use strict';
angular
    .module('app')
    .directive('nrgiMap', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiMapCtrl',
            scope: {
                data:'='
            },
            templateUrl: '/partials/directives/templates/nrgi-map'
        };
    });