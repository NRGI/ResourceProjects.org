'use strict';

angular.module('app')
    .controller('nrgiConcessionDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiConcessionsSrvc,
        nrgiConcessionDataSrvc,
        $routeParams
    ) {
        nrgiConcessionsSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.concession = success.concession;
        });
        nrgiConcessionDataSrvc.get({_id: $routeParams.id}, function (success) {
            console.log(success)
            //$scope.concession = success.concession;
        });
    });



