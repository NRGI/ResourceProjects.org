'use strict';

angular.module('app')
    .controller('nrgiGroupListCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiGroupsSrvc
    ) {
        $scope.limit = 50;$scope.page = 0;$scope.count =0;$scope.show_count=0;
        var loadCompanyGroups = function(limit,page){
            nrgiGroupsSrvc.query({skip: page, limit: limit}, function (response) {
                $scope.count = response.count;$scope.limit = limit;$scope.page = page;
                $scope.groups=response.data;
                $scope.show_count = response.data.length+$scope.page;
            });
        };
        loadCompanyGroups($scope.limit,$scope.page);
        $scope.select = function(changeLimit){
            loadCompanyGroups(changeLimit,0);
        };
        $scope.next = function(page,count){
            loadCompanyGroups($scope.limit,count);
        };
        $scope.prev = function(page){
            loadCompanyGroups($scope.limit,page-$scope.limit);
        };
        $scope.first = function(){
            loadCompanyGroups($scope.limit,0);
        };
        $scope.last = function(page){
            if($scope.count%$scope.limit!=0){
                page =  parseInt($scope.count/$scope.limit)*$scope.limit;
                loadCompanyGroups($scope.limit,page);
            }else {
                loadCompanyGroups($scope.limit,page-$scope.limit);
            }
        }
    });
