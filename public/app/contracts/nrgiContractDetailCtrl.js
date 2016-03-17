'use strict';

angular.module('app')
    .controller('nrgiContractDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiContractsSrvc,
        $routeParams
    ) {
        $scope.center=[];
        nrgiContractsSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.contract = success;
            if($scope.contract.location.length>0) {
                $scope.center={lat:$scope.contract.location[0].lat,lng:$scope.contract.location[0].lng,zoom: 3};
            }
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



