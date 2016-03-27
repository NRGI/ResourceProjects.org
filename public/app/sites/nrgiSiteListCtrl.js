'use strict';

angular.module('app')
    .controller('nrgiSiteListCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiSitesSrvc,
        $location
    ) {
        $scope.field = false;
        $scope.limit = 50;
        $scope.page = 0;
        $scope.count =0;
        $scope.show_count=0;
        if ($location.path()=='/sites') {
            $scope.field =false;
            $scope.record_type = 'sites';
            $scope.route = 'site';
            $scope.header = 'Sites';
        } else if ($location.path()=='/fields') {
            $scope.field =true;
            $scope.route = 'field';
            $scope.record_type = 'fields';
            $scope.header = 'Fields';
        }
        var loadSites = function(limit,page){
            nrgiSitesSrvc.query({skip: page, limit: limit,field: $scope.field}, function (success) {
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