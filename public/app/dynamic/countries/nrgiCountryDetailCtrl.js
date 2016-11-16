'use strict';

angular.module('app')
    .controller('nrgiCountryDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiCountriesSrvc,
        nrgiCountryCommoditiesSrvc,
        $routeParams
    ) {
        nrgiCountriesSrvc.get({_id: $routeParams.id}, function (response) {
            $scope.country=response.country;
            $scope.country.commodities=response.commodities;
        });
        $scope.$watch('country._id', function(value) {
            if(value!=undefined){
                nrgiCountryCommoditiesSrvc.get({_id: value}, function (response) {
                    $scope.data = response;
                });
            }
        });
    });
