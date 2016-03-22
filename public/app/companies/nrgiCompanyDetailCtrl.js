'use strict';

angular.module('app')
    .controller('nrgiCompanyDetailCtrl', function (
        $scope,
        $routeParams,
        nrgiCompaniesSrvc
    ) {
        nrgiCompaniesSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.company = success;
        });
    });
