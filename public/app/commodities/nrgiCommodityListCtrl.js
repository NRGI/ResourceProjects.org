'use strict';

angular.module('app')
    .controller('nrgiCommodityListCtrl', function (
        $scope,
        nrgiCommoditiesSrvc
    ) {
        $scope.limit = 50;
        $scope.page = 0;
        $scope.count =0;
        $scope.show_count=0;
        var loadCommodities = function(limit,page){
            nrgiCommoditiesSrvc.query({skip: page, limit: limit,record_type:$scope.record_type}, function (response) {
                $scope.count = response.count;
                $scope.limit = limit;
                $scope.page = page;
                $scope.commodities=response.data;
                $scope.show_count = response.data.length+$scope.page;
                console.log($scope.commodities[0]);
            });
        };
        loadCommodities($scope.limit,$scope.page);
        $scope.select = function(changeLimit){
            loadCommodities(changeLimit,0);
        };
        $scope.next = function(page,count){
            loadCommodities($scope.limit,count);
        };
        $scope.prev = function(page){
            loadCommodities($scope.limit,page-$scope.limit);
        };
        $scope.first = function(){
            loadCommodities($scope.limit,0);
        };
        $scope.last = function(page){
            if($scope.count%$scope.limit!=0){
                page =  parseInt($scope.count/$scope.limit)*$scope.limit;
                loadCommodities($scope.limit,page);
            }else {
                loadCommodities($scope.limit,page-$scope.limit);
            }
        };
    });

