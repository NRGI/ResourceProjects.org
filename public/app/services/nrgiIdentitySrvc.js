'use strict';

angular.module('app')
    .factory('nrgiIdentitySrvc', function(
        $window,
        nrgiUserSrvc
    ) {
        var currentUser;
        // bootstrapped object to keep session alive
        if(!!$window.bootstrappedUserObject) {
            currentUser = new nrgiUserSrvc();
            angular.extend(currentUser, $window.bootstrappedUserObject);
        }
        return {
            currentUser: currentUser,
            // authentication test
            isAuthenticated: function() {
                return !!this.currentUser;
            },
            // role authorization test
            isAuthorized: function(role) {
                return !!this.currentUser && this.currentUser.role.indexOf(role) > -1;
            }
            // user id test
        }
    });