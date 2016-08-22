'use strict';

angular.module('app')
    .controller('nrgiTransferListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiTransfersSrvc
    ) {
        var limit = 3000,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.busy = false;
        $scope.transfers=[];
        var header_transfer = [];
        var fields = [];
        var country_name = '';
        var company_name = '';
        nrgiTransfersSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            var companies = [],
                countries = [];
            $scope.count = response.count;
            $scope.transfers = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
            $scope.year_selector = _.countBy(response.data, "transfer_year");
            _.each(response.data, function(transfer) {
                companies.push(transfer.company);
                countries.push(transfer.country);
            });
            $scope.company_selector = _.countBy(companies, "company_name");
            $scope.country_selector = _.countBy(countries, "name");
        });

        $scope.$watch('year_filter', function(year) {
            currentPage = 0;
            totalPages = 0;
            var searchOptions = {skip: currentPage, limit: limit};

            if(year) {
                searchOptions.transfer_year = year;

                nrgiTransfersSrvc.query(searchOptions, function (response) {
                    if (response.reason) {
                        rgiNotifier.error('Load document data failure');
                    } else {
                        $scope.count = response.count;
                        $scope.transfers = response.data;
                        totalPages = Math.ceil(response.count / limit);
                        currentPage = currentPage + 1;
                    }
                });
            }
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiPaymentsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
                    $scope.transfers = _.union($scope.transfers, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                });
            }
        };

        var headers = [
            {name: 'Year', status: true, field: 'transfer_year'},
            {name: 'Paid by', status: true, field: 'company'},
            {name: 'Paid to', status: true, field: 'country'},
            {name: 'Payment Type', status: true, field: 'transfer_type'},
            {name: 'Currency', status: true, field: 'transfer_unit'},
            {name: 'Value ', status: true, field: 'transfer_value'},
            {name: 'Level ', status: true, field: 'proj_type'},
            {name: 'Project', status: true, field: 'proj_site'},
            {name: 'Project ID', status: true, field: 'proj_id'}];
        angular.forEach(headers, function (header) {
            if (header.status != false && header.status != undefined) {
                header_transfer.push(header.name);
                fields.push(header.field);
            }
        });
        $scope.getHeaderTransfers = function () {
            return header_transfer
        };

        $scope.load_all = function(){
            if ($scope.busy) return;
            $scope.busy = true;
           nrgiTransfersSrvc.query({skip: 0, limit: 0}, function (response) {
                $scope.csv_transfers = [];
                angular.forEach(response.data, function (transfer, key) {
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
                        if (field == 'proj_site') {
                            name = '';
                            if (transfer[field] != undefined && transfer[field].name != undefined) {
                                var name = transfer[field].name.toString();
                            }
                            $scope.csv_transfers[key].push(name)
                        }
                        if (field == 'proj_type') {
                            type = '';
                            if (transfer.proj_site != undefined && transfer.proj_site.type != undefined) {
                                var type = transfer.proj_site.type.toString();
                            }
                            $scope.csv_transfers[key].push(type)
                        }
                        if (field == 'proj_id') {
                            id = '';
                            if (transfer.proj_site != undefined && transfer.proj_site._id != undefined && transfer.proj_site.type == 'project') {
                               var id = transfer.proj_site._id.toString();
                            }
                            $scope.csv_transfers[key].push(id);
                        }
                        if (field != 'company' && field != 'country' && field != 'proj_site' && field != 'proj_type' && field != 'proj_id') {
                            $scope.csv_transfers[key].push(transfer[field])
                        }
                    })
                });
            });
        }

    });
