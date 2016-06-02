'use strict';

angular.module('app')
    .controller('nrgiCompanyListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiCompaniesSrvc
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0;
            //_ = $rootScope._;

        $scope.count =0;
        $scope.busy = false;

        nrgiCompaniesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.companies = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiCompaniesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
                    $scope.companies = _.union($scope.companies, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                });
            }
        };
    });

