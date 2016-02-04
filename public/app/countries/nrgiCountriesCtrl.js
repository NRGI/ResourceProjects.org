'use strict';

angular.module('app')
    .controller('nrgiCountriesCtrl', function (
        $scope,
        ISO3166,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        $sce,
        nrgiCountriesSrvc
    ) {
        $scope.limit = 50;$scope.page = 0;$scope.count =0;$scope.show_count=0;
        var loadCountries = function(limit,page){
            nrgiCountriesSrvc.getAllCountries(limit,page).then(function(response) {
                $scope.count = response.count;
                $scope.limit = limit;
                $scope.page = page;
                $scope.countries=response.data;
                $scope.show_count = response.data.length+$scope.page;
            });
        };
        loadCountries($scope.limit,$scope.page);
        $scope.select = function(changeLimit){
            loadCountries(changeLimit,0);
        };
        $scope.next = function(page,count){
            loadCountries($scope.limit,count);
        };
        $scope.prev = function(page){
            loadCountries($scope.limit,page-$scope.limit);
        };
        $scope.first = function(){
            loadCountries($scope.limit,0);
        };
        $scope.last = function(page){
            if($scope.count%$scope.limit!=0){
                page =  parseInt($scope.count/$scope.limit)*$scope.limit;
                loadCountries($scope.limit,page);
            }else {
                loadCountries($scope.limit,page-$scope.limit);
            }
        }
    });
