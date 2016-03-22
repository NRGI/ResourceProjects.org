'use strict';

angular.module('app')
    .controller('nrgiCountryDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiCountriesSrvc,
        $routeParams
    ) {
        nrgiCountriesSrvc.get({_id: $routeParams.id}, function (response) {
            $scope.country=response;
        });
    });
