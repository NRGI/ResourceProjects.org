'use strict';
angular
    .module('app')
    .controller('nrgiSunburstByGovCtrl', function ($scope, nrgiPaymentsByGovSrvc,usSpinnerService) {
        $scope.sunburst=[];

        $scope.csv_transfers = [];
        var header_transfer = [];
        var fields = [];
        var country_name = '';
        var company_name = '';

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
                    },
                    keyFormatter: function (d, i) {
                        if ($scope.currency_filter && $scope.currency_filter != 'Show all currency') {
                            return d + ' ' + $scope.currency_filter
                        } else {
                            return d
                        }
                    }
                }
            }

        };
        ;

        var headers = [
            {name: 'Year', status: true, field: 'transfer_year'},
            {name: 'Paid by', status: true, field: 'company'},
            {name: 'Paid to', status: true, field: 'country'},
            {name: 'Gov entity', status: true, field: 'transfer_gov_entity'},
            {name: 'Level ', status: true, field: 'transfer_level'},
            {name: 'Payment Type', status: true, field: 'transfer_type'},
            {name: 'Currency', status: true, field: 'transfer_unit'},
            {name: 'Value ', status: true, field: 'transfer_value'}];
        angular.forEach(headers, function (header) {
            if (header.status != false && header.status != undefined) {
                header_transfer.push(header.name);
                fields.push(header.field);
            }
        });
        $scope.getHeaderTransfers = function () {
            return header_transfer
        };

        $scope.year_filter = '2015';
        $scope.currency_filter = 'USD';
        $scope.type_filter='Show all types'; $scope.company_filter='Show all companies';
        var searchOptions = {transfer_unit:'USD',transfer_year:'2015'};
        $scope.load = function(searchOptions) {
            usSpinnerService.spin('spinner-sunburst-by-gov');
            $scope.options.chart.noData = '';
            $scope.sunburst=[];
            nrgiPaymentsByGovSrvc.query(searchOptions,function (response) {
                $scope.total=0;
                if(response.data&&response.data[0].length>0 && response.data[0].children) {
                    $scope.sunburst = response.data;
                    $scope.total = response.data[0].total_value;
                    $scope.all_currency_value = response.total;
                    $scope.options.chart.noData = 'No Data Available.';
                    usSpinnerService.stop('spinner-sunburst-by-gov');
                    $scope.csv_transfers = [];
                    angular.forEach(response.transfers, function (transfer, key) {
                        $scope.csv_transfers[key] = [];
                        angular.forEach(fields, function (field) {
                            if (field == 'country') {
                                country_name = '';
                                if (transfer[field] != undefined) {
                                    country_name = transfer[field].name.toString();
                                    country_name = country_name.charAt(0).toUpperCase() + country_name.substr(1);
                                }
                                $scope.csv_transfers[key].push(country_name);
                            }
                            if (field == 'company') {
                                company_name = '';
                                if (transfer[field] != undefined) {
                                    company_name = transfer[field].company_name.toString();
                                    company_name = company_name.charAt(0).toUpperCase() + company_name.substr(1);
                                }
                                $scope.csv_transfers[key].push(company_name);
                            }
                            if (field != 'company' && field != 'country') {
                                $scope.csv_transfers[key].push(transfer[field])
                            }
                        })
                    });

                }else{
                    console.log('')
                    $scope.options.chart.noData = 'No Data Available.';
                    usSpinnerService.stop('spinner-sunburst-by-gov');
                }
                $scope.year_selector = response.filters.year_selector;
                $scope.currency_selector = response.filters.currency_selector;
                $scope.type_selector = response.filters.type_selector;
                $scope.company_selector = response.filters.company_selector;
            }, function(error) {
                usSpinnerService.stop('spinner-sunburst-by-gov');
            });
        }

        $scope.load(searchOptions);
        $scope.$watch('year_filter', function(year) {
            if(searchOptions.transfer_year!=year && year&&year!='Show all years') {
                searchOptions.transfer_year = year;
                $scope.load(searchOptions);
            }else if(searchOptions.transfer_year&&year=='Show all years'){
                delete searchOptions.transfer_year;
                $scope.load(searchOptions);
            }
        });
        $scope.$watch('currency_filter', function(currency) {
            if(searchOptions.transfer_unit!=currency && currency&&currency!='Show all currency') {
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
            }else { }
        });
    });
