angular.module('app')
    .controller('nrgiGroupAdminCreateCtrl', function(
        $scope,
        $location,
        nrgiNotifier,
        nrgiIdentitySrvc,
        nrgiCountriesSrvc,
        nrgiGroupsMethodSrvc
    ) {
        $scope.group =[];
        $scope.country = nrgiCountriesSrvc.query({skip: 0, limit: 0});
        $scope.groupCreate = function() {
            nrgiGroupsMethodSrvc.createGroup($scope.group).then(function() {
                nrgiNotifier.notify('Company group created!');
            }, function(reason) {
                nrgiNotifier.error(reason);
            })
        };
    });