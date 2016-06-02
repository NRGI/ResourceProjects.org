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
            $scope.country=response;
            $scope.country.commodities=[];
        });
        $scope.$watch('country._id', function(value) {
            if(value!=undefined){
                nrgiCountryCommoditiesSrvc.get({_id: value}, function (response) {
                    angular.forEach(response.commodities,function(value) {
                        $scope.country.commodities.push(value);
                    })
                    $scope.country =$scope.country
                });
            }
        });
    });
