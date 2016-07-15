'use strict';

angular
    .module('app')
    .controller('nrgiTransferTableCtrl', function ($scope,nrgiTransferTablesSrvc,usSpinnerService) {
        $scope.transfers=[];
        $scope.loading=false;
        $scope.openClose=true;
        $scope.csv_transfers = [];
        var header_transfer = [];
        $scope.expression='';
        var fields = [];
        var country_name = '';
        var company_name = '';
        usSpinnerService.spin('spinner-payments');
        $scope.$watch('id', function(value) {
            if(value!=undefined){
                $scope.loading = false;
                $scope.getTransfers($scope.id, $scope.type);
            }
        });
        $scope.getTransfers=function(id,type) {
            if ($scope.id != undefined) {
                if ($scope.openClose == true) {
                    if ($scope.transfers.length == 0 || $scope.loading == false) {
                        $scope.loading = true;
                        nrgiTransferTablesSrvc.get({
                            _id: id,
                            type: type
                        }, function (success) {
                            $scope.expression='';
                            if (success.transfers.length == 0 && $scope.transfers.length == 0) {
                                $scope.expression = 'showLast';
                            }
                            $scope.transfers=success.transfers;
                            usSpinnerService.stop('spinner-payments');
                            var headers = [
                                {name: 'Year', status: true, field: 'transfer_year'},
                                {name: 'Project', status: $scope.project, field: 'company'},
                                {name: 'Paid by', status: !$scope.project, field: 'company'},
                                {name: 'Paid to', status: true, field: 'country'},
                                {name: 'Payment Type', status: true, field: 'transfer_type'},
                                {name: 'Currency', status: true, field: 'transfer_unit'},
                                {name: 'Value ', status: true, field: 'transfer_value'},
                                {name: 'Level ', status: true, field: 'transfer_level'},
                                {name: 'Payment or receipt?', status: true, field: 'transfer_audit_type'},
                                {name: 'Project ID', status: $scope.project, field: 'proj_id'},
                                {name: 'Project / Site', status: $scope.project, field: 'proj_site'}];
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
                                        country_name = '';
                                        if (transfer[field] != undefined) {
                                            country_name = transfer[field].name.toString();
                                            country_name = country_name.charAt(0).toUpperCase() + country_name.substr(1);
                                        }
                                        $scope.csv_transfers[key].push(country_name);
                                    }
                                    if (field == 'company') {
                                        company_name = '';
                                        if (transfer[field] != undefined) {
                                            company_name = transfer[field].company_name.toString();
                                            company_name = company_name.charAt(0).toUpperCase() + company_name.substr(1);
                                        }
                                        $scope.csv_transfers[key].push(company_name);
                                    }
                                    if (field == 'proj_site') {
                                        name = '';
                                        if (transfer[field] != undefined && transfer[field].name !=undefined) {
                                            var name = transfer[field].name.toString();
                                        }
                                        $scope.csv_transfers[key].push(name)
                                    }
                                    if (field == 'proj_id') {
                                        id = '';
                                        console.log(transfer)
                                        if (transfer.proj_site != undefined && transfer.proj_site._id != undefined && transfer.transfer_level =='project') {
                                            id = transfer.proj_site._id.toString();
                                        }
                                        $scope.csv_transfers[key].push(id);
                                    }
                                    if (field != 'company' && field != 'country'&& field != 'proj_site' && field != 'proj_id') {
                                        $scope.csv_transfers[key].push(transfer[field])
                                    }
                                })
                            });
                        }, function(error){
                            usSpinnerService.stop('spinner-payments');
                        })
                    }
                }
            }
        }
        //}
    });
