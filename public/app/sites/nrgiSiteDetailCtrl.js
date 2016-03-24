'use strict';

angular.module('app')
    .controller('nrgiSiteDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiSitesSrvc,
        $routeParams
    ) {
        nrgiSitesSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.site = success;
        });
    });