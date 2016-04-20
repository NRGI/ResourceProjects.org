'use strict';
angular
    .module('app')
    .controller('nrgiCompanyOperationTableCtrl', function ($scope,nrgiTablesSrvc,usSpinnerService) {
        $scope.companies=[];
        $scope.openClose=false;
        $scope.limit = 50;
        $scope.page = 0;
        $scope.loading = false;
        $scope.expression='';
        var company_group_name='';
        $scope.csv_company = [];
        var header_company = [];
        var fields = [];
        var str;
        var com = ', ';
        usSpinnerService.spin('spinner-companyOperation');
        $scope.loadMoreCompanyOperation=function() {
            if($scope.loading==false) {
                $scope.page = $scope.page+$scope.limit;
                usSpinnerService.spin('spinner-companyOperation');
                $scope.getCompanyOperation($scope.id, $scope.type);
            }
        };
        $scope.getCompanyOperation=function(id,type) {
            if ($scope.openClose == true) {
                if ($scope.companies.length == 0 || $scope.loading == false) {
                    $scope.loading = true;
                    nrgiTablesSrvc.get({
                        _id: id,
                        type: type,
                        skip: $scope.page,
                        limit: $scope.limit
                    }, function (success) {
                        if(success.companies.length==0){
                            $scope.expression = 'showLast';
                        }
                        if (success.companies.length > 0) {
                            _.each(success.companies, function (contract) {
                                $scope.companies.push(contract);
                            });
                        }
                        usSpinnerService.stop('spinner-companyOperation');
                        if (success.companies.length < $scope.limit) {
                            $scope.loading = true;
                        } else {
                            $scope.loading = false;
                        }
                        var headers = [{name: 'Name', status: true, field: 'company_name'},
                            {name: 'Group', status: $scope.group, field: 'company_groups'},
                            {name: 'Stake ', status: $scope.stake, field: 'stake'}];
                        angular.forEach(headers, function (header) {
                            if (header.status != false && header.status != undefined) {
                                header_company.push(header.name);
                                fields.push(header.field);
                            }
                        });
                        $scope.getHeaderCompany = function () {
                            return header_company
                        };
                        angular.forEach($scope.companies, function (company, key) {
                            $scope.csv_company[key] = [];
                            angular.forEach(fields, function (field) {
                                if (field == 'company_groups') {
                                    if (company[field].length > 0) {
                                        str = '';
                                        angular.forEach(company[field], function (group, i) {
                                            company_group_name='';
                                            if(group!=undefined) {
                                                company_group_name = group.company_group_name.toString();
                                                company_group_name = company_group_name.charAt(0).toUpperCase() + company_group_name.substr(1);
                                            }
                                            if (i != company[field].length - 1 && company_group_name!='') {
                                                str = str + company_group_name + com;
                                            } else {
                                                str = str + company_group_name;
                                                $scope.csv_company[key].push(str);
                                            }
                                        });
                                    } else {
                                        $scope.csv_company[key].push('')
                                    }
                                }
                                //if(field=='stake'){
                                //    $scope.csv_company[key].push('UNFINISHED FIELD')
                                //}
                                if (field != 'company_groups' && field != 'stake') {
                                    $scope.csv_company[key].push(company[field])
                                }
                            })
                        });
                    });
                }
            }
        }
    });
