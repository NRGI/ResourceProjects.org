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
            $scope.id =  $routeParams.id;
        });
        nrgiConcessionDataSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.data = success;
        });
    });



