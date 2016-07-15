'use strict';

angular
    .module('app')
    .controller('nrgiProjectTableCtrl', function ($scope,$filter,nrgiProjectTablesSrvc,usSpinnerService) {
        $scope.projects=[];
        $scope.loading=false;
        $scope.openClose=true;
        $scope.csv_project =[];
        $scope.expression='';
        var commodity_name='';
        var country_name='';
        var type_name='';
        var header_project=[];
        var fields=[];
        var str;
        var com =', ';
        usSpinnerService.spin('spinner-project');
        $scope.$watch('id', function(value) {
            if(value!=undefined){
                $scope.loading = false;
                $scope.getProjects($scope.id, $scope.type);
            }
        });
        $scope.getProjects=function(id,type) {
            if ($scope.id != undefined) {
                if ($scope.openClose == true) {
                    if ($scope.projects.length == 0 || $scope.loading == false) {
                        $scope.loading = true;
                        nrgiProjectTablesSrvc.get({
                            _id: id,
                            type: type
                        }, function (success) {
                            $scope.expression='';
                            if (success.projects.length == 0 && $scope.projects.length == 0) {
                                $scope.expression = 'showLast';
                            }
                            $scope.projects=success.projects;
                            usSpinnerService.stop('spinner-project');
                            var headers = [{name: 'Project ID', status: true, field: 'proj_id'},
                                {name: 'Name', status: true, field: 'proj_name'},
                                {name: 'Country', status: $scope.country, field: 'proj_country'},
                                {name: 'Commodity Type ', status: $scope.type, field: 'proj_type'},
                                {name: 'Commodity ', status: $scope.commodity, field: 'proj_commodity'},
                                {name: 'Status ', status: $scope.status, field: 'proj_status'},
                                {name: 'Companies ', status: $scope.companies, field: 'companies'}];
                            angular.forEach(headers, function (header) {
                                if (header.status != false && header.status != undefined) {
                                    header_project.push(header.name);
                                    fields.push(header.field);
                                }
                            });
                            $scope.getHeaderProjects = function () {
                                return header_project
                            };
                            angular.forEach($scope.projects, function (p, key) {
                                $scope.csv_project[key] = [];
                                angular.forEach(fields, function (field) {
                                    if (field == 'proj_commodity') {
                                        if (p[field].length > 0) {
                                            str = '';
                                            var commodities = _.uniq(p.proj_commodity, function (a) {
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
                                                    $scope.csv_project[key].push(str);
                                                }
                                            })
                                        } else {
                                            $scope.csv_project[key].push('');
                                        }
                                    }
                                    if (field == 'proj_status') {
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
                                                    $scope.csv_project[key].push(str);
                                                }
                                            })
                                        } else {
                                            $scope.csv_project[key].push('');
                                        }
                                    }
                                    if (field == 'proj_country') {
                                        if (p[field].length > 0) {
                                            str = '';
                                            angular.forEach(p[field], function (country, i) {
                                                country_name = '';
                                                if (country.country != undefined) {
                                                    country_name = country.country.name.toString();
                                                    country_name = country_name.charAt(0).toUpperCase() + country_name.substr(1);
                                                }
                                                if (i != p[field].length - 1) {
                                                    str = str + country_name + com;
                                                } else {
                                                    str = str + country_name;
                                                    $scope.csv_project[key].push(str);
                                                }
                                            })
                                        } else {
                                            $scope.csv_project[key].push('');
                                        }
                                    }
                                    if (field == 'proj_type') {
                                        if (p.proj_commodity.length > 0) {
                                            str = '';
                                            var proj_commodity = _.uniq(p.proj_commodity, function (a) {
                                                return a.commodity.commodity_type;
                                            });
                                            angular.forEach(proj_commodity, function (type, i) {
                                                type_name = '';
                                                if (type.commodity != undefined) {
                                                    type_name = type.commodity.commodity_type.toString();
                                                    type_name = type_name.charAt(0).toUpperCase() + type_name.substr(1);
                                                }
                                                if (i != proj_commodity.length - 1) {
                                                    str = str + type_name + com;
                                                } else {
                                                    str = str + type_name;
                                                    $scope.csv_project[key].push(str);
                                                }
                                            })
                                        } else {
                                            $scope.csv_project[key].push('');
                                        }
                                    }
                                    if (field != 'proj_status' && field != 'proj_commodity' && field != 'proj_type' && field != 'proj_country') {
                                        $scope.csv_project[key].push(p[field]);
                                    }
                                });
                            })
                        }, function(error){
                            usSpinnerService.stop('spinner-project');
                        })
                    }
                }
            }
        }
    });