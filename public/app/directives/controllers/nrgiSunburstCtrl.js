'use strict';
angular
    .module('app')
    .controller('nrgiSunburstCtrl', function ($scope, nrgiPaymentsSrvc, usSpinnerService) {
        $scope.sunburst=[];

        $scope.options = {
            chart: {
                type: 'sunburstChart',
                height: 450,
                color: d3.scale.category20c(),
                duration: 250,
                mode: 'size',
                noData: '',
                tooltip:{
                    valueFormatter:function (d, i) {
                        return '';
                    }
                }
            }

        };
        $scope.currency_filter='Show all currency'; $scope.year_filter='Show all years'; $scope.type_filter='Show all types'; $scope.company_filter='Show all companies';
        var searchOptions = {};
        $scope.load = function(searchOptions) {
            usSpinnerService.spin('spinner-sunburst');
            $scope.options.chart.noData = '';
            $scope.sunburst=[];
            nrgiPaymentsSrvc.query(searchOptions,function (response) {
                $scope.total=0;
                if(response.data) {
                    $scope.sunburst = response.data;
                    $scope.total = response.data[0].total_value;
                    $scope.all_currency_value = response.total;
                    $scope.options.chart.noData = 'No Data Available.';
                    usSpinnerService.stop('spinner-sunburst');

                }else{
                    $scope.options.chart.noData = 'No Data Available.';
                    usSpinnerService.stop('spinner-sunburst');
                }
                $scope.year_selector = response.filters.year_selector;
                $scope.currency_selector = response.filters.currency_selector;
                $scope.type_selector = response.filters.type_selector;
                $scope.company_selector = response.filters.company_selector;
            }, function(error) {

            });
        }

        $scope.load(searchOptions);
        $scope.$watch('year_filter', function(year) {
            if(year&&year!='Show all years') {
                searchOptions.transfer_year = year;
                $scope.load(searchOptions);
            }else if(searchOptions.transfer_year&&year=='Show all years'){
                delete searchOptions.transfer_year;
                $scope.load(searchOptions);
            }
        });
        $scope.$watch('currency_filter', function(currency) {
            if(currency&&currency!='Show all currency') {
                searchOptions.transfer_unit = currency;
                $scope.load(searchOptions);
            }else if(searchOptions.transfer_unit&&currency=='Show all currency'){
                delete searchOptions.transfer_unit;
                $scope.load(searchOptions);
            }
        });
        $scope.$watch('type_filter', function(type) {
            $scope.type = type;
            if(type&&type!='Show all types') {
                searchOptions.transfer_type = type;
                $scope.load(searchOptions);
            }else if(searchOptions.transfer_type&&type=='Show all types'){
                delete searchOptions.transfer_type;
                $scope.load(searchOptions);
            }
        });
        $scope.$watch('company_filter', function(company) {
            $scope.company = company;
            if(company&&company!='Show all companies') {
                searchOptions.company = company;
                $scope.load(searchOptions);
            }else if(searchOptions.company&&company=='Show all companies'){
                delete searchOptions.company;
                $scope.load(searchOptions);
            }
        });
        $scope.$watch('sunburst', function(sunburst) {
            if($scope.api!=undefined) {
                $scope.api.refresh();
                console.log($scope.api)
            }else { }
        });
    });
