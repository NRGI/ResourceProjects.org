angular.module('app')
    .controller('nrgiConcessionAdminUpdateCtrl', function(
        $scope,
        $routeParams,
        $location,
        nrgiNotifier,
        nrgiConcessionsMethodSrvc,
        nrgiConcessionsSrvc

    ) {
        $scope.concession = nrgiConcessionsSrvc.get({_id:$routeParams.id});
        $scope.concessionUpdate = function() {
            nrgiConcessionsMethodSrvc.updateConcession($scope.concession).then(function() {
                nrgiNotifier.notify('Concession has been updated');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };

        $scope.concessionDelete = function() {
            var concession_deletion = $scope.concession._id;
            nrgiConcessionsMethodSrvc.deleteConcession(concession_deletion).then(function() {
                nrgiNotifier.notify('Concession has been deleted');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };
    });