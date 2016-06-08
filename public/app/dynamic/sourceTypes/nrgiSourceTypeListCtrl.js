'use strict';

angular.module('app')
    .controller('nrgiSourceTypeListCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiSourceTypesSrvc,
        $rootScope
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.field = false;
        $scope.busy = false;

        nrgiSourceTypesSrvc.query({skip: currentPage*limit, limit: limit, display: true}, function (response) {
            $scope.count = response.count;
            $scope.sourceTypes = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiSourceTypesSrvc.query({skip: currentPage*limit, limit: limit, display: true}, function (response) {
                    $scope.sourceTypes = _.union($scope.sourceTypes, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                });
            }
        };
    });