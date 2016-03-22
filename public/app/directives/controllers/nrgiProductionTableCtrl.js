'use strict';
angular.module('app').controller('nrgiProductionTableCtrl', function ($scope) {
    setTimeout(function(){
        $scope.csv_production =[];
        $scope.getHeaderProduction = function () {return ['Year', 'Volume', 'Unit', 'Commodity', 'Price', 'Price unit']};

        angular.forEach($scope.production, function(p) {
            $scope.csv_production.push({
                'year': p.production_year,
                'volume': p.production_volume,
                'unit': p.production_unit,
                'commodity': p.production_commodity.commodity_name,
                'price': p.production_price,
                'price_unit': p.production_price_unit
            });

        })
    },2000)
});