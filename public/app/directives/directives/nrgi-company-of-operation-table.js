'use strict';

angular
    .module('app')
    .directive('nrgiCompanyOperationTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiCompanyOperationTableCtrl',
            scope: {
                group: '=',
                countryid:'=',
                type: '=',
                stake: '=',
                project:'=',
                site:'=',
                contract:'=',
                concession:'=',
                incorporated: '=',
                operation: '=',
                id:'='
            },
            templateUrl: '/partials/directives/templates/nrgi-company-of-operation-table'
        };
    });
