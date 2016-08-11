'use strict';

angular.module('app')
    .controller('nrgiTransferListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiTransfersSrvc
    ) {
        var limit = 2000,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.busy = false;

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
                    $scope.projects = _.union($scope.projects, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                });
            }
        };
    });
