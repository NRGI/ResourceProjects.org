'use strict';

angular.module('app')
    .controller('nrgiCompanyDetailCtrl', function (
        $scope,
        $routeParams,
        nrgiCompaniesSrvc,
        $q
    ) {
        $scope.collapse = false;
        nrgiCompaniesSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.company = success;
        });
        $scope.projectTableLoad = function(){

            $('#projTable').append('<nrgi-project-table  country="true" commodity="true"  status="true" type="true" companies="false"></nrgi-project-table>');

        }
    });
