'use strict';

angular.module('app')
    .controller('nrgiConcessionDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiConcessionsSrvc,
        $routeParams
    ) {
        nrgiConcessionsSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.concession = success;
        });
        //var tilesDict = {
        //    openstreetmap: {
        //        url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        //        options: {
        //            attribution: 'Tiles: &copy; Esri'
        //        }
        //    }
        //};
        //angular.extend($scope, {
        //    tiles: tilesDict.openstreetmap,
        //    defaults: {
        //        scrollWheelZoom: false
        //    },
        //    controls: {
        //        fullscreen: {
        //            position: 'topleft'
        //        }
        //    }
        //});
    });



