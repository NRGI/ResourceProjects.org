'use strict';

angular.module('app')
    .controller('nrgiMapCtrl', function (
        $scope,
        nrgiProjectsSrvc
    ) {
        nrgiProjectsSrvc.get(function (success) {
            $scope.project_count = success.count;
            $scope.projectMarkers = success.data;
        });
    });