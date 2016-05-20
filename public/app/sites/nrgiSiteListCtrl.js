'use strict';

angular.module('app')
    .controller('nrgiSiteListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiSitesSrvc,
        $location
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0,
            _ = $rootScope._;

        $scope.count =0;
        $scope.field = false;
        $scope.busy = false;

        if ($location.path()=='/sites') {
            $scope.field =false;
            $scope.record_type = 'sites';
            $scope.route = 'site';
            $scope.header = 'Sites';
        } else if ($location.path()=='/fields') {
            $scope.field =true;
            $scope.route = 'field';
            $scope.record_type = 'fields';
            $scope.header = 'Fields';
        }

        nrgiSitesSrvc.query({skip: currentPage*limit, limit: limit, field: $scope.field}, function (response) {
            $scope.count = response.count;
            $scope.sites = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiSitesSrvc.query({skip: currentPage*limit, limit: limit, field: $scope.field}, function (response) {
                    $scope.sites = _.union($scope.sites, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                });
            }
        };
    });