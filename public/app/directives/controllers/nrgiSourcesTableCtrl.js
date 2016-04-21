'use strict';

angular
    .module('app')
    .controller('nrgiSourcesTableCtrl', function ($scope,nrgiSourceTablesSrvc,usSpinnerService) {
        $scope.sources=[];
        $scope.csv_sources =[];
        $scope.loading = false;
        $scope.openClose = true;
        $scope.expression='';
        usSpinnerService.spin('spinner-source');
        $scope.$watch('id', function(value) {
            if(value!=undefined){
                $scope.loading = false;
                $scope.getSources($scope.id, $scope.type);
            }
        });
        $scope.getSources=function(id,type) {
            if ($scope.id != undefined) {
                if ($scope.openClose == true) {
                    if ($scope.sources.length == 0 || $scope.loading == false) {
                        $scope.loading = true;
                        nrgiSourceTablesSrvc.get({
                            _id: id,
                            type: type
                        }, function (success) {
                            $scope.expression='';
                            if (success.sources.length == 0 && $scope.sources.length == 0) {
                                $scope.expression = 'showLast';
                            }
                            $scope.sources = _.uniq(success.sources, function (a) {
                                return a._id;
                            });
                            usSpinnerService.stop('spinner-source');
                            $scope.getHeaderSources = function () {
                                return ['Name', 'Type', 'Authority']
                            };
                            angular.forEach($scope.sources, function (p) {
                                $scope.csv_sources.push({
                                    'name': p.source_name,
                                    'type': p.source_type_id.source_type_name,
                                    'authority': p.source_type_id.source_type_authority
                                });

                            })
                        }, function(error){
                            usSpinnerService.stop('spinner-source');
                        })
                    }
                }
            }
        }
    });
