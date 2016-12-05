'use strict';

angular.module('app').controller('nrgiContractTableCtrl', function ($scope,nrgiContractTablesSrvc,usSpinnerService, $filter) {
    $scope.openClose=true;
    $scope.loading = false;
    $scope.contracts=[];
    $scope.expression='';
    $scope.csv_contracts = [];
    var countryName='';
    var commodityName='';
    var headerContracts = [];
    var fields = [];
    usSpinnerService.spin('spinner-contract');
    $scope.$watch('id', function(value) {
        if(value!=undefined){
            $scope.loading = false;
            setTimeout(function(){
            $scope.getContracts($scope.id, $scope.type);},2000)
        }
    });
    $scope.getContracts=function(id,type) {
        if ($scope.id != undefined) {
            if ($scope.openClose == true) {
                if ($scope.contracts.length == 0 || $scope.loading == false) {
                    $scope.loading = true;
                    nrgiContractTablesSrvc.get({
                        _id: id,
                        type: type
                    }, function (success) {
                        $scope.expression='';
                        $scope.contracts =success.contracts;
                        if (success.contracts.length == 0 || _.isEmpty(success.contracts[0])) {
                            $scope.expression = 'showLast';
                            $scope.contracts = [];
                        }
                        usSpinnerService.stop('spinner-contract');
                        var headers = [{name: 'Name', status: !$scope.companies, field: 'contract_name'},
                            {name: 'RC-ID', status: $scope.companies, field: '_id'},
                            {name: 'Country ', status: $scope.country, field: 'contract_country'},
                            {name: 'Commodity ', status: $scope.commodity, field: 'contract_commodity'},
                            {name: 'RC-ID ', status: !$scope.companies, field: '_id'},
                            {name: 'No. Companies ', status: $scope.companies, field: 'companies'}];
                        angular.forEach(headers, function (header) {
                            if (header.status != false && header.status != undefined) {
                                headerContracts.push(header.name);
                                fields.push(header.field);
                            }
                        });
                        $scope.getHeaderContracts = function () {
                            return headerContracts
                        };
                        angular.forEach($scope.contracts, function (contract, key) {
                            $scope.csv_contracts[key] = [];
                            angular.forEach(fields, function (field) {
                                if (field == 'contract_country') {
                                    countryName = '';
                                    if (contract[field] != undefined) {
                                        countryName = contract[field].name.toString();
                                        countryName = countryName.charAt(0).toUpperCase() + countryName.substr(1);
                                    }
                                    $scope.csv_contracts[key].push(countryName);
                                }
                                if(field =='contract_commodity'){
                                    commodityName = '';
                                    if (contract[field] != undefined) {
                                        commodityName = $filter('addSpace')(contract[field].toString())
                                    }
                                    $scope.csv_contracts[key].push(commodityName);
                                }
                                if (field != 'contract_country' && field !='contract_commodity') {
                                    $scope.csv_contracts[key].push(contract[field]);
                                }
                            });
                        })
                    }, function(error){
                        console.log(error)
                        usSpinnerService.stop('spinner-contract');
                    })
                }
            }
        }
    }
});



