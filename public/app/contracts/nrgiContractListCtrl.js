'use strict';

angular.module('app')
    .controller('nrgiContractsCtrl', function (
        $scope,
        ISO3166,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        $sce,
        nrgiContractsSrvc
    ) {
        $scope.limit = 50;$scope.page = 0;$scope.count =0;$scope.show_count=0;
        var loadContracts = function(limit,page){
            nrgiContractsSrvc.getAllContracts(limit,page).then(function(response) {
                $scope.count = response.count;
                $scope.limit = limit;
                $scope.page = page;
                $scope.contracts=response.data;
                $scope.show_count = response.data.length+$scope.page;
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
