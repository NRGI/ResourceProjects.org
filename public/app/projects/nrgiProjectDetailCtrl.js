'use strict';

angular.module('app')
    .controller('nrgiProjectDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiProjectsSrvc,
        $routeParams
    ) {
        nrgiProjectsSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.project = success;
        });
    });





