'use strict';

angular
    .module('app')
    .directive('nrgiTransferTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiTransferTableCtrl',
            scope: {
                transfers: '=',
                project: '=',
                projectlink: '='
            },
            templateUrl: '/partials/directives/templates/nrgi-transfer-table'
        };
    });
