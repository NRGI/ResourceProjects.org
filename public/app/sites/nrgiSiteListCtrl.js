'use strict';

angular.module('app')
    .controller('nrgiSiteListCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiSitesSrvc
    ) {
        $scope.limit = 50;
        $scope.page = 0;
        $scope.count =0;
        $scope.show_count=0;

        var loadSites = function(limit,page){
            nrgiSitesSrvc.query({skip: page, limit: limit}, function (success) {
                $scope.count = success.count;
                $scope.limit = limit;
                $scope.page = page;
                $scope.sites=success.data;
                $scope.show_count = success.data.length+$scope.page;
            });
        };

        loadSites($scope.limit,$scope.page);

        $scope.select = function(changeLimit){
            loadSites(changeLimit,0);
        };
        $scope.next = function(page,count){
            loadSites($scope.limit,count);
        };
        $scope.prev = function(page){
            loadSites($scope.limit,page-$scope.limit);
        };
        $scope.first = function(){
            loadSites($scope.limit,0);
        };
        $scope.last = function(page){
            if($scope.count%$scope.limit!=0){
                page =  parseInt($scope.count/$scope.limit)*$scope.limit;
                loadSites($scope.limit,page);
            }else {
                loadSites($scope.limit,page-$scope.limit);
            }
        }
    });