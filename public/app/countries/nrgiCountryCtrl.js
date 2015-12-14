'use strict';

angular.module('app')
    .controller('nrgiCountryCtrl', function (
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
            sidney: {
                lat: 23,
                lng: 258,
                zoom: 5
            },
            tiles: tilesDict.openstreetmap,
            defaults: {
                scrollWheelZoom: false
            }
        });
        $scope.countries = [
            {id:'AO',name:'Angola',count:'15'},
            {id:'CG',name:'Congo',count:'1'},
            {id:'CI',name:'Cote d&apos;Ivoire',count:'2'},
            {id:'GQ',name:'Equatorial Guinea',count:'2'},
            {id:'ET',name:'Ethiopia',count:'1'},
            {id:'GA',name:'Gabon',count:'7'},
            {id:'GH',name:'Ghana',count:'18'},
            {id:'JM',name:'Jamaica',count:'1'},
            {id:'MG',name:'Madagascar',count:'1'},
            {id:'MR',name:'Mauritania',count:'3'}
        ];
    });



