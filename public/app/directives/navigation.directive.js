'use strict';

angular.module('app')
    .directive('navigate', function() {
        return {
            restrict: 'E',
            scope: {
                page: '=',
                show: '=',
                count: '=',
                limit:'=',
                last:'=',
                first:'=',
                prev:'=',
                next:'=',
                select:'='
            },
            template: '<div class="dropdown"><div class="col-md-12"><div class="pager"><ul class="inline">' +
                '<li><button class="btn btn-link navigate" ng-disabled="page==0" ng-click="firstPage()"> << </button></li>' +
                '<li><button class="btn btn-link navigate" ng-disabled="page==0" ng-click="prevPage(page)"> < </button></li>' +
                '<li>Showing {{page}} to {{show}} of {{count}} projects. Number of records per page:' +
                '<form class="inline">' +
                '<select name="limit" ng-model="limit" ng-change="selectLimit(limit)">' +
                '<option selected="">50</option>' +
                '<option>200</option>' +
                '<option>1000</option>' +
                '</select>' +
                '</form>' +
                '</li>' +
                '<li><button class="btn btn-link navigate" ng-disabled="show>=count" ng-click="nextPage(page,show)"> > </button></li>' +
                '<li><button class="btn btn-link navigate" ng-disabled="show>=count" ng-click="lastPage()"> >> </button></li>' +
                '</ul></div></div></div>',
            link: function (scope) {
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

        }
    });