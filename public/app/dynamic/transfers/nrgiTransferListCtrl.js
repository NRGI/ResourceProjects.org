'use strict';

angular.module('app')
    .controller('nrgiTransferListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiTransfersSrvc
    ) {
        var limit = 1500,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.busy = false;

        nrgiTransfersSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.transfers = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
        });
        
        // $scope.loadMore = function() {
        //     if ($scope.busy) return;
        //     $scope.busy = true;
        //     if(currentPage < totalPages) {
        //         nrgiPaymentsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
        //             $scope.projects = _.union($scope.projects, response.data);
        //             currentPage = currentPage + 1;
        //             $scope.busy = false;
        //         });
        //     }
        // };
    });
