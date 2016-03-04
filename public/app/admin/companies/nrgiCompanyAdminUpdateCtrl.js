angular.module('app')
    .controller('nrgiCompanyAdminUpdateCtrl', function(
        $scope,
        $routeParams,
        $location,
        nrgiNotifier,
        nrgiCompaniesMethodSrvc,
        nrgiCompaniesSrvc

    ) {
        $scope.company = nrgiCompaniesSrvc.get({_id:$routeParams.id});
        $scope.commodityUpdate = function() {
            nrgiCompaniesMethodSrvc.updateCompany($scope.company).then(function() {
                nrgiNotifier.notify('Company has been updated');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };

        $scope.commodityDelete = function() {
            var company_deletion = $scope.company._id;
            nrgiCompaniesMethodSrvc.deleteCompany(company_deletion).then(function() {
                nrgiNotifier.notify('Company has been deleted');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };
    });