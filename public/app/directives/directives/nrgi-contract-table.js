'use strict';

angular
    .module('app')
    .directive('nrgiContractTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiContractTableCtrl',
            scope: {
                contracts: '='
            },
            templateUrl: '/partials/directives/templates/nrgi-contract-table'
        };
    });
