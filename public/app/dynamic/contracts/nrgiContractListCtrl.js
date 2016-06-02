'use strict';

angular.module('app')
    .controller('nrgiContractListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        $sce,
        nrgiContractsSrvc
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0;
            //_ = $rootScope._;

        $scope.count =0;
        $scope.busy = false;

        nrgiContractsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.contracts = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiContractsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
                    $scope.contracts = _.union($scope.contracts, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                });
            }
        };
    });
