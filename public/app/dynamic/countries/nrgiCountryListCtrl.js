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
        var limit = 300,
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
            ++currentPage;
            $scope.createDownloadList($scope.countries);
        });

        // $scope.loadMore = function() {
        //     if ($scope.busy) return;
        //     $scope.busy = true;
        //     if(currentPage < totalPages) {
        //         nrgiCountriesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
        //             $scope.countries = _.union($scope.countries, response.data);
        //             ++currentPage;
        //             $scope.busy = false;
        //             $scope.createDownloadList($scope.countries);
        //         });
        //     }
        // };

    });