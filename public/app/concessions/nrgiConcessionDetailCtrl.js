'use strict';

angular.module('app')
    .controller('nrgiConcessionDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiConcessionsSrvc,
        $routeParams
    ) {
        $scope.center=[];
        nrgiConcessionsSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.concession = success;
            if($scope.concession.location.length>0)
            $scope.center={lat:$scope.concession.location[0].lat,lng:$scope.concession.location[0].lng,zoom: 3};
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



