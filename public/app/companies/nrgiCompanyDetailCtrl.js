'use strict';

angular.module('app')
    .controller('nrgiCompanyDetailCtrl', function (
        $scope,
        $routeParams,
        nrgiCompaniesSrvc
    ) {
        $scope.proj_table_sort = {sort_type: 'project.project.proj_name', sort_reverse: false, search_text: ''};
        $scope.center=[];
        $scope.record_type = 'companies';
        nrgiCompaniesSrvc.get({_id: $routeParams.id,record_type:$scope.record_type}, function (success) {
            $scope.company = success;
            $scope.center={lat:$scope.company.location[0].lat,lng:$scope.company.location[0].lng,zoom: 3};
        });

        var tilesDict = {
            openstreetmap: {
                url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
                options: {
                    attribution: 'Tiles: &copy; Esri'
                }
            }
        };
        angular.extend($scope, {
            tiles: tilesDict.openstreetmap,
            defaults: {
                scrollWheelZoom: false
            },
            controls: {
                fullscreen: {
                    position: 'topleft'
                }
            }
        });
    });
