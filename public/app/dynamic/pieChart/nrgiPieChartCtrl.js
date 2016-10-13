'use strict';

angular.module('app')
    .controller('nrgiPieChartCtrl', function (
        $scope,
        nrgiPieChartSrvc,
        usSpinnerService
    ) {

        $scope.currency_filter='USD'; $scope.year_filter='2015';
        var searchOptions = {transfer_unit: $scope.currency_filter,transfer_year: $scope.year_filter};
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
                noData: '',
                showLegend:false,
                tooltip:{
                    valueFormatter:function (d, i) {
                        return d.toFixed(1) + '%';
                    },
                    keyFormatter: function(d,i){
                        return d + ' million ' + $scope.currency_filter
                    }
                }
            }
        };
        $scope.load = function(searchOptions) {
            usSpinnerService.spin('spinner-pie-chart');
            $scope.options.chart.noData = '';
            $scope.pie = [];
            nrgiPieChartSrvc.query(searchOptions, function (response) {
                $scope.total = 0;
                if (response.data) {
                    $scope.pie = response.data[0].children;
                    $scope.total = response.data[0].total_value;
                    $scope.options.chart.noData = 'No Data Available.';
                    usSpinnerService.stop('spinner-pie-chart');
                }else{
                    $scope.options.chart.noData = 'No Data Available.';
                    usSpinnerService.stop('spinner-pie-chart');
                }
                $scope.year_selector = response.filters.year_selector;
                $scope.currency_selector = response.filters.currency_selector;
            });
        }

        $scope.load(searchOptions);

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
        $scope.$watch('pie', function(pie) {
            if($scope.api!=undefined) {
                $scope.api.refresh();
            }else { }
        });
    });





