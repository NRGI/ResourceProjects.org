'use strict';

angular.module('app')
    .controller('nrgiMapCtrl', function (
        $scope,
        nrgiProjectsSrvc,
        $routeParams
    ) {
    $scope.projectMarkers=[]; $scope.map=[]; var lat=''; var lng='';
    nrgiProjectsSrvc.get(function (success) {
        $scope.projectMarkers = success.data;
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