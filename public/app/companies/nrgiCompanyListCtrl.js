'use strict';

angular.module('app')
    .controller('nrgiCompanyListCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiCompaniesSrvc
    ) {
        $scope.limit = 50;
        $scope.page = 0;
        $scope.count =0;
        $scope.show_count=0;
        $scope.record_type = 'companies';
        var loadCompanies = function(limit,page){
            nrgiCompaniesSrvc.query({skip: page, limit: limit,record_type:$scope.record_type}, function (success) {
                $scope.count = success.count;
                $scope.limit = limit;
                $scope.page = page;
                $scope.companies=success.data;
                $scope.show_count = success.data.length+$scope.page;
                $scope.record_type = 'companies';
            });
        };

        loadCompanies($scope.limit,$scope.page);

        $scope.select = function(changeLimit){
            loadCompanies(changeLimit,0);
        };

        $scope.next = function(page,count){
            loadCompanies($scope.limit,count);
        };

        $scope.prev = function(page){
            loadCompanies($scope.limit,page-$scope.limit);
        };

        $scope.first = function(){
            loadCompanies($scope.limit,0);
        };

        $scope.last = function(page){
            if($scope.count%$scope.limit!=0){
                page =  parseInt($scope.count/$scope.limit)*$scope.limit;
                loadCompanies($scope.limit,page);
            }else {
                loadCompanies($scope.limit,page-$scope.limit);
            }
        }
    });

