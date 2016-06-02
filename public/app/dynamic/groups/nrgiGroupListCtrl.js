'use strict';

angular.module('app')
    .controller('nrgiGroupListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiGroupsSrvc
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.busy = false;

        nrgiGroupsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.groups = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiGroupsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
                    $scope.groups = _.union($scope.groups, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                });
            }
        };
    });
