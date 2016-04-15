'use strict';

angular
    .module('app')
    .controller('nrgiSourcesTableCtrl', function ($scope,nrgiSourceTablesSrvc) {
        $scope.sources=[];
        $scope.csv_sources =[];
        $scope.limit = 50;
        $scope.page = 0;
        $scope.loading = false;
        $scope.openClose = false;
        $scope.loadMoreSources=function() {
            if($scope.loading==false) {
                $scope.page = $scope.page+$scope.limit;
                $scope.getSources($scope.id, $scope.type);
            }
        };
        $scope.getHeaderSources = function () {return ['Name', 'Type', 'Authority']};
        $scope.getSources=function(id,type) {
            if ($scope.openClose == true) {
                if ($scope.sources.length == 0 || $scope.loading == false) {
                    $scope.loading = true;
                    nrgiSourceTablesSrvc.get({
                        _id: id,
                        type: type,
                        skip: $scope.page,
                        limit: $scope.limit
                    }, function (success) {
                        if (success.sources.length < $scope.limit) {
                            $scope.loading = true;
                        } else {
                            $scope.loading = false;
                        }
                        success.sources = _.uniq(success.sources, function (a) {
                            return a._id;
                        });
                        if (success.sources.length > 0) {
                            _.each(success.sources, function (source) {
                                $scope.sources.push(source);
                            });
                        }
                        angular.forEach($scope.sources, function (p) {
                            $scope.csv_sources.push({
                                'name': p.source_name,
                                'type': p.source_type_id.source_type_name,
                                'authority': p.source_type_id.source_type_authority
                            });

                        })
                    })
                }
            }
        }
    });
