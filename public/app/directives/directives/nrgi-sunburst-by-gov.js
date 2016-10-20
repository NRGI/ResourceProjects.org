'use strict';

angular
    .module('app')
    .directive('nrgiSunburstByGov', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiSunburstByGovCtrl',
            templateUrl: '/partials/directives/templates/nrgi-sunburst-by-gov'
        };
    });
