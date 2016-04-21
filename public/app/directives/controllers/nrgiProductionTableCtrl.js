'use strict';
angular.module('app').controller('nrgiProductionTableCtrl', function ($scope,nrgiProdTablesSrvc,usSpinnerService) {
    $scope.production = [];
    $scope.loading = false;
    $scope.openClose = true;
    $scope.csv_production = [];
    $scope.expression='';
    var commodity='';
    usSpinnerService.spin('spinner-production');
    $scope.$watch('id', function(value) {
        if(value!=undefined){
            $scope.loading = false;
            $scope.getProduction($scope.id, $scope.type);
        }
    });
    $scope.getProduction = function (id, type) {
        if ($scope.id != undefined) {
            if ($scope.openClose == true) {
                if ($scope.production.length == 0 || $scope.loading == false) {
                    $scope.loading = true;
                    nrgiProdTablesSrvc.get({
                        _id: id,
                        type: type
                    }, function (success) {
                        $scope.expression='';
                        if (success.production.length == 0 && $scope.production.length == 0) {
                            $scope.expression = 'showLast';
                        }
                        $scope.production=success.production;
                        usSpinnerService.stop('spinner-production');
                        $scope.getHeaderProduction = function () {
                            return ['Year', 'Volume', 'Unit', 'Commodity', 'Price', 'Price unit', 'Level']
                        };
                        angular.forEach($scope.production, function (p) {
                            if (p.production_commodity != undefined) {
                                commodity = p.production_commodity.commodity_name
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
                    }, function(error){
                        usSpinnerService.stop('spinner-production');
                    })
                }
            }
        }
    }
});