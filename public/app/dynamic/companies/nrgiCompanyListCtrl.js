'use strict';

angular.module('app')
    .controller('nrgiCompanyListCtrl', function (
        $scope,
        $rootScope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiCompaniesSrvc
    ) {
        var limit = 50,
            currentPage = 0,
            totalPages = 0;
            //_ = $rootScope._;

        $scope.count =0;
        $scope.busy = false;

        var company_group_name, str;
        var com = ', ';
        $scope.csv_companies = [];
        var fields = ['company_name', 'company_groups', 'project_count', 'site_count', 'field_count', 'transfer_count'];
        var header_companies = ['Company', 'Group(s)', 'Projects', 'Sites', 'Fields', 'Payments'];
        $scope.getHeaderCompanies = function () {
            return header_companies
        };

        $scope.createDownloadList = function (companies) {
            angular.forEach(companies, function (company, key) {
                $scope.csv_companies[key] = [];
                angular.forEach(fields, function (field) {
                    if (field == 'company_groups') {
                        if(company[field]!=undefined&&company[field].length > 0) {
                            str = '';
                            angular.forEach(company[field], function (group, i) {
                                company_group_name = '';
                                if (group != undefined && group.company_group_name) {
                                    company_group_name = group.company_group_name.toString();
                                    company_group_name = company_group_name.charAt(0).toUpperCase() + company_group_name.substr(1);
                                }
                                if (i != company[field].length - 1 && company_group_name != '') {
                                    str = str + company_group_name + com;
                                } else {
                                    str = str + company_group_name;
                                    $scope.csv_companies[key].push(str);
                                }
                            });
                        } else {
                            $scope.csv_companies[key].push('')
                        }
                    }
                    if (field != 'company_groups') {
                        $scope.csv_companies[key].push(company[field])
                    }
                })
            });
        };

        nrgiCompaniesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
            $scope.count = response.company_count;
            $scope.companies = response.companies;
            totalPages = Math.ceil(response.company_count / limit);
            currentPage = currentPage + 1;
            $scope.createDownloadList($scope.companies);
        });

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiCompaniesSrvc.query({skip: currentPage*limit, limit: limit}, function (response) {
                    $scope.companies = _.union($scope.companies, response.companies);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                    $scope.createDownloadList($scope.companies);
                });
            }
        };
    });

