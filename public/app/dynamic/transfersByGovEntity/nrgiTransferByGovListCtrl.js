'use strict';

angular.module('app')
    .controller('nrgiTransferByGovListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiTransfersByGovSrvc,
        nrgiTransferFilters,
        $filter
    ) {

        var currentPage = 0,
            totalPages = 0,
            searchOptions = {},
            header_transfer = [],
            fields = [],
            country_name = '',
            transfer_value = '',
            company_name = '';

        var headers = [
            {name: 'Year', status: true, field: 'transfer_year'},
            {name: 'Company', status: true, field: 'company'},
            {name: 'Country', status: true, field: 'country'},
            {name: 'Government entity', status: true, field: 'transfer_gov_entity'},
            {name: 'Level ', status: true, field: 'transfer_level'},
            {name: 'Payment Type', status: true, field: 'transfer_type'},
            {name: 'Currency', status: true, field: 'transfer_unit'},
            {name: 'Value ', status: true, field: 'transfer_value'}];

        $scope.limit = 500;
        $scope.skip = currentPage * $scope.limit;
        $scope.new =true;
        $scope.count =0;
        $scope.busy = false;
        $scope.transfers = [];
        $scope.currency = '';
        $scope.year = '';
        $scope.type_filter='Show all types';
        $scope.company_filter='Show all companies';
        $scope.country_filter='Show all countries';
        $scope.csv_transfers = [];

        nrgiTransferFilters.query({country:true}, function (response) {
            if(Object.keys(response.filters).length>0) {
                $scope.year_selector = response.filters.year_selector;
                $scope.currency_selector = response.filters.currency_selector;
                $scope.type_selector = response.filters.type_selector;
                $scope.company_selector = response.filters.company_selector;
                $scope.country_selector = response.filters.country_selector;
                if (_.indexOf($scope.currency_selector, "USD")) {
                    $scope.currency_filter = 'USD';
                } else if ($scope.currency_selector && $scope.currency_selector[0]) {
                    $scope.currency_filter = $scope.currency_selector[0];
                }
                if (_.indexOf($scope.year_selector, "2015")) {
                    $scope.year_filter = '2015';
                } else if ($scope.year_selector && $scope.year_selector[0]) {
                    $scope.year_filter = $scope.year_selector[0];
                }
                searchOptions = {
                    skip: $scope.skip,
                    limit: $scope.limit,
                    transfer_year: $scope.year_filter,
                    transfer_unit: $scope.currency_filter
                };
            } else{
                searchOptions = {
                    skip: $scope.skip,
                    limit: $scope.limit
                };
                $scope.currency_filter = 'Show all currency';
                $scope.year_filter = 'Show all years';
            }
            $scope.load(searchOptions);
        });

        angular.forEach(headers, function (header) {
            if (header.status != false && header.status != undefined) {
                header_transfer.push(header.name);
                fields.push(header.field);
            }
        });

        $scope.$watch('year_filter', function(year) {
            $scope.year = year;
            $scope.new =true;
            if(searchOptions.transfer_year!=year && year && year!='Show all years') {
                $scope.skip=0;
                searchOptions.skip=0;
                searchOptions.limit= 500;
                currentPage = 0;
                searchOptions.transfer_year = year;
                $scope.load(searchOptions);
            }else if(searchOptions.transfer_year&&year=='Show all years'){
                $scope.skip=0;
                searchOptions.skip=0;
                searchOptions.limit= 500;
                currentPage = 0;
                delete searchOptions.transfer_year;
                $scope.load(searchOptions);
            }
        });

        $scope.$watch('currency_filter', function(currency) {
            $scope.currency = currency;
            $scope.new =true;
            if(searchOptions.transfer_unit!=currency && currency && currency!='Show all currency') {
                $scope.skip=0;
                searchOptions.skip=0;
                searchOptions.limit= 500;
                currentPage = 0;
                searchOptions.transfer_unit = currency;
                $scope.load(searchOptions);
            }else if(searchOptions.transfer_unit&&currency=='Show all currency'){
                $scope.skip=0;
                searchOptions.skip=0;
                searchOptions.limit= 500;
                currentPage = 0;
                delete searchOptions.transfer_unit;
                $scope.load(searchOptions);
            }
        });

        $scope.$watch('type_filter', function(type) {
            $scope.type = type;
            if(type && type!='Show all types') {
                $scope.skip=0;
                searchOptions.skip=0;
                searchOptions.limit= 500;
                currentPage = 0;
                searchOptions.transfer_type = type;
                $scope.load(searchOptions);
            }else if(searchOptions.transfer_type&&type=='Show all types'){
                $scope.skip=0;
                searchOptions.skip=0;
                searchOptions.limit= 500;
                currentPage = 0;
                delete searchOptions.transfer_type;
                $scope.load(searchOptions);
            }
        });

        $scope.$watch('company_filter', function(company) {
            $scope.company = company;
            if(company&&company!='Show all companies') {
                $scope.skip=0;
                searchOptions.skip=0;
                searchOptions.limit= 500;
                currentPage = 0;
                searchOptions.company = company;
                $scope.load(searchOptions);
            }else if(searchOptions.company&&company=='Show all companies'){
                $scope.skip=0;
                searchOptions.skip=0;
                searchOptions.limit= 500;
                currentPage = 0;
                delete searchOptions.company;
                $scope.load(searchOptions);
            }
        });

        $scope.$watch('country_filter', function(country) {
            $scope.country = country;
            if(country&&country!='Show all countries') {
                $scope.skip=0;
                searchOptions.skip=0;
                searchOptions.limit= 500;
                currentPage = 0;
                searchOptions.country = country;
                $scope.load(searchOptions);
            }else if(searchOptions.country&&country=='Show all countries'){
                $scope.skip=0;
                searchOptions.skip=0;
                searchOptions.limit= 500;
                currentPage = 0;
                delete searchOptions.country;
                $scope.load(searchOptions);
            }
        });

        $scope.getAllTransfers = function () {
            if ($scope.count < $scope.limit || $scope.transfers.length === $scope.count) {
                $scope.createDownloadList($scope.transfers);
                setTimeout(function () {angular.element(document.getElementById("loadTransfersCSV")).trigger('click');},0)
            } else {
                searchOptions.limit = $scope.count;
                nrgiTransfersByGovSrvc.query(searchOptions, function (response) {
                    $scope.transfers = response.transfers;
                    $scope.createDownloadList($scope.transfers);
                    setTimeout(function () {angular.element(document.getElementById("loadTransfersCSV")).trigger('click');},0)
                });
            }
        };

        $scope.createDownloadList = function (transfers) {
            $scope.csv_transfers = [];
            angular.forEach(transfers, function (transfer, key) {
                $scope.csv_transfers[key] = [];
                angular.forEach(fields, function (field) {
                    if(field =='transfer_value'){
                        transfer_value='';
                        transfer_value = $filter('currency')(transfer[field], '', 0)
                        $scope.csv_transfers[key].push(transfer_value);
                    }
                    if (field == 'country') {
                        country_name = '';
                        if (transfer[field] != undefined && transfer[field].name) {
                            country_name = transfer[field].name.toString();
                            country_name = country_name.charAt(0).toUpperCase() + country_name.substr(1);
                        }
                        $scope.csv_transfers[key].push(country_name);
                    }
                    if (field == 'company') {
                        company_name = '';
                        if (transfer[field] != undefined && transfer[field].company_name) {
                            company_name = transfer[field].company_name.toString();
                            company_name = company_name.charAt(0).toUpperCase() + company_name.substr(1);
                        }
                        $scope.csv_transfers[key].push(company_name);
                    }
                    if (field != 'company' && field != 'country' && field != 'transfer_value') {
                        $scope.csv_transfers[key].push(transfer[field])
                    }
                });
            });
        };

        $scope.getHeaderTransfers = function () {
            return header_transfer
        };

        $scope.loadMore = function() {
            if ($scope.busy || $scope.transfers.length === $scope.count) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                $scope.new =false;
                $scope.load(searchOptions);
            }
        };

        $scope.load = function(searchOptions) {
            searchOptions.skip = $scope.skip;
            nrgiTransfersByGovSrvc.query(searchOptions, function (response) {
                if(response.transfers) {
                    $scope.count = response.count;
                    if ($scope.new) {
                        $scope.transfers = response.transfers;
                    } else {
                        $scope.transfers = _.union($scope.transfers, response.transfers);
                    }
                    $scope.transfer_count = response.transfers.length;
                    totalPages = Math.ceil(response.count / $scope.limit);
                    currentPage = currentPage + 1;
                    $scope.skip = currentPage * $scope.limit;
                    $scope.busy = false;
                }else{
                    $scope.transfers =[];
                }
            });
        };
    });
