'use strict';

angular.module('app')
    .controller('nrgiGroupDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiGroupsSrvc,
        nrgiGroupDataSrvc,
        $routeParams
    ) {
        $scope.group=[];
        nrgiGroupsSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.group=success;
        });
        nrgiGroupDataSrvc.get({_id: $routeParams.id}, function (response) {
            $scope.group.companies=[];
            $scope.group.commodities=[];
            angular.forEach(response.companies,function(company) {
                $scope.group.companies.push(company);
            });
            angular.forEach(response.commodities,function(commodity) {
                $scope.group.commodities.push(commodity);
            })
        });
    });
