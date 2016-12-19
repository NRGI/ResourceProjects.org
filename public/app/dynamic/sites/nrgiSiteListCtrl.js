'use strict';

angular.module('app')
    .controller('nrgiSiteListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiSitesSrvc,
        $location,
        $filter
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0;
            //_ = $rootScope._;

        $scope.count =0;
        $scope.field = false;
        $scope.busy = false;

        if ($location.path()=='/sites') {
            $scope.field =false;
            $scope.record_type = 'sites';
            $scope.route = 'site';
            $scope.header = 'Sites';
        } else if ($location.path()=='/fields') {
            $scope.field =true;
            $scope.route = 'field';
            $scope.record_type = 'fields';
            $scope.header = 'Fields';
        }

        var country_name, str, commodity_type, commodity_name, timestamp, status, com =', ';
        $scope.csv_file = [];
        var fields = ['site_name', 'site_country', 'site_commodity_type', 'site_commodity','site_status', 'company_count', 'project_count', 'concession_count', 'transfer_count', 'production_count'];
        var header_projects = ['Name', 'Country', 'Commodity Type', 'Commodity', 'Status', 'Companies', 'Projects', 'Concessions', 'Payments', 'Production'];
        $scope.getHeader = function () {
            return header_projects
        };

        $scope.createDownloadList = function (sites) {
            angular.forEach(sites, function (site, key) {
                $scope.csv_file[key] = [];
                angular.forEach(fields, function (field) {
                    if (field == 'site_country') {
                        if(site[field]!=undefined&&site[field].length > 0) {
                            str = '';
                            angular.forEach(site[field], function (country, i) {
                                country_name = '';
                                if (country != undefined && country.country && country.country.name) {
                                    country_name = country.country.name.toString();
                                    country_name = country_name.charAt(0).toUpperCase() + country_name.substr(1);
                                }
                                if (i != site[field].length - 1 && country_name != '') {
                                    str = str + country_name + com;
                                } else {
                                    str = str + country_name;
                                    $scope.csv_file[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_file[key].push('')
                        }
                    }
                    if (field == 'site_commodity_type') {
                        if(site['site_commodity']!=undefined&&site['site_commodity'].length > 0) {
                            str = '';
                            site['site_commodity'] = _.map(_.groupBy(site['site_commodity'],function(doc){
                                if(doc && doc.commodity_type) {
                                    return doc.commodity_type;
                                }
                            }),function(grouped){
                                return grouped[0];
                            });
                            angular.forEach(site['site_commodity'], function (commodity, i) {
                                commodity_type = '';
                                if (commodity != undefined && commodity.commodity_type) {
                                    commodity_type = commodity.commodity_type.toString();
                                    commodity_type = commodity_type.charAt(0).toUpperCase() + commodity_type.substr(1);
                                }
                                if (i != site['site_commodity'].length - 1 && commodity_type != '') {
                                    str = str + commodity_type + com;
                                } else {
                                    str = str + commodity_type;
                                    $scope.csv_file[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_file[key].push('')
                        }
                    }
                    if (field == 'site_commodity') {
                        if(site[field]!=undefined&&site[field].length > 0) {
                            str = '';
                            site[field] = _.map(_.groupBy(site[field],function(doc) {
                                if (doc && doc.commodity_name) {
                                    return doc.commodity_name;
                                }
                            }),function(grouped){
                                return grouped[0];
                            });
                            angular.forEach(site[field], function (commodity, i) {
                                commodity_name = '';
                                if (commodity != undefined && commodity.commodity_name) {
                                    commodity_name = commodity.commodity_name.toString();
                                    commodity_name = commodity_name.charAt(0).toUpperCase() + commodity_name.substr(1);
                                }
                                if (i != site[field].length - 1 && commodity_name != '') {
                                    str = str + commodity_name + com;
                                } else {
                                    str = str + commodity_name;
                                    $scope.csv_file[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_file[key].push('')
                        }
                    }
                    if (field == 'site_status') {
                        if(site[field]!=undefined&&site[field].length > 0) {
                            str = '';
                            angular.forEach(site[field], function (site_status, i) {
                                status = '';
                                if (site_status != undefined) {
                                    status = site_status.string.toString();
                                    status = status.charAt(0).toUpperCase() + status.substr(1);
                                    timestamp = $filter('date')(site_status.timestamp,'MM/dd/yyyy @ h:mma');
                                    str = status + '(true at '+timestamp+')';
                                    $scope.csv_file[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_file[key].push('')
                        }
                    }
                    if(field != 'site_country' && field != 'site_commodity_type' && field != 'site_commodity' && field != 'site_status') {
                        $scope.csv_file[key].push(site[field])
                    }
                })
            });
        };

        nrgiSitesSrvc.query({skip: currentPage*limit, limit: limit, field: $scope.field}, function (response) {
            $scope.count = response.count;
            $scope.sites = response.sites;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
            $scope.createDownloadList($scope.sites);
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiSitesSrvc.query({skip: currentPage*limit, limit: limit, field: $scope.field}, function (response) {
                    $scope.sites = _.union($scope.sites, response.sites);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                    $scope.createDownloadList($scope.sites);
                });
            }
        };
    });