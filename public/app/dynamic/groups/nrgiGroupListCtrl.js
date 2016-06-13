'use strict';

angular.module('app')
    .controller('nrgiGroupListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiGroupsSrvc
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.busy = false;

        $scope.csv_groups = [];
        var fields = ['company_group_name', 'company_count', 'project_count'];
        var header_groups = ['Company Group', 'Companies', 'Projects'];
        $scope.getHeaderGroups = function () {
            return header_groups
        };

        nrgiGroupsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.groups = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
            $scope.createDownloadList($scope.groups);
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiGroupsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
                    $scope.groups = _.union($scope.groups, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                    $scope.createDownloadList($scope.groups);
                });
            }
        };
        $scope.createDownloadList = function (groups) {
            angular.forEach(groups, function (group, key) {
                $scope.csv_groups[key] = [];
                angular.forEach(fields, function (field) {
                    $scope.csv_groups[key].push(group[field])
                })
            });
        };
    });
