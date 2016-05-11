'use strict';

angular.module('app')
    .controller('nrgiCompanyDetailCtrl', function (
        $scope,
        $routeParams,
        nrgiCompaniesSrvc,
        nrgiCompanyDataSrvc
    ) {
        $scope.company =[];
        nrgiCompaniesSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.company = success;
        });
        nrgiCompanyDataSrvc.get({_id: $routeParams.id}, function (response) {
            $scope.company.company_groups=[];
            $scope.company.company_commodity=[];
            angular.forEach(response.company_groups,function(company_groups) {
                $scope.company.company_groups.push(company_groups);
            });
            angular.forEach(response.company_commodity,function(company_commodity) {
                $scope.company.company_commodity.push(company_commodity);
            })
        });
    });
