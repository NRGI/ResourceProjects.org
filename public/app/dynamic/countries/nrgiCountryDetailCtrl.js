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
            $scope.country=response.country;
            $scope.country.commodities=[];
            angular.forEach(response.commodities,function(value) {
                $scope.country.commodities.push(value);
            })
        });
    });
