'use strict';

angular.module('app')
    .controller('nrgiMainCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiLandingPageContentSrvc
    ) {
        $scope.current_user = nrgiIdentitySrvc.currentUser;
        nrgiLandingPageContentSrvc.get(function (success) {
            $scope.content = success;
        }, function(error) {     });
    });