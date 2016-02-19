'use strict';

angular.module('app')
    .controller('nrgiProjectDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiProjectsSrvc,
        $routeParams
    ) {
        $scope.projectMarkers=[]; $scope.center=[];
        nrgiProjectsSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.project = success;
            $scope.center={lat:$scope.project.coordinates[0].lat,lng:$scope.project.coordinates[0].lng,zoom: 5};
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





