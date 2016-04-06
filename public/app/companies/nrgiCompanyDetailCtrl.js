'use strict';

angular.module('app')
    .controller('nrgiCompanyDetailCtrl', function (
        $scope,
        $routeParams,
        nrgiCompaniesSrvc
    ) {
        $scope.collapse = false;
        nrgiCompaniesSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.company = success;
        });
    });
