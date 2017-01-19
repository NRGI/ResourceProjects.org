'use strict';
angular
    .module('app')
    .directive('nrgiMap', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiMapCtrl',
            scope: {
                height:'=',
                type:'='
            },
            templateUrl: '/partials/directives/templates/nrgi-map'
        };
    });