'use strict';

angular
    .module('app')
    .directive('nrgiTransferTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiTransferTableCtrl',
            scope: {
                id:'=',
                type:'=',
                project: '=',
                projectlink: '='
            },
            templateUrl: '/partials/directives/templates/nrgi-transfer-table'
        };
    });


