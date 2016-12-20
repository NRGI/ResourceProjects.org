'use strict';

angular
    .module('app')
    .directive('nrgiTransferByRecipientTable', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiTransferByRecipientTableCtrl',
            scope: {
                id:'=',
                type:'=',
                countryid:'='
            },
            templateUrl: '/partials/directives/templates/nrgi-transfer-by-recipient-table'
        };
    });


