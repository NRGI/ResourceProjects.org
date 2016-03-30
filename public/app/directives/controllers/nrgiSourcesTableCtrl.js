'use strict';

angular
    .module('app')
    .controller('nrgiSourcesTableCtrl', function ($scope) {
        setTimeout(function(){
            $scope.csv_sources =[];
            $scope.getHeaderSources = function () {return ['Name', 'Type', 'Authority']};

            angular.forEach($scope.sources, function(p) {
                $scope.csv_sources.push({
                    'name': p.source_name,
                    'type': p.source_type_id.source_type_name,
                    'authority': p.source_type_id.source_type_authority
                });

            })
        },2000)
    });
