'use strict';

angular.module('app')
    .controller('nrgiNavBarLoginCtrl', function(
        $scope,
        $http,
        $location,
        nrgiNotifier,
        nrgiIdentitySrvc,
        nrgiAuthSrvc
    ) {
        // assign the identity resource with the current identity using identity service
        $scope.identity = nrgiIdentitySrvc;
        // signin function for signin button
        $scope.signin = function(username, password) {
            nrgiAuthSrvc.authenticateUser(username, password).then(function(success) {
                if(success) {
                    nrgiNotifier.notify('You have successfully signed in!');
                } else {
                    nrgiNotifier.notify('Username/Password combination incorrect');
                }
            });
        };
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