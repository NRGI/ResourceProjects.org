'use strict';

angular.module('app')
    .controller('nrgiConcessionsCtrl', function (
        $scope,
        ISO3166,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        $sce,
        nrgiConcessionsSrvc
    ) {
        nrgiConcessionsSrvc.getAllConcessions().then(function(response) {
            $scope.concessions =response;
        });
    });
