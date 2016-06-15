'use strict';

angular
    .module('app')
    .directive('nrgiLastAdded', function() {
        return {
            restrict: 'EA',
            controller: 'nrgiLastAddedCtrl',
            templateUrl: '/partials/directives/templates/nrgi-last-added'
        };
    });
