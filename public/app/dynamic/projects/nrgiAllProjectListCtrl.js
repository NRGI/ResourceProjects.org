'use strict';

angular.module('app')
    .controller('nrgiAllProjectListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiAllProjectsSrvc,
        $filter
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.busy = false;

        var country_name, str, proj_commodity_type, company_name, com =', ';
        $scope.csv_projects = [];
        var fields = ['proj_id', 'proj_name',  'proj_country','companies'];
        var header_projects = ['Project ID', 'Name',  'Country',  'Companies'];
        $scope.getHeaderProjects = function () {
            return header_projects
        };
        $scope.createDownloadList = function (projects) {
            angular.forEach(projects, function (project, key) {
                $scope.csv_projects[key] = [];
                angular.forEach(fields, function (field) {
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
                    if (field == 'companies') {
                        if(project[field]!=undefined&&project[field].length > 0) {
                            str = '';
                            angular.forEach(project[field], function (proj, i) {
                                company_name = '';
                                if (proj != undefined) {
                                    company_name = proj.company_name.toString();
                                    company_name = company_name.charAt(0).toUpperCase() + company_name.substr(1);
                                }
                                if (i != project[field].length - 1 && company_name != '') {
                                    str = str + company_name + com;
                                } else {
                                    str = str + company_name;
                                    $scope.csv_projects[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_projects[key].push('')
                        }
                    }
                    if(field != 'companies' && field != 'proj_country') {
                        $scope.csv_projects[key].push(project[field])
                    }
                })
            });
        };

        nrgiAllProjectsSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.count;
            $scope.projects = response.data;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
            $scope.createDownloadList($scope.projects);
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiAllProjectsSrvc.query({skip: currentPage*limit, limit: limit, record_type: $scope.record_type}, function (response) {
                    $scope.projects = _.union($scope.projects, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                    $scope.createDownloadList($scope.projects);
                });
            }
        };
    });

