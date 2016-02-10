'use strict';

angular
    .module('app')
    .directive('nrgiListNav', function() {
        return {
            restrict: 'EA',
            controller: 'rgiListNavCtrl',
            //scope: true,
            scope: {
                page: '=',
                type: '=',
                show: '=',
                count: '=',
                limit:'=',
                last:'=',
                first:'=',
                prev:'=',
                next:'=',
                select:'='
            },
            templateUrl: '/partials/directives/templates/nrgi-list-nav'
        };
    });