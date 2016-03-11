angular.module('app')
    .controller('nrgiCommodityAdminCreateCtrl', function(
        $scope,
        $location,
        nrgiNotifier,
        nrgiIdentitySrvc,
        nrgiCommoditiesMethodSrvc
    ) {
        $scope.commodity =[];
        $scope.commodityCreate = function() {
            nrgiCommoditiesMethodSrvc.createCommodity($scope.commodity).then(function() {
                nrgiNotifier.notify('Commodity created!');
            }, function(reason) {
                nrgiNotifier.error(reason);
            })
        };
    });