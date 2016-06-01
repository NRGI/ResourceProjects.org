'use strict';

angular.module('app')
    .controller('nrgiLoginCtrl', function(
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
                    $location.path('/')
                } else {
                    nrgiNotifier.error('Username/Password combination incorrect');
                }
            });
        };
    });