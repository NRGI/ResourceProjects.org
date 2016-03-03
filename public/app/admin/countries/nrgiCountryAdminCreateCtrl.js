angular.module('app')
    .controller('nrgiCountryAdminCreateCtrl', function(
        $scope,
        $location,
        nrgiNotifier,
        nrgiIdentitySrvc,
        nrgiCountriesSrvc,
        nrgiCountriesMethodSrvc
    ) {
        $scope.country =[];
        $scope.countryCreate = function() {
            nrgiCountriesMethodSrvc.createCountry($scope.country).then(function() {
                nrgiNotifier.notify('Country created!');
            }, function(reason) {
                nrgiNotifier.error(reason);
            })
        };
    });