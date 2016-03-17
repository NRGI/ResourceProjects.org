'use strict';

angular
    .module('app')
    .directive('nrgiCommodityRout', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiCommodityRoutCtrl',
            scope: {
                id: '=',
                name:'=',
                commodity:'='
            },
            templateUrl: '/partials/directives/templates/nrgi-commodity-rout'
        };
    });

