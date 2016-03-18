'use strict';

angular.module('app')
    .controller('nrgiCommodityDetailCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiCommoditiesSrvc,
        $location
    ) {
        var id = window.localStorage.getItem('id');
        var rout = window.localStorage.getItem('rout');
        var location = $location.path();
        location = location.split('/commodity/')[1];
        if(id!=undefined && rout==location && rout!=undefined){
           var commodity_id=id;
        }else{
            $location.path('/commodities');
        }
        $scope.center=[];
        nrgiCommoditiesSrvc.get({_id: commodity_id}, function (response) {
            $scope.commodity=response;
            if($scope.commodity.location.length>0)
                angular.forEach($scope.commodity.projects, function (project, i) {
                    var id =project._id;
                    $scope.commodity.location[i].message = "<nrgi-project-routing id='{{id}}' project='{{project.proj_id}}' name='{{"+project.proj_name+"}}'></nrgi-project-routing>"
                });
           $scope.center={lat:$scope.commodity.location[0].lat,lng:$scope.commodity.location[0].lng,zoom: 5};
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
