'use strict';

angular.module('app')
    .controller('nrgiProjectCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiProjectsSrvc,
        $routeParams
    ) {
        $scope.projectMarkers=[]; $scope.center=[]; var lat=''; var lng='';
        nrgiProjectsSrvc.getProjectById($routeParams.id).then(function(response) {
            $scope.project=response;
            angular.forEach($scope.project.proj_coordinates,function(item,i){
                $scope.projectMarkers.push({message:$scope.project.proj_name,lat:item.loc[0],lng:item.loc[1]});
                lat=item.loc[0];
                lng=item.loc[1];
            });
            $scope.center={lat:lat,lng:lng,zoom: 5};
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





