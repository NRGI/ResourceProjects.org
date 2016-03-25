'use strict';
angular
    .module('app')
    .directive('nrgiLeaflet', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiLeafletCtrl',
            scope: {
                data: '=',
                project:'=',
                map:'=',
                site:'=',
                polygon:'='
            },
            templateUrl: '/partials/directives/templates/nrgi-leaflet'
        };
    });