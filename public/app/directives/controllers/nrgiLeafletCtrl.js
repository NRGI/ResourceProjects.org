'use strict';

angular
    .module('app')
    .controller('nrgiLeafletCtrl', function ($scope,$rootScope, nrgiCountryCoordinatesSrvc) {

        $scope.show =false;
        $scope.center = [];$scope.polygon=[];
        $scope.alldata = [];
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
        $scope.$watch('id', function(value) {
            if ($scope.type == 'country' && value != undefined||$scope.type == 'company' && value != undefined) {
                $scope.alldata = value;
                $scope.loadCoordinate($scope.alldata, $scope.polygon)
            }
            if ($scope.type != 'country' && value != undefined&& $scope.type != 'company') {
                $scope.getCoordinate(value, $scope.type);
            }
        });
        $scope.$watch('data', function(value) {
            if(value!=undefined) {
                $scope.alldata = value;

                if (value.polygon != undefined) {
                    $scope.polygon = value.polygon;
                }
                $scope.loadCoordinate(value, $scope.polygon)
            }
        })
        $scope.getCoordinate =function(id,type){
            setTimeout(function() {
                nrgiCountryCoordinatesSrvc.get({
                    _id: id,
                    type: type
                }, function (response) {
                    $scope.alldata = response.proj_coordinates;
                    if (response.polygon != undefined) {
                        $scope.polygon = response.polygon;
                    }
                    $scope.loadCoordinate($scope.alldata,$scope.polygon)
                });
            },2000)
        }
        $scope.loadCoordinate = function(response,polygon){
            $scope.polygon =polygon;
            if ($scope.map == true)
                $scope.data_loading = true;
            if ($scope.alldata.length > 0)
                var len = $scope.alldata.length;
            var counter = 0;
            var lat = [];
            var lng = [];
            angular.forEach(response, function (data) {
                counter++;
               if (data.type == 'site') {
                    $scope.location.push({
                        lat: data.lat,
                        lng: data.lng,
                        message: "<a href='site/" + data._id + "'>" + data.message + "</a></br>" + data.message
                    });
                } else if (data.type == 'field') {
                    $scope.location.push({
                        lat: data.lat,
                        lng: data.lng,
                        message: "<a href='field/" + data._id + "'>" + data.message + "</a></br>" + data.message
                    });
                } else if ($scope.map == true) {
                    if (data.coordinates.length > 0) {
                        $scope.location.push(data.coordinates[0]);
                    }
                } else {
                        $scope.location.push({
                            lat: data.lat,
                            lng: data.lng,
                            message: "<a href='site/" + data._id + "'>" + data.message + "</a></br>" + data.message
                        });
               }
                lat.push(data.lat);
                lng.push(data.lng);
                if (len == counter && $scope.map == true) {
                    $scope.data_loading = false;
                    $scope.center = {
                        lat: lat.reduce(function(pv, cv) { return pv + parseInt(cv); }, 0) / lat.length,
                        lng: lng.reduce(function(pv, cv) { return pv + parseInt(cv); }, 0) / lng.length,
                        zoom: 2
                    };
                }
                if (len == counter && $scope.map != true && $scope.alldata.length > 1) {
                    $scope.center = {
                        lat: lat.reduce(function(pv, cv) { return pv + parseInt(cv); }, 0) / lat.length,
                        lng: lng.reduce(function(pv, cv) { return pv + parseInt(cv); }, 0) / lng.length,
                        zoom: 4
                    };
                }
                if (len == counter && $scope.map != true && $scope.alldata.length == 1) {
                    $scope.center = {lat: data.lat, lng: data.lng, zoom: 3};
                }
                $scope.show =true;
            })
            if ($scope.polygon != undefined) {
                if ($scope.polygon.length > 1) {
                    angular.forEach($scope.polygon, function (polygon, i) {
                        $scope.paths.polygon.latlngs[i] = polygon.coordinate;
                    });
                    $scope.paths.polygon.type = "multiPolygon";
                }
                if ($scope.polygon.length == 1) {
                    $scope.paths.polygon.type = "polygon";
                    $scope.paths.polygon.latlngs = $scope.polygon[0].coordinate;
                }
            }
        }
    });
