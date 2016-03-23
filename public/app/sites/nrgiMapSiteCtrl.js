'use strict';

angular.module('app')
    .controller('nrgiMapSiteCtrl', function (
        $scope,
        nrgiSitesSrvc
    ) {
        nrgiSitesSrvc.get(function (success) {
            $scope.siteMarkers = success.data;
        });
    });