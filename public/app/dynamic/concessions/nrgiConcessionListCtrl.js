'use strict';

angular.module('app')
    .controller('nrgiConcessionListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiConcessionsSrvc,
        $filter
    ) {

        var limit = 50,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.busy = false;

        var country_name, status,timestamp, commodity_type,commodity_name,str;
        var com = ', ';
        $scope.csv_concessions = [];
        var fields = ['concession_name', 'concession_country', 'commodity_type', 'concession_commodity', 'concession_status', 'project_count', 'site_count', 'field_count', 'transfer_count', 'production_count'];
        var header_concessions = ['Name', 'Country', 'Commodity Type', 'Commodity', 'Status', 'Projects', 'Sites', 'Fields', 'Payment records', 'Production records'];
        $scope.getHeaderConcessions = function () {
            return header_concessions
        };

        $scope.createDownloadList = function (concessions) {
            angular.forEach(concessions, function (concession, key) {
                $scope.csv_concessions[key] = [];
                angular.forEach(fields, function (field) {
                    if (field == 'concession_country') {
                        if(concession[field]!=undefined&&concession[field].length > 0) {
                            str = '';
                            angular.forEach(concession[field], function (country, i) {
                                country_name = '';
                                if (country != undefined && country.name) {
                                    country_name = country.name.toString();
                                    country_name = country_name.charAt(0).toUpperCase() + country_name.substr(1);
                                }
                                if (i != concession[field].length - 1 && country_name != '') {
                                    str = str + country_name + com;
                                } else {
                                    str = str + country_name;
                                    $scope.csv_concessions[key].push(str);
                                }

                            });
                        } else {
                            $scope.csv_concessions[key].push('')
                        }
                    }
                    if (field == 'concession_commodity') {
                        if(concession[field]!=undefined&&concession[field].length > 0) {
                            str = '';
                            concession[field] = _.map(_.groupBy(concession[field],function(doc){
                                if(doc && doc.commodity_name) {
                                    return doc.commodity_name;
                                }
                            }),function(grouped){
                                return grouped[0];
                            });
                            angular.forEach(concession[field], function (commodity, i) {
                                commodity_name = '';
                                if (commodity != undefined && commodity.commodity_name) {
                                    commodity_name = commodity.commodity_name.toString();
                                    commodity_name = commodity_name.charAt(0).toUpperCase() + commodity_name.substr(1);
                                }
                                if (i != concession[field].length - 1 && commodity_name != '') {
                                    str = str + commodity_name + com;
                                } else {
                                    str = str + commodity_name;
                                    $scope.csv_concessions[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_concessions[key].push('')
                        }
                    }
                    if (field == 'concession_status') {
                        if(concession[field]!=undefined&&concession[field].length > 0) {
                            str = '';
                            angular.forEach(concession[field], function (concession_status, i) {
                                status = '';
                                if (concession_status != undefined) {
                                    status = concession_status.string.toString();
                                    status = status.charAt(0).toUpperCase() + status.substr(1);
                                    timestamp = $filter('date')(concession_status.timestamp,'MM/dd/yyyy @ h:mma');
                                    str = status + '(true at '+timestamp+')';
                                    $scope.csv_concessions[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_concessions[key].push('')
                        }
                    }
                    if (field == 'commodity_type') {
                        if(concession['concession_commodity']!=undefined&&concession['concession_commodity'].length > 0) {
                            str = '';
                            concession['concession_commodity'] = _.map(_.groupBy(concession['concession_commodity'],function(doc){
                                if(doc && doc.commodity_type) {
                                    return doc.commodity_type;
                                }
                            }),function(grouped){
                                return grouped[0];
                            });
                            angular.forEach(concession['concession_commodity'], function (commodity, i) {
                                commodity_type = '';
                                if (commodity != undefined && commodity.commodity_type) {
                                    commodity_type = commodity.commodity_type.toString();
                                    commodity_type = commodity_type.charAt(0).toUpperCase() + commodity_type.substr(1);
                                }
                                if (i != concession['concession_commodity'].length - 1 && commodity_type != '') {
                                    str = str + commodity_type + com;
                                } else {
                                    str = str + commodity_type;
                                    $scope.csv_concessions[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_concessions[key].push('')
                        }
                    }
                    if (field != 'concession_country'&&field != 'commodity_type'&&field != 'concession_commodity'&&field != 'concession_status') {
                        $scope.csv_concessions[key].push(concession[field])
                    }
                })
            });
        };

        nrgiConcessionsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.concessions = response.concessions;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
            $scope.createDownloadList($scope.concessions);
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiConcessionsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
                    $scope.concessions = _.union($scope.concessions, response.concessions);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                    $scope.createDownloadList($scope.concessions);
                });
            }
        };
    });
