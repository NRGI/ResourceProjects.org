angular.module('app')
    .controller('nrgiConcessionAdminUpdateCtrl', function(
        $scope,
        $routeParams,
        $location,
        nrgiNotifier,
        nrgiConcessionsMethodSrvc,
        nrgiConcessionsSrvc,
        nrgiCountriesSrvc

    ) {
        $scope.concession = nrgiConcessionsSrvc.get({_id:$routeParams.id});
        $scope.country = nrgiCountriesSrvc.query({skip: 0, limit: 0});
        $scope.concessionUpdate = function() {
            nrgiConcessionsMethodSrvc.updateConcession($scope.concession).then(function() {
                nrgiNotifier.notify('Concession has been updated');
                $location.path('/admin/concession-admin');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };

        $scope.concessionDelete = function() {
            var concession_deletion = $scope.concession._id;
            nrgiConcessionsMethodSrvc.deleteConcession(concession_deletion).then(function() {
                nrgiNotifier.notify('Concession has been deleted');
                $location.path('/admin/concession-admin');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };
    });