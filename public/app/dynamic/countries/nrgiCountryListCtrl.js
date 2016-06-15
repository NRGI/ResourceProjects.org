'use strict';

angular.module('app')
    .controller('nrgiCountryListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        $sce,
        nrgiCountriesSrvc
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.busy = false;

        $scope.csv_countries = [];
        var fields = ['name', 'project_count', 'site_count', 'field_count', 'concession_count', 'transfer_count'];
        var header_countries = ['Country', 'Projects', 'Sites', 'Fields', 'Concessions', 'Payments'];
        $scope.getHeaderCountries = function () {
            return header_countries
        };

        $scope.createDownloadList = function (countries) {
            angular.forEach(countries, function (country, key) {
                $scope.csv_countries[key] = [];
                angular.forEach(fields, function (field) {
                    $scope.csv_countries[key].push(country[field])
                })
            });
        };

        nrgiCountriesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.countries = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
            $scope.createDownloadList($scope.countries);
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiCountriesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
                    $scope.countries = _.union($scope.countries, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                    $scope.createDownloadList($scope.countries);
                });
            }
        };

    });


//    var loadCountries = function(limit,page){
    //        nrgiCountriesSrvc.query({skip: page, limit: limit}, function(success) {
    //            $scope.count = success.count;
    //            $scope.limit = limit;
    //            $scope.page = page;
    //            $scope.countries = success.data;
    //            $scope.show_count = success.data.length+$scope.page;
    //            $scope.record_type = 'countries';
    //        });
    //    };
    //
    //    loadCountries($scope.limit,$scope.page);
    //    $scope.select = function(changeLimit){
    //        loadCountries(changeLimit,0);
    //    };
    //    $scope.next = function(page,count){
    //        loadCountries($scope.limit,count);
    //    };
    //    $scope.prev = function(page){
    //        loadCountries($scope.limit,page-$scope.limit);
    //    };
    //    $scope.first = function(){
    //        loadCountries($scope.limit,0);
    //    };
    //    $scope.last = function(page){
    //        if($scope.count%$scope.limit!=0){
    //            page =  parseInt($scope.count/$scope.limit)*$scope.limit;
    //            loadCountries($scope.limit,page);
    //        }else {
    //            loadCountries($scope.limit,page-$scope.limit);
    //        }
    //    }
    //});
    //
    //
    //
