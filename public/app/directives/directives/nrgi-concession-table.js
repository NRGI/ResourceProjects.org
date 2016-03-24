'use strict';

angular
    .module('app')
    .directive('nrgiConcessionTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiConcessionTableCtrl',
            scope: {
                concessions: '=',
                commodity:'=',
                country:'=',
                type:'=',
                status:'=',
                projects:'='
            },
            templateUrl: '/partials/directives/templates/nrgi-concession-table'
        };
    });
