'use strict';
angular
    .module('app')
    .directive('nrgiTreeMap', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiTreeMapCtrl',
            scope: {
                data:'='
            },
            templateUrl: '/partials/directives/templates/nrgi-tree-map'
        };
    });