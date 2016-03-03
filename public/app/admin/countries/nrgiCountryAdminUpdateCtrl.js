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
        $scope.country = nrgiCountriesSrvc.get({_id:$routeParams.id});
        $scope.countryUpdate = function() {
            nrgiCountriesMethodSrvc.updateCountry($scope.country).then(function() {
                nrgiNotifier.notify('Country has been updated');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };

        $scope.countryDelete = function() {
            var country_deletion = $scope.source._id;
            nrgiCountriesMethodSrvc.deleteSource(country_deletion).then(function() {
                nrgiNotifier.notify('Country has been deleted');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };
    });