'use strict';

angular
    .module('app')
    .controller('nrgiSourcesTableCtrl', function ($scope,nrgiSourceTablesSrvc) {
        $scope.sources=[];
        $scope.csv_sources =[];
        $scope.getHeaderSources = function () {return ['Name', 'Type', 'Authority']};
        $scope.getData=function(id,type) {
            if ($scope.sources.length == 0) {
                nrgiSourceTablesSrvc.get({_id: id, type: type}, function (success) {
                    $scope.sources = success.sources;
                    angular.forEach($scope.sources, function(p) {
                        $scope.csv_sources.push({
                            'name': p.source_name,
                            'type': p.source_type_id.source_type_name,
                            'authority': p.source_type_id.source_type_authority
                        });

                    })
                })
            }
        }
    });
