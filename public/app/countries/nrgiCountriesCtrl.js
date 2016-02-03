'use strict';

angular.module('app')
    .controller('nrgiCountriesCtrl', function (
        $scope,
        ISO3166,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        $sce,
        nrgiCountriesSrvc
    ) {
        nrgiCountriesSrvc.getAllCountries().then(function(response) {
            $scope.countries =response;
        });
    });
