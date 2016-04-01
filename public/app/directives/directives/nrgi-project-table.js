'use strict';

angular
    .module('app')
    .directive('nrgiProjectTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiProjectTableCtrl',
            scope: {
                country: '=',
                type: '=',
                commoditytype:'=',
                companies: '=',
                commodity: '=',
                status: '=',
                id: '='
            },
            templateUrl: '/partials/directives/templates/nrgi-project-table'
        };
    });
