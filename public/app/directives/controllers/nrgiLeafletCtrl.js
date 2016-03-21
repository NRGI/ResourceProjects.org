'use strict';

angular
    .module('app')
    .controller('nrgiLeafletCtrl', function ($scope,$rootScope) {
        $scope.center = [];
        $scope.location = [];
        $rootScope.projects=[];
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
        setTimeout( function(){
            if ($scope.data.length > 0)
            var len = $scope.data.length;
            var counter =0;
            angular.forEach($scope.data,function(data){
                counter++;
                if($scope.project==true){
                    $scope.location.push({lat: data.lat, lng: data.lng,message: data.message});
                }else {
                    if (data.type == 'project') {
                        $scope.location.push({
                            lat: data.lat,
                            lng: data.lng,
                            message: "<a href='project/" + data.id + "'>" + data.message + "</a></br>" + data.message
                        });
                    } else {
                        $scope.location.push({lat: data.lat, lng: data.lng, message: data.message});
                    }
                }
                if (len == counter && $scope.map !=true) {
                    $scope.center = {lat: data.lat, lng: data.lng, zoom: 3};
                }
            });
            $scope.$apply();
        },1000)
    });
