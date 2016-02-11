'use strict';

angular
    .module('app')
    .directive('nrgiListNav', function() {
        return {
            restrict: 'E',
            //controller: 'rgiListNavCtrl',
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
            templateUrl: '/partials/directives/templates/nrgi-list-nav',
            link:function (scope) {
                scope.lastPage = function () {
                    scope.last(scope.page);
                };
                scope.firstPage = function () {
                    scope.first(scope.page);
                };
                scope.prevPage = function () {
                    scope.prev(scope.page);
                };
                scope.nextPage = function () {
                    scope.next(scope.page,scope.show);
                };
                scope.selectLimit = function () {
                    scope.select(scope.limit);
                };
            }
        };
    });