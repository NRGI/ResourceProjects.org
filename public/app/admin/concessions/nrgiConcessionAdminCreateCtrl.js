angular.module('app')
    .controller('nrgiConcessionAdminCreateCtrl', function(
        $scope,
        $location,
        nrgiNotifier,
        nrgiIdentitySrvc,
        nrgiCountriesSrvc,
        nrgiConcessionsMethodSrvc
    ) {
        $scope.concession =[];
        $scope.country = nrgiCountriesSrvc.query({skip: 0, limit: 0});
        $scope.concessionCreate = function() {
            nrgiConcessionsMethodSrvc.createConcession($scope.concession).then(function() {
                nrgiNotifier.notify('Concession created!');
            }, function(reason) {
                nrgiNotifier.error(reason);
            })
        };
    });