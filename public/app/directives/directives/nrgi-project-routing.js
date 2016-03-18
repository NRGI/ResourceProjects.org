'use strict';

angular
    .module('app')
    .directive('nrgiProjectRouting', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiProjectRoutingCtrl',
            scope: {
                id: '=',
                name:'=',
                project:'='
            },
            templateUrl: '/partials/directives/templates/nrgi-project-routing'
        };
    });
