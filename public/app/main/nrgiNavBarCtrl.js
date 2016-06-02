'use strict';

angular.module('app')
    .controller('nrgiNavBarCtrl', function(
        $scope,
        $http,
        $location,
        nrgiNotifier,
        nrgiIdentitySrvc,
        nrgiAuthSrvc
    ) {
        // assign the identity resource with the current identity using identity service
        $scope.identity = nrgiIdentitySrvc;
        // signout function for signout button
        $scope.signout = function() {
            nrgiAuthSrvc.logoutUser().then(function() {
                $scope.username = "";
                $scope.password = "";
                nrgiNotifier.notify('You have successfully signed out!');
                $location.path('/');
            })
        }
    });