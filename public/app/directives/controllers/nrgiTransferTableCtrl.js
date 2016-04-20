'use strict';

angular
    .module('app')
    .controller('nrgiTransferTableCtrl', function ($scope,nrgiTransferTablesSrvc,usSpinnerService) {
        $scope.transfers=[];
        $scope.loading=false;
        $scope.openClose=false;
        $scope.limit = 50;
        $scope.page = 0;
        $scope.expression='';
        $scope.csv_transfers = [];
        var header_transfer = [];
        var fields = [];
        var country_name = '';
        var company_name = '';
        usSpinnerService.spin('spinner-payments');
        $scope.loadMoreTransfer=function() {
            if($scope.loading==false) {
                $scope.page = $scope.page+$scope.limit;
                usSpinnerService.spin('spinner-payments');
                $scope.getTransfers($scope.id, $scope.type);
            }
        };
        $scope.getTransfers=function(id,type) {
            if ($scope.openClose == true) {
                if ($scope.transfers.length == 0 || $scope.loading == false) {
                    $scope.loading = true;
                    nrgiTransferTablesSrvc.get({
                        _id: id,
                        type: type,
                        skip: $scope.page,
                        limit: $scope.limit
                    }, function (success) {
                        if(success.transfers.length==0){
                            $scope.expression = 'showLast';
                        }
                        if (success.transfers.length > 0) {
                            _.each(success.transfers, function (transfer) {
                                $scope.transfers.push(transfer);
                            });
                        }
                        usSpinnerService.stop('spinner-payments');
                        if (success.transfers.length < $scope.limit) {
                            $scope.loading = true;
                        } else {
                            $scope.loading = false;
                        }
                        var headers = [
                            {name: 'Year', status: true, field: 'transfer_year'},
                            {name: 'Project', status: $scope.project, field: 'company'},
                            {name: 'Paid by', status: !$scope.project, field: 'company'},
                            {name: 'Paid to', status: true, field: 'country'},
                            {name: 'Payment Type', status: true, field: 'transfer_type'},
                            {name: 'Currency', status: true, field: 'transfer_unit'},
                            {name: 'Value ', status: true, field: 'transfer_value'},
                            {name: 'Level ', status: true, field: 'transfer_level'},
                            {name: 'Payment or receipt?', status: true, field: 'transfer_audit_type'}];
                        angular.forEach(headers, function (header) {
                            if (header.status != false && header.status != undefined) {
                                header_transfer.push(header.name);
                                fields.push(header.field);
                            }
                        });
                        $scope.getHeaderTransfers = function () {
                            return header_transfer
                        };
                        angular.forEach($scope.transfers, function (transfer, key) {
                            $scope.csv_transfers[key] = [];
                            angular.forEach(fields, function (field) {
                                if (field == 'country') {
                                    country_name='';
                                    if(transfer[field]!=undefined) {
                                        country_name = transfer[field].name.toString();
                                        country_name = country_name.charAt(0).toUpperCase() + country_name.substr(1);
                                    }
                                    $scope.csv_transfers[key].push(country_name);
                                }
                                if (field == 'company') {
                                    company_name='';
                                    if(transfer[field]!=undefined) {
                                        company_name = transfer[field].company_name.toString();
                                        company_name = company_name.charAt(0).toUpperCase() + company_name.substr(1);
                                    }
                                    $scope.csv_transfers[key].push(company_name);
                                }
                                if (field != 'company' && field != 'country') {
                                    $scope.csv_transfers[key].push(transfer[field])
                                }
                            })
                        });
                    })
                }
            }
        };
        //}
    });
