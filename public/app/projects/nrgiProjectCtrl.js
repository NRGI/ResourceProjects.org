'use strict';

angular.module('app')
    .controller('nrgiProjectCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc
    ) {

        $scope.project =
            {id:'MX/adel-sbdtui',name:'Adelita',country:'Mexico',id_country:'MX',aliases:'',types:[{type:'Mining'},{type:''}],
                number:'1',commodities:[{id:'Copper',name:'Copper'}], status:'Production (True at: 2014-01-01)',
            contracts:'', concessions:'',lat:26.7202,lng: -108.5704};
        console.log($scope.project.lat);
        var tilesDict = {
            openstreetmap: {
                url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
                options: {
                    attribution: 'Tiles: &copy; Esri'
                }
            }
        };
        angular.extend($scope, {
            projectCountry: {
                lat:  $scope.project.lat,
                lng: $scope.project.lng,
                zoom: 5
            },
            projectMarkers: {
                m1: {
                    lat:  $scope.project.lat,
                    lng: $scope.project.lng,
                    message: '<b>' + $scope.project.name+'</b>'
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





