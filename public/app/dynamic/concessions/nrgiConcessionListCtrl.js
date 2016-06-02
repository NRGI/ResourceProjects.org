'use strict';

angular.module('app')
    .controller('nrgiConcessionListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiConcessionsSrvc
    ) {

        var limit = 50,
            currentPage = 0,
            totalPages = 0;
            //_ = $rootScope._;

        $scope.count =0;
        $scope.busy = false;

        nrgiConcessionsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.concessions = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiConcessionsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
                    $scope.concessions = _.union($scope.concessions, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                });
            }
        };
    });
