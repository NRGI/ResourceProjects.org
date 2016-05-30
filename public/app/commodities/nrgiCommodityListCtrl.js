'use strict';

angular.module('app')
    .controller('nrgiCommodityListCtrl', function (
        $scope,
        $rootScope,
        nrgiNotifier,
        nrgiCommoditiesSrvc
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.busy = false;
        nrgiCommoditiesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.commodities = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiCommoditiesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
                    $scope.commodities = _.union($scope.commodities, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                });
            }
        };
    });

