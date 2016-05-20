'use strict';

angular
    .module('app')
    .controller('nrgiSiteTableCtrl', function ($scope,$filter,nrgiSiteFieldTablesSrvc,usSpinnerService) {
        $scope.sites=[];
        $scope.openClose=true;
        $scope.loading = false;
        $scope.csv_site = [];
        $scope.expression='';
        var commodity_name='';
        var country_name ='';
        var header_site = [];
        var fields = [];
        var str;
        var com = ', ';
        usSpinnerService.spin('spinner-site');
        $scope.$watch('id', function(value) {
            if(value!=undefined){
                $scope.loading = false;
                $scope.getSites($scope.id, $scope.name);
            }
        });
        $scope.getSites=function(id,type) {
            if ($scope.id != undefined) {
                if ($scope.openClose == true) {
                    if ($scope.sites.length == 0 || $scope.loading == false) {
                        $scope.loading = true;
                        nrgiSiteFieldTablesSrvc.get({
                            _id: id,
                            type: type
                        }, function (success) {
                            $scope.expression='';
                            if (success.sites.length == 0 && $scope.sites.length == 0) {
                                $scope.expression = 'showLast';
                            }
                            $scope.sites=success.sites;
                            usSpinnerService.stop('spinner-site');
                            var headers = [{name: 'Name', status: true, field: 'site_name'},
                                {name: 'Type', status: $scope.type, field: 'site_type'},
                                {name: 'Country', status: $scope.country, field: 'site_country'},
                                {name: 'Commodity Type ', status: $scope.commoditytype, field: 'site_commodity_type'},
                                {name: 'Commodity ', status: $scope.commodity, field: 'site_commodity'},
                                {name: 'Status ', status: $scope.status, field: 'site_status'},
                                {name: 'Companies ', status: $scope.company, field: 'companies'}];
                            angular.forEach(headers, function (header) {
                                if (header.status != false && header.status != undefined) {
                                    header_site.push(header.name);
                                    fields.push(header.field);
                                }
                            });
                            $scope.getHeaderSites = function () {
                                return header_site
                            };
                            angular.forEach($scope.sites, function (p, key) {
                                $scope.csv_site[key] = [];
                                angular.forEach(fields, function (field) {
                                    if (field == 'site_commodity') {
                                        if (p[field].length > 0) {
                                            str = '';
                                            var commodities = _.uniq(p.site_commodity, function (a) {
                                                return a.commodity._id;
                                            });
                                            angular.forEach(commodities, function (commodity, i) {
                                                commodity_name = '';
                                                if (commodity.commodity != undefined) {
                                                    commodity_name = commodity.commodity.commodity_name.toString();
                                                    commodity_name = commodity_name.charAt(0).toUpperCase() + commodity_name.substr(1);
                                                }
                                                if (i != commodities.length - 1) {
                                                    str = str + commodity_name + com;
                                                } else {
                                                    str = str + commodity_name;
                                                    $scope.csv_site[key].push(str);
                                                }
                                            })
                                        } else {
                                            $scope.csv_site[key].push('');
                                        }
                                    }
                                    if (field == 'site_status') {
                                        if (p[field].length > 0) {
                                            str = '';
                                            angular.forEach(p[field], function (status, i) {
                                                var date = new Date(status.timestamp);
                                                date = $filter('date')(date, "MM/dd/yyyy @ h:mma");
                                                var status_name = status.string.toString();
                                                status_name = status_name.charAt(0).toUpperCase() + status_name.substr(1);
                                                if (i != p[field].length - 1) {
                                                    str = str + status_name + '(true at ' + date + ')' + com;
                                                } else {
                                                    str = str + status_name + '(true at ' + date + ')';
                                                    $scope.csv_site[key].push(str);
                                                }
                                            })
                                        } else {
                                            $scope.csv_site[key].push('');
                                        }
                                    }
                                    if (field == 'site_country') {
                                        if (p[field].length > 0) {
                                            str = '';
                                            angular.forEach(p[field], function (country, i) {
                                                if (country.country != undefined) {
                                                    country_name = country.country.name.toString();
                                                    country_name = country_name.charAt(0).toUpperCase() + country_name.substr(1);
                                                }
                                                if (i != p[field].length - 1) {
                                                    str = str + country_name + com;
                                                } else {
                                                    str = str + country_name;
                                                    $scope.csv_site[key].push(str);
                                                }
                                            })
                                        } else {
                                            $scope.csv_site[key].push('');
                                        }
                                    }
                                    if (field == 'site_commodity_type') {
                                        if (p.site_commodity.length > 0) {
                                            str = '';
                                            var commodity_type = _.uniq(p.site_commodity, function (a) {
                                                return a.commodity.commodity_type;
                                            });
                                            angular.forEach(commodity_type, function (type, i) {
                                                var type_name = type.commodity.commodity_type.toString();
                                                type_name = type_name.charAt(0).toUpperCase() + type_name.substr(1);
                                                if (i != commodity_type.length - 1) {
                                                    str = str + type_name + com;
                                                } else {
                                                    str = str + type_name;
                                                    $scope.csv_site[key].push(str);
                                                }
                                            })
                                        } else {
                                            $scope.csv_site[key].push('');
                                        }
                                    }
                                    if (field != 'site_status' && field != 'site_commodity' && field != 'site_commodity_type' && field != 'site_country') {
                                        $scope.csv_site[key].push(p[field]);
                                    }
                                });
                            });
                        }, function(error){
                            usSpinnerService.stop('spinner-site');
                        })
                    }
                }
            }
        }
    });