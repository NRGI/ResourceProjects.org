angular.module('app')
    .controller('nrgiCountryAdminUpdateCtrl', function(
        $scope,
        $routeParams,
        $location,
        nrgiNotifier,
        nrgiProjectsSrvc,
        nrgiCountriesMethodSrvc,
        nrgiCountriesSrvc

    ) {
        $scope.country = nrgiCountriesSrvc.get({_id: $routeParams.id});
        $scope.countryUpdate = function() {
            nrgiCountriesMethodSrvc.updateCountry($scope.country).then(function() {
                nrgiNotifier.notify('Country has been updated');
                $location.path('/admin/country-admin');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };

        $scope.countryDelete = function() {
            var country_deletion = $scope.country._id;
            nrgiCountriesMethodSrvc.deleteCountry(country_deletion).then(function() {
                nrgiNotifier.notify('Country has been deleted');
                $location.path('/admin/country-admin');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };
    });