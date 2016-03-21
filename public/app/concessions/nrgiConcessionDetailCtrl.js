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
    });



