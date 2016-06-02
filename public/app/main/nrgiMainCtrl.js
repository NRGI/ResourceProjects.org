'use strict';

angular.module('app')
    .controller('nrgiMainCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc
    ) {
        $scope.current_user = nrgiIdentitySrvc.currentUser;
    });