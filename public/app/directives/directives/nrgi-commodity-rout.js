'use strict';

angular
    .module('app')
    .directive('nrgiCommodityRoute', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiCommodityRouteCtrl',
            scope: {
                id: '=',
                name:'=',
                commodity:'='
            },
            templateUrl: '/partials/directives/templates/nrgi-commodity-route'
        };
    });

