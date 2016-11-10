'use strict';

angular.module('app')
    .controller('nrgiProjectDetailCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiProjectsSrvc,
        $routeParams
    ) {
        nrgiProjectsSrvc.get({_id: $routeParams.id}, function (success) {
            if(success.error) {
                $scope.error= success.error;
            }else{
                $scope.project = success;
            }
        });
    });





