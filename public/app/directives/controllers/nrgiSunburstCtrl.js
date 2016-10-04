'use strict';
angular
    .module('app')
    .controller('nrgiSunburstCtrl', function ($scope, nrgiPaymentsSrvc) {
        $scope.sunburst=[];

        $scope.options = {
            chart: {
                type: 'sunburstChart',
                height: 450,
                color: d3.scale.category20c(),
                duration: 250,
                mode: 'size',
                tooltip:{
                    valueFormatter:function (d, i) {
                        return '';
                    }
                }
            }

        };
        $scope.currency_filter='Show all currency'; $scope.year_filter='Show all years'; $scope.type_filter='Show all types';
        var searchOptions = {};
        $scope.load = function(searchOptions) {
            nrgiPaymentsSrvc.query(searchOptions,function (response) {
                $scope.sunburst=[];
                $scope.total=0;
                if(response.data) {
                    $scope.sunburst = response.data;
                    $scope.total = response.data[0].total_value;
                    $scope.all_currency_value = response.total;
                }
                $scope.year_selector = response.filters.year_selector;
                $scope.currency_selector = response.filters.currency_selector;
                $scope.type_selector = response.filters.type_selector;
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
    });
