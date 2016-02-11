'use strict';

angular.module('app')
    .controller('nrgiSourcesCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiSourcesSrvc
    ) {
        $scope.limit = 50;$scope.page = 0;$scope.count =0;
        $scope.show_count=0;
        $scope.controller='nrgiSourcesCtrl';
        var loadSources = function(limit,page){
            nrgiSourcesSrvc.query({skip: page, limit: limit}, function (response) {
                $scope.count = response.count;
                $scope.limit = limit;
                $scope.page = page;
                $scope.sources=response.data;
                $scope.show_count = response.data.length+$scope.page;
            });
        };
        loadSources($scope.limit,$scope.page);
        $scope.select = function(changeLimit){
            loadSources(changeLimit,0);
        };
        $scope.next = function(page,count){
            loadSources($scope.limit,count);
        };
        $scope.prev = function(page){
            loadSources($scope.limit,page-$scope.limit);
        };
        $scope.first = function(){
            loadSources($scope.limit,0);
        };
        $scope.last = function(page){
            if($scope.count%$scope.limit!=0){
                page =  parseInt($scope.count/$scope.limit)*$scope.limit;
                loadSources($scope.limit,page);
            }else {
                loadSources($scope.limit,page-$scope.limit);
            }
        }
    });

