angular.module('app')
    .controller('nrgiCompanyAdminUpdateCtrl', function(
        $scope,
        $routeParams,
        $location,
        nrgiNotifier,
        nrgiCompaniesMethodSrvc,
        nrgiCompaniesSrvc,
        nrgiCountriesSrvc
    ) {
        $scope.company = nrgiCompaniesSrvc.get({_id:$routeParams.id});
        $scope.country = nrgiCountriesSrvc.query({skip: 0, limit: 0});
        $scope.companyUpdate = function() {
            nrgiCompaniesMethodSrvc.updateCompany($scope.company).then(function() {
                nrgiNotifier.notify('Company has been updated');
                $location.path('/admin/company-admin');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };

        $scope.companyDelete = function() {
            var company_deletion = $scope.company._id;
            nrgiCompaniesMethodSrvc.deleteCompany(company_deletion).then(function() {
                nrgiNotifier.notify('Company has been deleted');
                $location.path('/admin/company-admin');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };
    });