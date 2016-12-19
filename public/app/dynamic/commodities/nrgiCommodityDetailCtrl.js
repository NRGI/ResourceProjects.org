'use strict';

angular.module('app')
    .controller('nrgiCommodityDetailCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiCommoditiesSrvc,
        $routeParams

    ) {
        nrgiCommoditiesSrvc.get({_id: $routeParams.id}, function (response) {
            $scope.commodity=response.commodity;
            $scope.id=response.commodity._id;
        });
    });
