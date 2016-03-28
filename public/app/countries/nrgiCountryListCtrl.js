'use strict';

angular.module('app')
    .controller('nrgiCountryListCtrl', function (
        $scope,
        ISO3166,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        $sce,
        nrgiCountriesSrvc
    ) {
        $scope.limit = 300;
        $scope.page = 0;
        $scope.count =0;
        $scope.show_count=0;
        var loadCountries = function(limit,page){
            nrgiCountriesSrvc.query({skip: page, limit: limit}, function(success) {
                $scope.count = success.count;
                $scope.limit = limit;
                $scope.page = page;
                $scope.countries = success.data;
                $scope.show_count = success.data.length+$scope.page;
                $scope.record_type = 'countries';
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
