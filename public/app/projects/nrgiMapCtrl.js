'use strict';

angular.module('app')
    .controller('nrgiMapCtrl', function (
        $scope,
        nrgiProjectsSrvc
    ) {
        nrgiProjectsSrvc.get(function (success) {
            $scope.projectMarkers = success.data;
        });
    });