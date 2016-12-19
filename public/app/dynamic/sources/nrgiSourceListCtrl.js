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
        var fields = ['source_name', 'source_type_id', 'source_url', 'source_date', 'retrieve_date'];
        var header_projects = ['Source', 'Source type', 'Access source', 'Source date', 'Retrieved date'];
        $scope.getHeaderSources = function () {
            return header_projects
        };

        $scope.createDownloadList = function (sources) {
            angular.forEach(sources, function (source, key) {
                $scope.csv_sources[key] = [];
                angular.forEach(fields, function (field) {
                    if(field == 'source_type_id' ){
                        if(source[field] && source[field].source_type_name) {
                            $scope.csv_sources[key].push(source[field].source_type_name)
                        }else{
                            $scope.csv_sources[key].push('')
                        }
                    }
                    if (field == 'source_date' || field == 'retrieve_date') {
                        source[field] = $filter('date')(source[field],'yyyy-MM-dd');
                        $scope.csv_sources[key].push(source[field])
                    }
                    if (field != 'source_date' && field != 'retrieve_date' && field != 'source_type_id') {
                        $scope.csv_sources[key].push(source[field])
                    }
                })
            });
        };

        nrgiSourcesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.sources = response.sources;
            $scope.types = [];
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
            $scope.createDownloadList($scope.sources);
            _.each(response.sources, function(sources) {
                $scope.types.push(sources.source_type_id);
            });
            $scope.source_type_id = _.countBy($scope.types, "source_type_name");
        });
        $scope.$watch('source_type_filter', function(source_type) {
            currentPage = 0;
            totalPages = 0;
            var searchOptions = {skip: currentPage, limit: limit};
            if(source_type) {
                _.each($scope.types, function (type) {
                    if (type && type.source_type_name.toString() == source_type.toString()) {
                        searchOptions.source_type_id = type._id;
                    }
                });

                nrgiSourcesSrvc.query(searchOptions, function (response) {
                    if (response.reason) {
                        nrgiNotifier.error('Load document data failure');
                    } else {
                        $scope.count = response.count;
                        $scope.sources = response.sources;
                        totalPages = Math.ceil(response.count / limit);
                        currentPage = currentPage + 1;
                        $scope.createDownloadList($scope.sources);
                    }
                });
            }
        });
        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiSourcesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
                    $scope.sources = _.union($scope.sources, response.sources);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                    $scope.createDownloadList($scope.sources);
                });
            }
        };
    });