'use strict';

angular
    .module('app')
    .directive('nrgiSummaryStats', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiSummaryStatsCtrl',
            templateUrl: '/partials/directives/templates/nrgi-summary-stats'
        };
    });
