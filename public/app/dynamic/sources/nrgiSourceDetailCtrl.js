'use strict';

angular.module('app')
    .controller('nrgiSourceDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiSourcesSrvc,
        $routeParams
    ) {
        nrgiSourcesSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.source = success.source;
        });
    });


