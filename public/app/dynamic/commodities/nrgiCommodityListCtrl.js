'use strict';

angular.module('app')
    .controller('nrgiCommodityListCtrl', function (
        $scope,
        $rootScope,
        nrgiNotifier,
        nrgiCommoditiesSrvc
    ) {

        var fields = ['commodity_name', 'projects'];
        var header_commodities = ['Name', 'No. Projects'];
        var limit = 50,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.busy = false;
        $scope.csv_commodities = [];

        nrgiCommoditiesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.commodities = response.commodities;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
        });

        $scope.getAllCommodities = function () {
            if ($scope.count < 50 || $scope.commodities.length === $scope.count) {
                $scope.createDownloadList($scope.commodities);
                setTimeout(function () {angular.element(document.getElementById("loadCommoditiesCSV")).trigger('click');},0)
            } else {
                nrgiCommoditiesSrvc.query({skip: 0, limit: $scope.count}, function (response) {
                    $scope.commodities = response.commodities;
                    $scope.createDownloadList($scope.commodities);
                    setTimeout(function () {angular.element(document.getElementById("loadCommoditiesCSV")).trigger('click');},0)
                });
            }
        };

        $scope.createDownloadList = function (commodities) {
            angular.forEach(commodities, function (commodity, key) {
                $scope.csv_commodities[key] = [];
                angular.forEach(fields, function (field) {
                    $scope.csv_commodities[key].push(commodity[field])
                })
            });
        };

        $scope.getHeaderCommodities = function () {
            return header_commodities
        };

        $scope.loadMore = function() {
            if ($scope.busy || $scope.commodities.length === $scope.count) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiCommoditiesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
                    $scope.commodities = _.union($scope.commodities, response.commodities);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                });
            }
        };
    });

