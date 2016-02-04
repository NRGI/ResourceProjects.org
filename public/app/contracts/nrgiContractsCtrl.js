'use strict';

angular.module('app')
    .controller('nrgiContractsCtrl', function (
        $scope,
        ISO3166,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        $sce,
        nrgiContractsSrvc
    ) {
        nrgiContractsSrvc.getAllContracts().then(function(response) {
            $scope.contracts =response;
        });
    });
