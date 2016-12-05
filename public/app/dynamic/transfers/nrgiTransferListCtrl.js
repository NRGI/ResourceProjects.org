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

        var currentPage = 0, totalPages = 0, searchOptions = {}, headerTransfer = [], fields = [], countryName = '', companyName = '', transferValue = '';
        $scope.limit = 500;
        $scope.skip = currentPage * $scope.limit;
        $scope.count =0;
        $scope.busy = false; $scope.new =true;
        $scope.transfers=[];
        $scope.currency = '';
        $scope.year = '';
        $scope.type_filter='Show all types'; $scope.company_filter='Show all companies';

        $scope.load = function(searchOptions) {
            searchOptions.skip = $scope.skip;
            nrgiTransfersSrvc.query(searchOptions, function (response) {
                $scope.count = response.count;
                if($scope.new){ $scope.transfers = response.data; }else { $scope.transfers = _.union($scope.transfers, response.data);}
                $scope.transfer_count = response.data.length;
                totalPages = Math.ceil(response.count / $scope.limit);
                currentPage = currentPage + 1;
                $scope.skip = currentPage * $scope.limit ;
                $scope.busy = false;
                });
        }
        nrgiTransferFilters.query({country:false}, function (response) {
            if(response.filters) {
                $scope.year_selector = response.filters.year_selector;
                $scope.currency_selector = response.filters.currency_selector;
                $scope.type_selector = response.filters.type_selector;
                $scope.company_selector = response.filters.company_selector;
                if (_.has($scope.currency_selector, "USD")) {
                    $scope.currency_filter = 'USD';
                } else if (Object.keys($scope.currency_selector)[0]) {
                    $scope.currency_filter = Object.keys($scope.currency_selector)[0];
                }
                if (_.has($scope.year_selector, "2015")) {
                    $scope.year_filter = '2015';
                } else if (Object.keys($scope.year_selector)[0]) {
                    $scope.year_filter = Object.keys($scope.year_selector)[0];
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
            }
            $scope.load(searchOptions);
        })

        $scope.$watch('year_filter', function(year) {
            $scope.year = year;
            $scope.new =true;
            if(year && year!=searchOptions.transfer_year) {
                $scope.skip=0;
                searchOptions.skip=0;
                searchOptions.limit= 500;currentPage = 0;
                searchOptions.transfer_year = year;
                if($scope.currency) {
                    searchOptions.transfer_unit = $scope.currency;
                }
                $scope.load(searchOptions);
            }
            if($scope.year=='' && $scope.currency){
                $scope.skip=0;
                searchOptions = {skip:0, limit:500, transfer_unit:searchOptions.transfer_unit }
                $scope.load(searchOptions);
            } else if($scope.year=='' && $scope.currency==''){
                $scope.skip=0;
                searchOptions = {skip:0, limit:500}
                $scope.load(searchOptions);
            }
        });
        $scope.$watch('currency_filter', function(currency) {
            $scope.currency = currency;
            $scope.new =true;
            if(currency && currency!=searchOptions.transfer_unit) {
                searchOptions.transfer_unit = currency;
                $scope.skip=0;
                currentPage = 0;
                if($scope.year) {
                    searchOptions.transfer_year = $scope.year;
                }
                $scope.load(searchOptions);
            }
            if($scope.currency=='' && $scope.year){
                $scope.skip=0;
                searchOptions = {skip:0, limit:500, transfer_year:searchOptions.transfer_year }
                $scope.load(searchOptions);
            } else if($scope.year=='' && $scope.currency==''){
                $scope.skip=0;
                searchOptions = {skip: 0, limit: 500};
                $scope.load(searchOptions);
            }
        });
        $scope.$watch('type_filter', function(type) {
            $scope.type = type;
            if(type && type!='Show all types') {
                $scope.skip=0;
                searchOptions.transfer_type = type;
                $scope.load(searchOptions);
            }else if(searchOptions.transfer_type&&type=='Show all types'){
                $scope.skip=0;
                delete searchOptions.transfer_type;
                $scope.load(searchOptions);
            }
        });
        $scope.$watch('company_filter', function(company) {
            $scope.company = company;
            if(company&&company!='Show all companies') {
                $scope.skip=0;
                searchOptions.company = company;
                $scope.load(searchOptions);
            }else if(searchOptions.company&&company=='Show all companies'){
                $scope.skip=0;
                delete searchOptions.company;
                $scope.load(searchOptions);
            }
        });
        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                $scope.new = false;
                $scope.load(searchOptions);
            }
        };

        var headers = [
            {name: 'Year', status: true, field: 'transfer_year'},
            {name: 'Paid by', status: true, field: 'company'},
            {name: 'Paid to', status: true, field: 'country'},
            {name: 'Project', status: true, field: 'proj_site'},
            {name: 'Project ID', status: true, field: 'proj_id'},
            {name: 'Level ', status: true, field: 'transfer_gov_entity'},
            {name: 'Payment Type', status: true, field: 'transfer_type'},
            {name: 'Currency', status: true, field: 'transfer_unit'},
            {name: 'Value ', status: true, field: 'transferValue'}];
        angular.forEach(headers, function (header) {
            if (header.status != false && header.status != undefined) {
                headerTransfer.push(header.name);
                fields.push(header.field);
            }
        });
        $scope.getHeaderTransfers = function () {
            return headerTransfer
        };

        $scope.load_all = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            nrgiTransfersSrvc.query({skip: 0, limit: $scope.count}, function (response) {
                $scope.csv_transfers = [];
                angular.forEach(response.data, function (transfer, key) {
                    $scope.csv_transfers[key] = [];
                    angular.forEach(fields, function (field) {
                        if (field == 'transferValue') {
                            transferValue = '';
                            transferValue = $filter('currency')(transfer[field], '', 0)
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
                            if (transfer[field] != undefined && transfer[field].companyName) {
                                companyName = transfer[field].companyName.toString();
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
                        if (field != 'company' && field != 'transfer_gov_entity' && field != 'country' && field != 'proj_site' && field != 'proj_id' && field != 'transferValue') {
                            $scope.csv_transfers[key].push(transfer[field])
                        }
                    })
                });
            });
        }
    });
