'use strict';

angular.module('app')
    .controller('nrgiProfileCtrl', function(
        $scope,
        nrgiIdentitySrvc,
        nrgiUserMethodSrvc,
        nrgiNotifier
    ) {
        // set page resources to be those of the current identity
        $scope.full_name = nrgiIdentitySrvc.currentUser.first_name + " " + nrgiIdentitySrvc.currentUser.last_name;
        $scope.first_name = nrgiIdentitySrvc.currentUser.first_name;
        $scope.last_name = nrgiIdentitySrvc.currentUser.last_name;
        $scope.email = nrgiIdentitySrvc.currentUser.email;
        $scope.username = nrgiIdentitySrvc.currentUser.username;
        $scope.roles = nrgiIdentitySrvc.currentUser.roles;
        // update functinonality for update button
        $scope.update = function() {
            // pass in update data
            var new_user_data = {
                first_name: $scope.first_name,
                last_name: $scope.last_name,
                email: $scope.email
            };
            // check if password update exists and pass it in
            if($scope.password && $scope.passowrd.length > 0) {
                newUserData.password = $scope.password;
            }
            // use authorization service to update user data
            nrgiUserMethodSrvc.updateCurrentUser(new_user_data).then(function() {
                nrgiNotifier.notify('Your user account has been updated');
            }, function(reason) {
                nrgiNotifier.notify(reason);
            });
        }
    });