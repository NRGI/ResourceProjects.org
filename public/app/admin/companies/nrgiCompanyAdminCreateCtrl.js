angular.module('app')
    .controller('nrgiCompanyAdminCreateCtrl', function(
        $scope,
        $location,
        nrgiNotifier,
        nrgiIdentitySrvc,
        nrgiCountriesSrvc,
        nrgiCompaniesMethodSrvc
    ) {
        $scope.company =[];
        $scope.country = nrgiCountriesSrvc.query({skip: 0, limit: 0});
        $scope.companyCreate = function() {
            console.log($scope.company);
            nrgiCompaniesMethodSrvc.createCompany($scope.company).then(function() {
                nrgiNotifier.notify('Company created!');
            }, function(reason) {
                nrgiNotifier.error(reason);
            })
        };
    });