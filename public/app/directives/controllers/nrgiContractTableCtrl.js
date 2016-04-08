'use strict';

angular.module('app').controller('nrgiContractTableCtrl', function ($scope,nrgiContractTablesSrvc) {
    $scope.contracts=[];
    $scope.getData=function(id,type) {
        console.log(id,type,$scope.contracts.length)
        if ($scope.contracts.length == 0) {
            nrgiContractTablesSrvc.get({_id: id, type: type}, function (success) {
                $scope.contracts=success.contracts;
                $scope.csv_contracts =[]; var header_contracts=[]; var fields=[];
                var headers = [{name:'Name',status:!$scope.companies,field:'contract_name'},
                    {name:'RC-ID',status:$scope.companies,field:'_id'},
                    {name:'Country ',status:$scope.country,field:'contract_country'},
                    {name:'Commodity ',status:$scope.commodity,field:'contract_commodity'},
                    {name:'RC-ID ',status:!$scope.companies,field:'_id'},
                    {name:'No. Companies ',status:$scope.companies,field:'companies'}];
                angular.forEach(headers, function(header) {
                    if(header.status!=false&&header.status!= undefined){
                        header_contracts.push(header.name);
                        fields.push(header.field);
                    }
                });
                $scope.getHeaderContracts = function () {return header_contracts};
                angular.forEach($scope.contracts, function(contract,key) {
                    $scope.csv_contracts[key] = [];
                    angular.forEach(fields, function(field) {
                        if (field == 'contract_country') {
                            var country_name = contract[field].name.toString();
                            country_name = country_name.charAt(0).toUpperCase() + country_name.substr(1);
                            $scope.csv_contracts[key].push(country_name);
                        }
                        if(field != 'contract_country'){
                            $scope.csv_contracts[key].push(contract[field]);
                        }
                    });
                })
            })
        }
    }
});



