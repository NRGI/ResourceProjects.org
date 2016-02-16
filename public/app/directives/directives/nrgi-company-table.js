'use strict';

angular
    .module('app')
    .directive('nrgiCompanyTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiCompanyTableCtrl',
            scope: {
                companies: '='
            },
            templateUrl: '/partials/directives/templates/nrgi-company-table'
        };
    });
