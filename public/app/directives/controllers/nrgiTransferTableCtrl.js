'use strict';

angular
    .module('app')
    .controller('nrgiTransferTableCtrl', function ($scope) {
        setTimeout(function(){
            $scope.csv_transfers =[];
            if($scope.project!=true){
                $scope.getHeaderTransfers = function () {return ['Year', 'Paid by', 'Paid to', 'Payment Type', 'Currency', 'Value', 'Payment or receipt?']};
                angular.forEach($scope.transfers, function(transfer) {
                    $scope.csv_transfers.push({
                        'year': transfer.transfer_year,
                        'transfer_company': transfer.transfer_company.company_name,
                        'transfer_country': transfer.transfer_country.name,
                        'transfer_type': transfer.transfer_type,
                        'transfer_unit': transfer.transfer_unit,
                        'transfer_value': transfer.transfer_value,
                        'transfer_audit_type': transfer.transfer_audit_type
                    });
                })
            }else{
                $scope.getHeaderTransfers = function () {return ['Year', 'Project', 'Paid by', 'Payment Type', 'Currency', 'Value', 'Payment or receipt?']};
                angular.forEach($scope.transfers, function(transfer) {
                    $scope.csv_transfers.push({
                        'year': transfer.transfer_year,
                        'transfer_company': transfer.transfer_company.company_name,
                        'transfer_country': transfer.transfer_country.name,
                        'transfer_type': transfer.transfer_type,
                        'transfer_unit': transfer.transfer_unit,
                        'transfer_value': transfer.transfer_value,
                        'transfer_audit_type': transfer.transfer_audit_type
                    });
                })
            }

        },2000)
    });
