'use strict';
angular.module('app').controller('nrgiProductionTableCtrl', function ($scope,nrgiProdTablesSrvc,usSpinnerService,nrgiCSV) {
    $scope.production = [];
    $scope.loading = false;
    $scope.openClose = true;
    var headerTransfer = [];
    $scope.expression='';
    var fields = [];
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
            headerTransfer.push(header.name);
            fields.push(header.field);
        }
    });

    $scope.getHeaderProduction = function () {
        return headerTransfer
    };
    var limit = 50,
        currentPage = 0;
    usSpinnerService.spin('spinner-production');

    $scope.$watch('id', function(value) {
<<<<<<< HEAD
        if ($scope.type == 'country' && value == undefined || $scope.type == 'company' && value == undefined || $scope.type == 'site' && value == undefined) {
            usSpinnerService.stop('spinner-transfers');
            $scope.expression = 'showLast';
        }
        if ($scope.type == 'country' && value != undefined || $scope.type == 'company' && value != undefined || $scope.type == 'site' && value != undefined) {
=======
        if($scope.type=='country'&&value!=undefined) {
>>>>>>> fc8c34301d2c3ae0e57d70ab338b1dfa2caac5a4
            $scope.production = value;
            usSpinnerService.stop('spinner-production');
            if ($scope.production.length == 0 ) {
                $scope.expression = 'showLast';
            }else {
                $scope.busy = false;
                currentPage = 1;
            }
        }
<<<<<<< HEAD
        if ($scope.type != 'country' && value != undefined && $scope.type!= 'company' && $scope.type!= 'site') {
=======
        if($scope.type!='country'&&value!=undefined){
>>>>>>> fc8c34301d2c3ae0e57d70ab338b1dfa2caac5a4
            $scope.loading = false;
            $scope.getProduction($scope.id, $scope.type);
        }
    });

    $scope.loadMoreProductions = function() {
        if ($scope.busy) return;
        $scope.busy = true;
        nrgiProdTablesSrvc.query({_id: $scope.countryid,
            type: $scope.type,skip: currentPage*limit, limit: limit}, function (response) {
            $scope.production = _.union($scope.production, response.production);
            if( response.production.length>49){
                currentPage = currentPage + 1;
                $scope.busy = false;
            }else{
                $scope.busy = true;
            }
        });
    };

    $scope.loadProductionsCSV = function () {
        nrgiCSV.setCsv(fields, $scope.production)
        return nrgiCSV.getResult()
    };

    $scope.getAllProductions = function () {
        if ($scope.busy == true && $scope.production.length > 49 || $scope.production.length < 49) {
            setTimeout(function () {angular.element(document.getElementById("loadProductionCSV")).trigger('click');}, 0)
        } else {
            nrgiProdTablesSrvc.query({
                _id: $scope.countryid,
                type: $scope.type, skip: 0, limit: 5000000
            }, function (data) {
                $scope.production = data.production
                $scope.busy = true;
                setTimeout(function () {angular.element(document.getElementById("loadProductionCSV")).trigger('click');}, 0)
            })
        }
    }

    $scope.getProduction = function (id, type) {
        if ($scope.id != undefined) {
            if ($scope.openClose == true) {
                if ($scope.production.length == 0 || $scope.loading == false) {
                    $scope.loading = true;
                    nrgiProdTablesSrvc.get({
                        _id: id,
                        type: type,
                        skip: currentPage*limit,
                        limit: limit
                    }, function (success) {
                        $scope.expression='';
                        if (success.production.length == 0 && $scope.production.length == 0) {
                            $scope.expression = 'showLast';
                        }
                        $scope.production=success.production;
                        usSpinnerService.stop('spinner-production');

                    }, function(error){
                        console.log(error)
                        usSpinnerService.stop('spinner-production');
                    })
                }
            }
        }
    }
});