'use strict';
angular
    .module('app')
    .directive('nrgiLeaflet', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiLeafletCtrl',
            scope: {
                project:'=',
                map:'=',
                site:'=',
                data:'=',
                id:'=',
                type:'='
            },
            templateUrl: '/partials/directives/templates/nrgi-leaflet'
        };
    });