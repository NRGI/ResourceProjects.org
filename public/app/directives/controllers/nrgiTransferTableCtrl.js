'use strict';

angular
    .module('app')
    .controller('nrgiTransferTableCtrl', function ($scope,nrgiTransferTablesSrvc,usSpinnerService, nrgiCSV) {
        $scope.transfers=[];
        $scope.loading=false;
        $scope.openClose=true;
        var headerTransfer = [];
        $scope.expression='';
        var fields = [];
        var limit = 50,
            currentPage = 0;
        var headers = [
            {name: 'Year', status: true, field: 'transfer_year'},
            {name: 'Paid by', status: true, field: 'company'},
            {name: 'Paid to', status: true, field: 'country'},
            {name: 'Project', status: true, field: 'proj_site'},
            {name: 'Project ID', status: true, field: 'proj_site_id'},
            {name: 'Level ', status: true, field: 'proj_site_type'},
            {name: 'Payment Type', status: true, field: 'transfer_type'},
            {name: 'Currency', status: true, field: 'transfer_unit'},
            {name: 'Value ', status: true, field: 'transfer_value'}];
        angular.forEach(headers, function (header) {
            if (header.status != false && header.status != undefined) {
                headerTransfer.push(header.name);
                fields.push(header.field);
            }
        });
        $scope.getHeaderTransfers = function () {
            return headerTransfer
        };

        usSpinnerService.spin('spinner-transfers');
        $scope.$watch('id', function(value) {
            if ($scope.type == 'country' && value == undefined || $scope.type == 'company' && value == undefined || $scope.type == 'site' && value == undefined) {
                usSpinnerService.stop('spinner-transfers');
                $scope.expression = 'showLast';
            }
            if ($scope.type == 'country' && value != undefined || $scope.type == 'company' && value != undefined|| $scope.type == 'site' && value != undefined) {
                $scope.transfers = value;
                usSpinnerService.stop('spinner-transfers');
                if ($scope.transfers.length == 0 ) {
                    $scope.expression = 'showLast';
                }else {
                    $scope.busy = false;
                    currentPage = 1;
                }
            }
            if ($scope.type != 'country' && value != undefined && $scope.type!= 'company'&& $scope.type!= 'site') {
                $scope.loading = false;
                $scope.getTransfers($scope.id, $scope.type);
            }
        });

        $scope.loadMoreTransfers = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            nrgiTransferTablesSrvc.query({_id: $scope.countryid,
                type: $scope.type,skip: currentPage*limit, limit: limit}, function (response) {
                $scope.transfers = _.union($scope.transfers, response.transfers);
                if( response.transfers.length>49){
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                }else{
                    $scope.busy = true;
                }
            });
        };

        $scope.loadPaymentsCSV = function() {
            nrgiCSV.setCsv(fields,$scope.transfers)
            return nrgiCSV.getResult()
        };
        $scope.getAllPayments = function() {
            if($scope.busy == true && $scope.transfers.length>49 || $scope.transfers.length<49) {
                setTimeout(function () {angular.element(document.getElementById("loadPaymentCSV")).trigger('click');},0)
            } else {
                nrgiTransferTablesSrvc.query({
                    _id: $scope.countryid,
                    type: $scope.type, skip: 0, limit: 5000000
                }, function (data) {
                    $scope.transfers = data.transfers
                    $scope.busy = true;
                    setTimeout(function () {angular.element(document.getElementById("loadPaymentCSV")).trigger('click');},0)
                })
            }
        }

        $scope.getTransfers=function(id,type) {
            if ($scope.id != undefined) {
                if ($scope.openClose == true) {
                    if ($scope.transfers.length == 0 || $scope.loading == false) {
                        $scope.loading = true;
                        nrgiTransferTablesSrvc.get({
                            _id: id,
                            type: type,
                            skip: currentPage*limit,
                            limit: limit
                        }, function (success) {
                            $scope.expression = '';
                            if (success.transfers.length == 0 && $scope.transfers.length == 0) {
                                $scope.expression = 'showLast';
                            }
                            $scope.transfers = success.transfers;
                            usSpinnerService.stop('spinner-transfers');
                        }, function (error) {
                            console.log(error)
                            usSpinnerService.stop('spinner-transfers');
                        })
                    }
                }
            }
        }
    });
