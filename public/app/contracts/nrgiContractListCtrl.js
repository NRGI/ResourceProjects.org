'use strict';

angular.module('app')
    .controller('nrgiContractListCtrl', function (
        $scope,
        ISO3166,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        $sce,
        nrgiContractsSrvc
    ) {
        $scope.limit = 50;
        $scope.page = 0;
        $scope.count =0;
        $scope.show_count=0;

        var loadContracts = function(limit,page){
            nrgiContractsSrvc.query({skip: page, limit: limit}, function (success) {
                $scope.count = success.count;
                $scope.limit = limit;
                $scope.page = page;
                $scope.contracts = success.data;
                $scope.show_count = success.data.length+$scope.page;
                $scope.record_type = 'contracts';
            });
        };

        loadContracts($scope.limit,$scope.page);
        $scope.select = function(changeLimit){
            loadContracts(changeLimit,0);
        };
        $scope.next = function(page,count){
            loadContracts($scope.limit,count);
        };
        $scope.prev = function(page){
            loadContracts($scope.limit,page-$scope.limit);
        };
        $scope.first = function(){
            loadContracts($scope.limit,0);
        };
        $scope.last = function(page){
            if($scope.count%$scope.limit!=0){
                page = parseInt($scope.count/$scope.limit)*$scope.limit;
                loadContracts($scope.limit,page);
            }else {
                loadContracts($scope.limit,page-$scope.limit);
            }
        }
    });
