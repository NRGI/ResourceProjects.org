'use strict';

angular.module('app')
    .controller('nrgiProjectListCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiProjectsSrvc
    ) {
        $scope.limit = 50;
        $scope.page = 0;
        $scope.count =0;
        $scope.show_count=0;

        var loadProjects = function(limit,page){
            nrgiProjectsSrvc.query({skip: page, limit: limit}, function (success) {
                $scope.count = success.count;
                $scope.limit = limit;
                $scope.page = page;
                $scope.projects=success.data;
                $scope.show_count = success.data.length+$scope.page;
                $scope.record_type = 'projects';
            });
        };

        loadProjects($scope.limit,$scope.page);

        $scope.select = function(changeLimit){
            loadProjects(changeLimit,0);
        };
        $scope.next = function(page,count){
            loadProjects($scope.limit,count);
        };
        $scope.prev = function(page){
            loadProjects($scope.limit,page-$scope.limit);
        };
        $scope.first = function(){
            loadProjects($scope.limit,0);
        };
        $scope.last = function(page){
            if($scope.count%$scope.limit!=0){
                page =  parseInt($scope.count/$scope.limit)*$scope.limit;
                loadProjects($scope.limit,page);
            }else {
                loadProjects($scope.limit,page-$scope.limit);
            }
        }
    });

