angular.module('app')
    .controller('nrgiUserAdminCreateCtrl', function(
        $scope,
        $location,
        nrgiNotifier,
        nrgiIdentitySrvc,
        nrgiUserSrvc,
        nrgiUserMethodSrvc
    ) {
        $scope.role_options = [
            {value:'admin',text:'Administrator'}
        ]
        // fix submit button functionality
        $scope.userCreate = function() {
            var new_user_data = {
                first_name: $scope.first_name,
                last_name: $scope.last_name,
                username: $scope.username,
                email: $scope.email,
                password: $scope.password,
                // ADD ROLE IN CREATION EVENT
                roles: [$scope.role_select],
                address: [$scope.address],
                language: [$scope.language]
            };

            nrgiUserMethodSrvc.createUser(new_user_data).then(function() {
                nrgiNotifier.notify('User account created!');
                $location.path('/admin/user-admin');
            }, function(reason) {
                nrgiNotifier.error(reason);
            })
        };
    });