angular.module('app')
    .controller('nrgiGroupAdminUpdateCtrl', function(
        $scope,
        $routeParams,
        $location,
        nrgiNotifier,
        nrgiGroupsMethodSrvc,
        nrgiGroupsSrvc

    ) {
        $scope.group = nrgiGroupsSrvc.get({_id:$routeParams.id});
        $scope.groupUpdate = function() {
            nrgiGroupsMethodSrvc.updateGroup($scope.group).then(function() {
                nrgiNotifier.notify('Company group has been updated');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };

        $scope.groupDelete = function() {
            var group_deletion = $scope.group._id;
            nrgiGroupsMethodSrvc.deleteGroup(group_deletion).then(function() {
                nrgiNotifier.notify('Company group has been deleted');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };
    });