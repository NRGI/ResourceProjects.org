'use strict';

angular.module('app')
    .controller('nrgiCompaniesCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiCompaniesSrvc
    ) {
        $scope.limit = 50;$scope.page = 0;$scope.count =0;$scope.show_count=0;
        var loadCompanies = function(limit,page){
            nrgiCompaniesSrvc.getAllCompanies(limit,page).then(function(success) {
                $scope.count = success.count;
                $scope.limit = limit;
                $scope.page = page;
                $scope.companies=success.data;
                $scope.show_count = success.data.length+$scope.page;
            });
        };
        loadCompanies($scope.limit,$scope.page);
        $scope.select = function(changeLimit){
            $scope.page = 0;
            loadCompanies(changeLimit,$scope.page);
        };
        $scope.next = function(page,count){
            loadCompanies($scope.limit,count);
        };
        $scope.prev = function(page){
            loadCompanies($scope.limit,page-$scope.limit);
        }
    });

