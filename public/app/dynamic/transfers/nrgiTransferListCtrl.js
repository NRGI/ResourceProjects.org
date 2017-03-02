'use strict';

angular.module('app')
    .controller('nrgiTransferListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiTransfersSrvc,
        nrgiTransferFilters,
        $filter
    ) {

        var currentPage = 0,
            totalPages = 0,
            searchOptions = {},
            headerTransfer = [],
            fields = [],
            countryName = '',
            companyName = '',
            transferValue = '';

        var headers = [
            {name: 'Year', status: true, field: 'transfer_year'},
            {name: 'Company', status: true, field: 'company'},
            {name: 'Country', status: true, field: 'country'},
            {name: 'Project', status: true, field: 'proj_site'},
            {name: 'Project ID', status: true, field: 'proj_id'},
            {name: 'Level ', status: true, field: 'transfer_gov_entity'},
            {name: 'Payment Type', status: true, field: 'transfer_type'},
            {name: 'Currency', status: true, field: 'transfer_unit'},
            {name: 'Value ', status: true, field: 'transfer_value'}];

        $scope.limit = 500;
        $scope.skip = currentPage * $scope.limit;
        $scope.count =0;
        $scope.busy = false;
        $scope.new = true;
        $scope.transfers = [];
        $scope.currency = '';
        $scope.year = '';
        $scope.type_filter='Show all types';
        $scope.company_filter='Show all companies';
        $scope.country_filter='Show all countries';
        $scope.csv_transfers = [];

        nrgiTransferFilters.query({country:false}, function (response) {
            if(response.filters && Object.keys(response.filters).length>0) {
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
                $scope.currency_filter = 'Show all currency';
                $scope.year_filter = 'Show all years';
                searchOptions = {
                    skip: $scope.skip,
                    limit: $scope.limit
                };
            }

            $scope.load(searchOptions);
        });

        angular.forEach(headers, function (header) {
            if (header.status != false && header.status != undefined) {
                headerTransfer.push(header.name);
                fields.push(header.field);
            }
        });

        $scope.$watch('year_filter', function(year) {
            $scope.year = year;
            $scope.new =true;
            if(searchOptions.transfer_year!=year && year&&year!='Show all years') {
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
            if(searchOptions.transfer_unit!=currency && currency&&currency!='Show all currency') {
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
                nrgiTransfersSrvc.query(searchOptions, function (response) {
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
                    if (field == 'transfer_value') {
                        transferValue = '';
                        transferValue = $filter('currency')(transfer[field], '', 0);
                        $scope.csv_transfers[key].push(transferValue);
                    }
                    if (field == 'country') {
                        countryName = '';
                        if (transfer[field] != undefined && transfer[field].name) {
                            countryName = transfer[field].name.toString();
                            countryName = countryName.charAt(0).toUpperCase() + countryName.substr(1);
                        }
                        $scope.csv_transfers[key].push(countryName);
                    }
                    if (field == 'company') {
                        companyName = '';
                        if (transfer[field] != undefined && transfer[field].company_name) {
                            companyName = transfer[field].company_name.toString();
                            companyName = companyName.charAt(0).toUpperCase() + companyName.substr(1);
                        }
                        $scope.csv_transfers[key].push(companyName);
                    }
                    if (field == 'transfer_gov_entity') {
                        if (transfer[field]) {
                            name = transfer[field];
                        }
                        if (!transfer[field]) {
                            if (transfer.proj_site != undefined) {
                                name = transfer.proj_site.type;
                            } else {
                                name = '';
                            }
                        }
                        $scope.csv_transfers[key].push(name)
                    }
                    if (field == 'proj_site') {
                        name = '';
                        if (transfer[field] != undefined && transfer[field].name != undefined) {
                            var name = transfer[field].name.toString();
                        }
                        $scope.csv_transfers[key].push(name)
                    }
                    if (field == 'proj_id') {
                        id = '';
                        if (transfer.proj_site != undefined && transfer.proj_site._id != undefined && transfer.proj_site.type == 'project') {
                            var id = transfer.proj_site._id.toString();
                        }
                        $scope.csv_transfers[key].push(id);
                    }
                    if (field != 'company' && field != 'transfer_gov_entity' && field != 'country' && field != 'proj_site' && field != 'proj_id' && field != 'transfer_value') {
                        $scope.csv_transfers[key].push(transfer[field])
                    }
                })
            });
        };

        $scope.getHeaderTransfers = function () {
            return headerTransfer
        };

        $scope.loadMore = function() {
            if ($scope.busy || $scope.transfers.length === $scope.count) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                $scope.new = false;
                $scope.load(searchOptions);
            }
        };

        $scope.load = function(searchOptions) {
            searchOptions.skip = $scope.skip;
            nrgiTransfersSrvc.query(searchOptions, function (response) {
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
                    $scope.transfers = [];
                }
            });
        };
    });
