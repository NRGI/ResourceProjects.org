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
                    // attribution: 'Tiles: &copy; Esri'
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
            }, paths: {
                polygon: {
                    type: "polygon",
                    latlngs:[],
                    fillColor: 'red',
                    weight: 2,
                    color: 'red'
                }
            }
        });
        setTimeout( function(){
            if ($scope.data.length > 0)
            var len = $scope.data.length;
            var counter =0;
            var lat =0;
            var lng =0;
            angular.forEach($scope.data,function(data){
                counter++;
                if($scope.project==true && data.type=='project'){
                    $scope.location.push({lat: data.lat, lng: data.lng,message: data.message});
                }else if(data.type=='site'){
                    $scope.location.push({lat: data.lat, lng: data.lng,message: "<a href='site/" + data.id + "'>" + data.message + "</a></br>" + data.message});
                }else if(data.type=='field'){
                    $scope.location.push({lat: data.lat, lng: data.lng,message: "<a href='field/" + data.id + "'>" + data.message + "</a></br>" + data.message});
                }else if($scope.map ==true && $scope.site==false){
                    $scope.location.push({
                        lat: data.lat,
                        lng: data.lng,
                        message: "<a href='site/" + data.id + "'>" + data.message + "</a></br>" + data.message
                    });
                }else if($scope.map ==true && $scope.site==true){
                    $scope.location.push({
                        lat: data.lat,
                        lng: data.lng,
                        message: "<a href='field/" + data.id + "'>" + data.message + "</a></br>" + data.message
                    });
                }else {
                    if (data.type == 'project') {
                        $scope.location.push({
                            lat: data.lat,
                            lng: data.lng,
                            message: "<a href='project/" + data.id + "'>" + data.message + "</a></br>" + data.message
                        });
                    } else {
                        $scope.location.push({
                            lat: data.lat,
                            lng: data.lng,
                            message: "<a href='site/" + data.id + "'>" + data.message + "</a></br>" + data.message
                        });
                    }
                }
                lat = +data.lat;
                lng = +data.lng;
                if (len == counter && $scope.map !=true&&$scope.data.length>1) {
                    $scope.center = {lat: lat/len , lng:lng/len, zoom:0};
                }
                if (len == counter && $scope.map !=true&&$scope.data.length==1) {
                    $scope.center = {lat: data.lat, lng: data.lng, zoom: 3};
                }
            });
            $scope.$apply();
            if($scope.polygon.length>1){
                angular.forEach($scope.polygon,function(polygon,i){
                    $scope.paths.polygon.latlngs[i] = polygon.coordinate;
                });
                $scope.paths.polygon.type="multiPolygon";
            }
            if($scope.polygon.length==1){
                $scope.paths.polygon.type="polygon";
                $scope.paths.polygon.latlngs = $scope.polygon[0].coordinate;
            }
            $scope.$apply();
        },100)
    });
