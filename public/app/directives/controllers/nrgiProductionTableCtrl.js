'use strict';
angular.module('app').controller('nrgiProductionTableCtrl', function ($scope,nrgiProdTablesSrvc) {
    $scope.production=[];
    $scope.getData=function(id,type) {
        if ($scope.production.length == 0) {
            nrgiProdTablesSrvc.get({_id: id, type: type}, function (success) {
                $scope.production = success.production;
                $scope.csv_production = [];
                $scope.getHeaderProduction = function () {
                    return ['Year', 'Volume', 'Unit', 'Commodity', 'Price', 'Price unit', 'Level']
                };
                angular.forEach($scope.production, function (p) {
                    $scope.csv_production.push({
                        'year': p.production_year,
                        'volume': p.production_volume,
                        'unit': p.production_unit,
                        'commodity': p.production_commodity.commodity_name,
                        'price': p.production_price,
                        'price_unit': p.production_price_unit,
                        'level': p.production_level
                    });

                })
            })
        }
    }
});