'use strict';

angular.module('app')
    .controller('nrgiCountryDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiCountriesSrvc,
        $routeParams
    ) {
        $scope.center=[];
        nrgiCountriesSrvc.get({_id: $routeParams.id}, function (response) {
            $scope.country=response;
            if($scope.country.location.length>0)
            $scope.center={lat:$scope.country.location[0].lat,lng:$scope.country.location[0].lng,zoom: 3};
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
