angular.module('app')
    .controller('nrgiCommodityAdminUpdateCtrl', function(
        $scope,
        $routeParams,
        $location,
        nrgiNotifier,
        nrgiCommoditiesMethodSrvc,
        nrgiCommoditiesSrvc

    ) {
        $scope.commodity = nrgiCommoditiesSrvc.get({_id:$routeParams.id});
        $scope.commodityUpdate = function() {
            nrgiCommoditiesMethodSrvc.updateCommodity($scope.commodity).then(function() {
                nrgiNotifier.notify('Commodity has been updated');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };

        $scope.commodityDelete = function() {
            var commodity_deletion = $scope.commodity._id;
            nrgiCommoditiesMethodSrvc.deleteCommodity(commodity_deletion).then(function() {
                nrgiNotifier.notify('Commodity has been deleted');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };
    });