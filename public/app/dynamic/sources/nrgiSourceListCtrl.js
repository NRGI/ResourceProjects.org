'use strict';

angular.module('app')
    .controller('nrgiSourceListCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiSourcesSrvc,
        $filter
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.field = false;
        $scope.busy = false;

        $scope.csv_sources = [];
        var fields = ['source_name', 'source_type', 'source_date', 'projects'];
        var header_projects = ['Source', 'Source type', 'Source date', 'No. Projects'];
        $scope.getHeaderSources = function () {
            return header_projects
        };

        $scope.createDownloadList = function (sources) {
            angular.forEach(sources, function (source, key) {
                $scope.csv_sources[key] = [];
                angular.forEach(fields, function (field) {
                    if (field == 'source_date') {
                        source[field] = $filter('date')(source[field],'yyyy-MM-dd');
                        $scope.csv_sources[key].push(source[field])
                    }
                    if (field != 'source_date') {
                        $scope.csv_sources[key].push(source[field])
                    }
                })
            });
        };

        nrgiSourcesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.sources = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
            $scope.createDownloadList($scope.sources);
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiSourcesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
                    $scope.sources = _.union($scope.sources, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                    $scope.createDownloadList($scope.sources);
                });
            }
        };
    });