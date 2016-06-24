'use strict';

angular
    .module('app')
    .directive('nrgiSunburst', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiSunburstCtrl',
            templateUrl: '/partials/directives/templates/nrgi-sunburst'
        };
    });
