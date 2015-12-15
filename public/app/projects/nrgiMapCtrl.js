'use strict';

angular.module('app')
    .controller('nrgiMapCtrl', function (
        $scope
    ) {
        $scope.map ={
            'center': {
                lat: 23,
                lng: 258,
                zoom: 2
            },
            markers:{
                m1: {
                    lat: 23,
                    lng: 258,
                    message: "I'm a static marker"
                },
                m2: {
                    lat: 38.716,
                    lng: 258,
                    message: "I'm a static marker"
                },
                m3: {
                    lat: 45,
                    lng: 258,
                    message: "I'm a static marker"
                },
                m4: {
                    lat: 38.716,
                    lng: 258,
                    message: "I'm a static marker"
                },
                m5: {
                    lat: 12,
                    lng: 258,
                    message: "<a href ='/'>q</a><br>I'm a static marker"
                },
                m6: {
                    lat: 78,
                    lng: 258,
                    message: "I'm a static marker"
                },
                m7: {
                    lat: 36,
                    lng: 258,
                    message: "I'm a static marker"
                },
                m8: {
                    lat: 59,
                    lng: 258,
                    message: "I'm a static marker"
                }
            },
            controls: {
                fullscreen: {
                    position: 'topleft'
                }
            },
            tiles:{
                url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
                options: {
                    attribution: 'Tiles: &copy; Esri'
                }
            },
            defaults: {
                scrollWheelZoom: false
            }
        };
    });