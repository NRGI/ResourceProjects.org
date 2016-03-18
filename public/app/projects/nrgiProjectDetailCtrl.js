'use strict';

angular.module('app')
    .controller('nrgiProjectDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiProjectsSrvc,
        $routeParams,
        $location
    ) {
        var id = window.localStorage.getItem('id_project');
        var rout = window.localStorage.getItem('routing_project');
        var location = $location.path();
        location = location.split('/project/')[1];
        if(id!=undefined && rout==location && rout!=undefined){
            var project_id=id;
        }else{
            $location.path('/projects');
        }
        $scope.projectMarkers=[]; $scope.center=[];
        nrgiProjectsSrvc.get({_id: project_id}, function (success) {
            $scope.project = success;
            if($scope.project.coordinates.length>0)
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





