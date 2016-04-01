'use strict';

angular
    .module('app')
    .directive('nrgiCompanyTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiCompanyTableCtrl',
            scope: {
                group: '=',
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
            templateUrl: '/partials/directives/templates/nrgi-company-table'
        };
    });
