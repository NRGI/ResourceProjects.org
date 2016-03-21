'use strict';

angular.module('app')
    .controller('nrgiContractDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiContractsSrvc,
        $routeParams
    ) {
        nrgiContractsSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.contract = success;
        });
    });



