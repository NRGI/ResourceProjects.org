'use strict';
angular.module('app').controller('nrgiProductionTableCtrl', function ($scope,nrgiProdTablesSrvc,usSpinnerService) {
    $scope.production = [];
    $scope.loading = false;
    $scope.openClose = true;
    $scope.csv_production = [];
    var header_transfer = [];
    $scope.expression='';
    var fields = [];
    var commodity='';
    var name='';
    var id='';
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

                        var headers = [
                            {name: 'Year', status: true, field: 'production_year'},
                            {name: 'Volume', status: true, field: 'production_volume'},
                            {name: 'Unit', status: true, field: 'production_unit'},
                            {name: 'Commodity', status: true, field: 'production_commodity'},
                            {name: 'Price', status: true, field: 'production_price'},
                            {name: 'Price unit', status: true, field: 'production_price_unit'},
                            {name: 'Level ', status: true, field: 'production_level'},
                            {name: 'Project ID', status: $scope.projectlink, field: 'proj_id'},
                            {name: 'Project / Site ', status: $scope.projectlink, field: 'proj_site'}];
                        angular.forEach(headers, function (header) {
                            if (header.status != false && header.status != undefined) {
                                header_transfer.push(header.name);
                                fields.push(header.field);
                            }
                        });
                        $scope.getHeaderProduction = function () {
                            return header_transfer
                        };
                        angular.forEach($scope.production, function (p, key) {
                            $scope.csv_production[key] = [];
                            angular.forEach(fields, function (field) {
                                if (field == 'commodity') {
                                    commodity = '';
                                    if (p[field] != undefined) {
                                        commodity = p[field].commodity_name
                                    }
                                    $scope.csv_production[key].push(commodity);
                                }
                                if (field == 'proj_id') {
                                    id = '';
                                    if (p.proj_site != undefined && p.proj_site._id != undefined && p.production_level =='project') {
                                        id = p.proj_site._id.toString();
                                    }
                                    $scope.csv_production[key].push(id);
                                }
                                if (field == 'proj_site') {
                                    name = '';
                                    if (p[field] != undefined && p[field].name != undefined) {
                                        name = p[field].name.toString();
                                    }
                                    $scope.csv_production[key].push(name);
                                }
                                if (field != 'commodity' && field != 'proj_site' && field != 'proj_id') {
                                    $scope.csv_production[key].push(p[field])
                                }
                            })
                        });
                    }, function(error){
                        usSpinnerService.stop('spinner-production');
                    })
                }
            }
        }
    }
});