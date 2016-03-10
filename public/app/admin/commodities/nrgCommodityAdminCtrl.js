angular.module('app')
    .controller('nrgiCommodityAdminCtrl', function($scope, nrgiCommoditiesSrvc) {
        nrgiCommoditiesSrvc.query({skip: 0, limit: 0}, function (response) {
            $scope.commodities = response.data;
        })
    });