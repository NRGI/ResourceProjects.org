'use strict';

angular.module('app')
    .controller('nrgiGroupCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc
    ) {

        var tilesDict = {
            openstreetmap: {
                url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
                options: {
                    attribution: 'Tiles: &copy; Esri'
                }
            }
        };
        angular.extend($scope, {
            groupCountry: {
                lat:  25,
                lng: 5,
                zoom: 5
            },
            groupMarkers: {
                m1: {
                    lat:  26,
                    lng: 4,
                    message: '<b>' + 'Group'+'</b>'
                }
            },
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
