'use strict';

angular.module('app')
    .controller('nrgiContractListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        $sce,
        nrgiContractsSrvc
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0;
            //_ = $rootScope._;

        $scope.count =0;
        $scope.busy = false;

        var contract_country, contract_type, commodity_type,commodity_name,str;
        var com = ', ';
        $scope.csv_contracts = [];
        var fields = ['contract_id', 'rc_info', 'contract_type', 'commodity_type', 'commodity', 'projects', 'sites', 'fields'];
        var header_contracts = ['RC-ID', 'Country', 'Contract Type', 'Commodity Type', 'Commodity', 'Projects', 'Sites', 'Fields'];
        $scope.getHeaderContracts = function () {
            return header_contracts
        };

        nrgiContractsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.contracts = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
            $scope.createDownloadList($scope.contracts);
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiContractsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
                    $scope.contracts = _.union($scope.contracts, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                    $scope.createDownloadList($scope.contracts);
                });
            }
        };
        $scope.createDownloadList = function (contracts) {
            angular.forEach(contracts, function (contract, key) {
                $scope.csv_contracts[key] = [];
                angular.forEach(fields, function (field) {
                    if (field == 'rc_info') {
                        if(contract[field]!=undefined&&contract[field].length > 0) {
                            str = '';
                            angular.forEach(contract[field], function (rc_info, i) {
                                contract_country = '';
                                if (rc_info != undefined&&rc_info.contract_country!=undefined) {
                                    contract_country = rc_info.contract_country.name.toString();
                                    contract_country = contract_country.charAt(0).toUpperCase() + contract_country.substr(1);
                                }
                                if (i != contract[field].length - 1 && contract_country != '') {
                                    str = str + contract_country + com;
                                } else {
                                    str = str + contract_country;
                                    $scope.csv_contracts[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_contracts[key].push('')
                        }
                    }
                    if (field == 'contract_type') {
                        if(contract['rc_info']!=undefined&&contract['rc_info'].length > 0) {
                            str = '';
                            angular.forEach(contract['rc_info'], function (rc_info, i) {
                                contract_type = '';
                                if (rc_info != undefined&&rc_info.contract_type!=undefined) {
                                    contract_type = rc_info.contract_type.toString();
                                    contract_type = contract_type.charAt(0).toUpperCase() + contract_type.substr(1);
                                }
                                if (i != contract['rc_info'].length - 1 && contract_type != '') {
                                    str = str + contract_type + com;
                                } else {
                                    str = str + contract_type;
                                    $scope.csv_contracts[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_contracts[key].push('')
                        }
                    }
                    if (field == 'commodity_type') {
                        if(contract['commodity']!=undefined&&contract['commodity'].length > 0) {
                            str = '';
                            contract['commodity'] = _.map(_.groupBy(contract['commodity'],function(doc){
                                return doc.commodity_type;
                            }),function(grouped){
                                return grouped[0];
                            });
                            angular.forEach(contract['commodity'], function (commodity, i) {
                                commodity_type = '';
                                if (commodity != undefined&&commodity.commodity_type!=undefined) {
                                    commodity_type = commodity.commodity_type.toString();
                                    commodity_type = commodity_type.charAt(0).toUpperCase() + commodity_type.substr(1);
                                }
                                if (i != contract['commodity'].length - 1 && commodity_type != '') {
                                    str = str + commodity_type + com;
                                } else {
                                    str = str + commodity_type;
                                    $scope.csv_contracts[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_contracts[key].push('')
                        }
                    }
                    if (field == 'commodity') {
                        if(contract[field]!=undefined&&contract[field].length > 0) {
                            str = '';
                            contract[field] = _.map(_.groupBy(contract[field],function(doc){
                                return doc.commodity_name;
                            }),function(grouped){
                                return grouped[0];
                            });
                            angular.forEach(contract[field], function (commodity, i) {
                                commodity_name = '';
                                if (commodity != undefined&&commodity.commodity_type!=undefined) {
                                    commodity_name = commodity.commodity_name.toString();
                                    commodity_name = commodity_name.charAt(0).toUpperCase() + commodity_name.substr(1);
                                }
                                if (i != contract[field].length - 1 && commodity_name != '') {
                                    str = str + commodity_name + com;
                                } else {
                                    str = str + commodity_name;
                                    $scope.csv_contracts[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_contracts[key].push('')
                        }
                    }
                    if (field != 'rc_info' && field != 'contract_type' && field != 'commodity_type' && field != 'commodity') {
                        $scope.csv_contracts[key].push(contract[field])
                    }
                })
            });
        };
    });
