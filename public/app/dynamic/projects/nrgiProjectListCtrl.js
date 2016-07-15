'use strict';

angular.module('app')
    .controller('nrgiProjectListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiProjectsSrvc,
        nrgiProjectsWithIsoSrvc,
        $filter
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.busy = false;

        var country_name, str, proj_commodity_type, commodity_name, timestamp, status, com =', ';
        $scope.csv_projects = [];
        var fields = ['proj_id', 'proj_name', 'verified', 'proj_country', 'proj_commodity_type', 'proj_commodity', 'proj_status', 'company_count', 'transfer_count', 'production_count'];
        var header_projects = ['Project ID', 'Name', 'Verified Project', 'Country', 'Type', 'Commodity', 'Status', 'Companies', 'Payments', 'Production'];
        $scope.getHeaderProjects = function () {
            return header_projects
        };
        $scope.createDownloadList = function (projects) {
            angular.forEach(projects, function (project, key) {
                $scope.csv_projects[key] = [];
                angular.forEach(fields, function (field) {
                    if(field == 'verified'){
                        if(project[field]!=undefined) {
                            project[field] = project[field].charAt(0).toUpperCase() + project[field].substr(1);
                            $scope.csv_projects[key].push(project[field])
                        }else{
                            $scope.csv_projects[key].push('')
                        }
                    }
                    if (field == 'proj_country') {
                        if(project[field]!=undefined&&project[field].length > 0) {
                            str = '';
                            angular.forEach(project[field], function (proj, i) {
                                country_name = '';
                                if (proj != undefined) {
                                    country_name = proj.country.name.toString();
                                    country_name = country_name.charAt(0).toUpperCase() + country_name.substr(1);
                                }
                                if (i != project[field].length - 1 && country_name != '') {
                                    str = str + country_name + com;
                                } else {
                                    str = str + country_name;
                                    $scope.csv_projects[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_projects[key].push('')
                        }
                    }
                    if (field == 'proj_commodity_type') {
                        if(project['proj_commodity']!=undefined&&project['proj_commodity'].length > 0) {
                            str = '';
                            project['proj_commodity'] = _.map(_.groupBy(project['proj_commodity'],function(doc){
                                return doc.commodity.commodity_type;
                            }),function(grouped){
                                return grouped[0];
                            });
                            angular.forEach(project['proj_commodity'], function (commodity, i) {
                                proj_commodity_type = '';
                                if (commodity != undefined) {
                                    proj_commodity_type = commodity.commodity.commodity_type.toString();
                                    proj_commodity_type = proj_commodity_type.charAt(0).toUpperCase() + proj_commodity_type.substr(1);
                                }
                                if (i != project['proj_commodity'].length - 1 && proj_commodity_type != '') {
                                    str = str + proj_commodity_type + com;
                                } else {
                                    str = str + proj_commodity_type;
                                    $scope.csv_projects[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_projects[key].push('')
                        }
                    }
                    if (field == 'proj_commodity') {
                        if(project[field]!=undefined&&project[field].length > 0) {
                            str = '';
                            project[field] = _.map(_.groupBy(project[field],function(doc){
                                return doc.commodity.commodity_name;
                            }),function(grouped){
                                return grouped[0];
                            });
                            angular.forEach(project[field], function (commodity, i) {
                                commodity_name = '';
                                if (commodity != undefined) {
                                    commodity_name = commodity.commodity.commodity_name.toString();
                                    commodity_name = commodity_name.charAt(0).toUpperCase() + commodity_name.substr(1);
                                }
                                if (i != project[field].length - 1 && commodity_name != '') {
                                    str = str + commodity_name + com;
                                } else {
                                    str = str + commodity_name;
                                    $scope.csv_projects[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_projects[key].push('')
                        }
                    }
                    if (field == 'proj_status') {
                        if(project[field]!=undefined&&project[field].length > 0) {
                            str = '';
                            angular.forEach(project[field], function (proj_status, i) {
                                status = '';
                                if (proj_status != undefined) {
                                    status = proj_status.string.toString();
                                    status = status.charAt(0).toUpperCase() + status.substr(1);
                                    timestamp = $filter('date')(proj_status.timestamp,'MM/dd/yyyy @ h:mma');
                                    str = status + '(true at '+timestamp+')';
                                    $scope.csv_projects[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_projects[key].push('')
                        }
                    }
                    if(field != 'verified' && field != 'proj_country' && field != 'proj_commodity_type' && field != 'proj_commodity' && field != 'proj_status') {
                        $scope.csv_projects[key].push(project[field])
                    }
                })
            });
        };

        nrgiProjectsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.projects = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
            $scope.createDownloadList($scope.projects);
        });
        //var iso = 'MX';
        //nrgiProjectsWithIsoSrvc.get({_iso2: iso,skip: 0, limit: 0}, function (response) {
        //    console.log(response)
        //});

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiProjectsSrvc.query({skip: currentPage*limit, limit: limit, record_type: $scope.record_type}, function (response) {
                    $scope.projects = _.union($scope.projects, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                    $scope.createDownloadList($scope.projects);
                });
            }
        };
    });

