'use strict';

angular.module('app').controller('nrgiContractTableCtrl', function ($scope,nrgiContractTablesSrvc,usSpinnerService) {
    $scope.openClose=false;
    $scope.limit = 50;
    $scope.page = 0;
    $scope.loading = false;
    $scope.expression='';
    $scope.contracts=[];
    $scope.csv_contracts = [];
    var country_name='';
    var header_contracts = [];
    var fields = [];
    usSpinnerService.spin('spinner-contract');
    $scope.loadMoreContracts=function() {
        if($scope.loading==false) {
            usSpinnerService.spin('spinner-contract');
            $scope.page = $scope.page+$scope.limit;
            $scope.getContracts($scope.id, $scope.type);
        }
    };
    $scope.getContracts=function(id,type) {
        if ($scope.openClose == true) {
            if ($scope.contracts.length==0||$scope.loading == false) {
                $scope.loading = true;
                nrgiContractTablesSrvc.get({
                    _id: id,
                    type: type,
                    skip: $scope.page,
                    limit: $scope.limit
                }, function (success) {
                    if(success.contracts.length==0){
                        $scope.expression = 'showLast';
                    }
                    if (success.contracts.length > 0) {
                        _.each(success.contracts, function (contract) {
                            $scope.contracts.push(contract);
                        });
                    }
                    usSpinnerService.stop('spinner-contract');
                    if (success.contracts.length < $scope.limit) {
                        $scope.loading = true;
                    } else {
                        $scope.loading = false;
                    }
                    var headers = [{name: 'Name', status: !$scope.companies, field: 'contract_name'},
                        {name: 'RC-ID', status: $scope.companies, field: '_id'},
                        {name: 'Country ', status: $scope.country, field: 'contract_country'},
                        {name: 'Commodity ', status: $scope.commodity, field: 'contract_commodity'},
                        {name: 'RC-ID ', status: !$scope.companies, field: '_id'},
                        {name: 'No. Companies ', status: $scope.companies, field: 'companies'}];
                    angular.forEach(headers, function (header) {
                        if (header.status != false && header.status != undefined) {
                            header_contracts.push(header.name);
                            fields.push(header.field);
                        }
                    });
                    $scope.getHeaderContracts = function () {
                        return header_contracts
                    };
                    angular.forEach($scope.contracts, function (contract, key) {
                        $scope.csv_contracts[key] = [];
                        angular.forEach(fields, function (field) {
                            if (field == 'contract_country') {
                                country_name='';
                                if(contract[field]!= undefined) {
                                    country_name = contract[field].name.toString();
                                    country_name = country_name.charAt(0).toUpperCase() + country_name.substr(1);
                                }
                                $scope.csv_contracts[key].push(country_name);
                            }
                            if (field != 'contract_country') {
                                $scope.csv_contracts[key].push(contract[field]);
                            }
                        });
                    })
                })
            }
        }
    }
});



