'use strict';

angular.module('app')
    .controller('nrgiCompanyCtrl', function (
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
            companyCountry: {
                lat:  25,
                lng: 5,
                zoom: 5
            },
            companyMarkers: {
                m1: {
                    lat:  26,
                    lng: 4,
                    message: '<b>' + 'Company'+'</b>'
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

