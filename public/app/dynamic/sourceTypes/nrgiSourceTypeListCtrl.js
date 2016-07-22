'use strict';

angular.module('app')
    .controller('nrgiSourceTypeListCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiSourceTypesSrvc,
        $rootScope
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.field = false;
        $scope.busy = false;

        $scope.csv_source_types = [];
        var fields = ['source_type_name','source_type_authority','project_count'];
        var header_projects = ['Source','Type','Projects','Countries'];
        $scope.getHeaderSourceTypes = function () {
            return header_projects
        };

        $scope.createDownloadList = function (sourceTypes) {
            angular.forEach(sourceTypes, function (source_type, key) {
                $scope.csv_source_types[key] = [];
                angular.forEach(fields, function (field) {
                    $scope.csv_source_types[key].push(source_type[field])
                })
            });
        };

        nrgiSourceTypesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.sourceTypes = response.data;
            console.log(response.data);
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
            $scope.createDownloadList($scope.sourceTypes);
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiSourceTypesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
                    $scope.sourceTypes = _.union($scope.sourceTypes, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                    $scope.createDownloadList($scope.sourceTypes);
                });
            }
        };
    });