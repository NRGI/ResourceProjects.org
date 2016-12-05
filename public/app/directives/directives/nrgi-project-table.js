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
                countryid:'=',
                companies: '=',
                commodity: '=',
                status: '=',
                id: '='
            },
            templateUrl: '/partials/directives/templates/nrgi-project-table'
        };
    });
