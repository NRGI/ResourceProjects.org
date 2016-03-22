'use strict';

angular.module('app')
    .controller('nrgiGroupDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiGroupsSrvc,
        $routeParams
    ) {
        nrgiGroupsSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.group=success;
        });
    });
