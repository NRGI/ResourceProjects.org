'use strict';
angular
    .module('app')
    .controller('nrgiCompanyTableCtrl', function ($scope) {
        setTimeout(function(){
            $scope.csv_company =[];
            var str = '';
            var com = ', ';
            if($scope.group != true && $scope.stake!=true){
                $scope.getHeaderCompany = function () {return ['Name']};
                angular.forEach($scope.companies, function(company){
                    $scope.csv_company.push({
                        'name' : company.company_name
                    })
                })
            }
            if($scope.group != true && $scope.stake==true){
                $scope.getHeaderCompany = function () {return ['Name', 'Stake']};
                angular.forEach($scope.companies, function(company){
                    $scope.csv_company.push({
                        'name' : company.company_name
                    })
                })
            }
            if($scope.group == true && $scope.stake!=true){
                $scope.getHeaderCompany = function () {return ['Name', 'Group']};
                angular.forEach($scope.companies, function(company){
                    str = '';
                    if(company.company_groups.length>0) {
                        angular.forEach(company.company_groups, function (group, i) {
                            if (i != company.company_groups.length - 1) {
                                str = str + group.company_group_name + com;
                            } else {
                                str = str + group.company_group_name;
                                $scope.csv_company.push({
                                    'name': company.company_name,
                                    'company_groups': str
                                })
                            }
                        })
                    }else {
                        $scope.csv_company.push({
                            'name': company.company_name,
                            'company_groups': ''
                        })
                    }
                })
            }
            if($scope.group == true && $scope.stake==true){
                $scope.getHeaderCompany = function () {return ['Name', 'Group', 'Stake']};
                angular.forEach($scope.companies, function(company){
                    if(company.company_groups.length>0) {
                        str = '';
                        angular.forEach(company.company_groups, function (group, i) {
                            if (i != company.company_groups.length - 1) {
                                str = str + group.company_group_name + com;
                            } else {
                                str = str + group.company_group_name;
                                $scope.csv_company.push({
                                    'name': company.company_name,
                                    'company_groups': str
                                })
                            }
                        })
                    }else {
                        $scope.csv_company.push({
                            'name': company.company_name,
                            'company_groups': ''
                        })
                    }
                })
            }
        },2000)
    });
