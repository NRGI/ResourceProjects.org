'use strict';

angular.module('app')
    .controller('nrgiPieChartCtrl', function (
        $scope,
        nrgiPieChartSrvc
    ) {

        $scope.currency_filter='USD'; $scope.year_filter='2015';
        var searchOptions = {transfer_unit: $scope.currency_filter,transfer_year: $scope.year_filter};

        $scope.load = function(searchOptions) {
            nrgiPieChartSrvc.query(searchOptions, function (response) {
                $scope.data=[];
                if (response.data) {
                    $scope.data = response.data[0].children;
                }
                $scope.year_selector = response.filters.year_selector;
                $scope.currency_selector = response.filters.currency_selector;

            });
        }
        $scope.load(searchOptions);
        $scope.options = {
            chart: {
                type: 'pieChart',
                height: 500,
                x: function(d){return d.key + ', ' + d.value;},
                y: function(d){return d.y;},
                showLabels: false,
                duration: 500,
                labelThreshold: 0.01,
                labelSunbeamLayout: true,
                showLegend:false
            }
        };

        $scope.$watch('year_filter', function(year) {
            $scope.year = year;
            if(year && year!=searchOptions.transfer_year) {
                searchOptions.transfer_year = year;
                if($scope.currency) {
                    searchOptions.transfer_unit = $scope.currency;
                }
                $scope.load(searchOptions);
            }
        });
        $scope.$watch('currency_filter', function(currency) {
            $scope.currency = currency;
            if(currency && currency!=searchOptions.transfer_unit) {
                searchOptions.transfer_unit = currency;
                if($scope.year) {
                    searchOptions.transfer_year = $scope.year;
                }
                $scope.load(searchOptions);
            }
        });
    });





