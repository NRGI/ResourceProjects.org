'use strict';
angular
    .module('app')
    .controller('nrgiCompanyTableCtrl', function ($scope,nrgiTablesSrvc) {
        $scope.companies=[];
        $scope.getData=function(id,type){
            if($scope.companies.length==0) {
                nrgiTablesSrvc.get({_id: id,type:type}, function (success) {
                    $scope.companies = success.companies;
                    $scope.csv_company =[]; var header_company=[]; var fields=[]; var str; var com =', ';
                    var headers = [{name:'Name',status:true,field:'company_name'},
                        {name:'Group',status:$scope.group,field:'company_groups'},
                        {name:'Stake ',status:$scope.stake,field:'stake'}];
                    angular.forEach(headers, function(header) {
                        if(header.status!=false&&header.status!= undefined){
                            header_company.push(header.name);
                            fields.push(header.field);
                        }
                    });
                    $scope.getHeaderCompany = function () {return header_company};
                    angular.forEach($scope.companies, function(company,key) {
                        $scope.csv_company[key] = [];
                        angular.forEach(fields, function (field) {
                            if (field == 'company_groups') {
                                if (company[field].length > 0) {
                                    str = '';
                                    angular.forEach(company[field], function (group, i) {
                                        var company_group_name = group.company_group_name.toString();
                                        company_group_name = company_group_name.charAt(0).toUpperCase()+company_group_name.substr(1);
                                        if (i != company[field].length - 1) {
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
                            if(field != 'company_groups'&& field!='stake'){
                                $scope.csv_company[key].push(company[field])
                            }
                        })
                    });
                });
            }
        }
    });
