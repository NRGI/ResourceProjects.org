'use strict';

angular.module('app')
    .controller('nrgiProjectDetailCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiProjectsSrvc,
        $routeParams,nrgiProjectDataSrvc
    ) {
        nrgiProjectsSrvc.get({_id: $routeParams.id}, function (success) {
            if(success.error) {
                $scope.error= success.error;
            }else{
                $scope.id =  success.project._id;
                $scope.project = success.project;
            }
        });
        $scope.$watch('id', function(value) {
            if(value!=undefined) {
                nrgiProjectDataSrvc.get({_id: $scope.id}, function (success) {
                    $scope.data = success;
                });
            }
        });

    });





