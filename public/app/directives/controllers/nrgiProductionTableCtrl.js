'use strict';
angular.module('app').controller('nrgiProductionTableCtrl', function ($scope,nrgiProdTablesSrvc) {
    $scope.production = [];
    $scope.loading = false;
    $scope.openClose = false;
    $scope.limit = 50;
    $scope.page = 0;
    var commodity='';
    $scope.loadMoreProduction = function () {
        if ($scope.loading == false) {
            $scope.page = $scope.page+$scope.limit;
            $scope.getProduction($scope.id, $scope.type);
        }
    };
    $scope.getProduction = function (id, type) {
        if ($scope.openClose == true) {
            if ($scope.production.length == 0 || $scope.loading == false) {
                $scope.loading = true;
                nrgiProdTablesSrvc.get({_id: id, type: type, skip: $scope.page, limit: $scope.limit}, function (success) {
                    if (success.production.length > 0) {
                        _.each(success.production, function (production) {
                            $scope.production.push(production);
                        });
                    }
                    if (success.production.length < $scope.limit) {
                        $scope.loading = true;
                    } else {
                        $scope.loading = false;
                    }
                    $scope.csv_production = [];
                    $scope.getHeaderProduction = function () {
                        return ['Year', 'Volume', 'Unit', 'Commodity', 'Price', 'Price unit', 'Level']
                    };
                    angular.forEach($scope.production, function (p) {
                        if(p.production_commodity.commodity_name!=undefined){
                            commodity=p.production_commodity.commodity_name
                        }
                        $scope.csv_production.push({
                            'year': p.production_year,
                            'volume': p.production_volume,
                            'unit': p.production_unit,
                            'commodity': commodity,
                            'price': p.production_price,
                            'price_unit': p.production_price_unit,
                            'level': p.production_level
                        });

                    })
                })
            }
        }
    }
});