'use strict';

angular
    .module('app')
    .directive('nrgiCompanyTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiCompanyTableCtrl',
            scope: {
                companies: '=',
                stake: '=',
                group:'='
            },
            templateUrl: '/partials/directives/templates/nrgi-company-table'
        };
    });
