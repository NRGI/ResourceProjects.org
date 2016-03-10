angular.module('app')
    .controller('nrgiCompanyAdminCtrl', function($scope, nrgiCompaniesSrvc) {
        nrgiCompaniesSrvc.query({skip: 0, limit: 0}, function (response) {
            $scope.companies = response.data;
        })
    });