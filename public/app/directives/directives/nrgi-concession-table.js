'use strict';

angular
    .module('app')
    .directive('nrgiConcessionTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiConcessionTableCtrl',
            scope: {
                commodity:'=',
                country:'=',
                type:'=',
                status:'=',
                projects:'=',
                name:'=',
                id:'='
            },
            templateUrl: '/partials/directives/templates/nrgi-concession-table'
        };
    });
