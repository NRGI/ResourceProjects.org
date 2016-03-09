angular.module('app')
    .controller('nrgiCountryAdminCtrl', function($scope, nrgiCountriesSrvc) {
        nrgiCountriesSrvc.query({skip: 0, limit: 0}, function (response) {
            $scope.countries = response.data;
        })
    });