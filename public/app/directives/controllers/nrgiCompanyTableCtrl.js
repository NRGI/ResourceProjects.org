'use strict';
angular
    .module('app')
    .controller('nrgiCompanyTableCtrl', function ($scope, nrgiTablesSrvc, usSpinnerService,nrgiCSV) {
        $scope.companies=[];
        $scope.openClose=true;
        $scope.loading = false;
        $scope.expression='';
        $scope.csv_company = [];
        var header_company = [];
        var fields = [];
        var str;
        var com = ', ';
        var limit = 50,
            currentPage = 0;
        var company_group_name='';
        var headers = [{name: 'Name', status: true, field: 'company_name'},
            {name: 'Group', status: $scope.group, field: 'company_groups'},
            {name: 'Stake ', status: $scope.stake, field: 'stake'}];
        angular.forEach(headers, function (header) {
            if (header.status != false && header.status != undefined) {
                header_company.push(header.name);
                fields.push(header.field);
            }
        });
        $scope.getHeaderCompanyInc = function () {
            return header_company
        };
        usSpinnerService.spin('spinner-company');
        $scope.company_of_operation=[];

        $scope.$watch('id', function(value) {
            if($scope.type=='country_of_incorporation'&&value!=undefined || $scope.type=='site'&&value!=undefined|| $scope.type=='concession'&&value!=undefined|| $scope.type=='project'&&value!=undefined) {
                $scope.companies = value;
                usSpinnerService.stop('spinner-company');
                if ($scope.companies.length == 0 ) {
                    $scope.expression = 'showLast';
                }else {
                    $scope.busy = false;
                    limit = 50;
                    currentPage = 1;
                }
            }
            if($scope.type!='country_of_incorporation' && value!=undefined && $scope.type!='site' && $scope.type!='concession'&& $scope.type!='project'){
                $scope.loading = false;
                $scope.getCompany($scope.id, $scope.type);
            }
        });
        $scope.loadMoreCompanies = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            nrgiTablesSrvc.query({_id: $scope.countryid,
                type: $scope.type,skip: currentPage*limit, limit: limit}, function (response) {
                $scope.companies = _.union($scope.companies, response.companies);
                if( response.companies.length>49){
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                }else{
                    $scope.busy = true;
                }
            });
        };
        $scope.loadCompaniesIncCSV = function () {
            nrgiCSV.setCsv(fields, $scope.companies)
            return nrgiCSV.getResult()
        };

        $scope.getAllCompaniesInc = function () {
            if ($scope.busy == true && $scope.companies.length > 49 || $scope.companies.length < 49) {
                setTimeout(function () {angular.element(document.getElementById("loadCompanyIncCSV")).trigger('click');}, 0)
            } else {
                nrgiTablesSrvc.query({
                    _id: $scope.countryid,
                    type: $scope.type, skip: 0, limit: 5000000
                }, function (data) {
                    $scope.companies = data.companies
                    $scope.busy = true;
                    setTimeout(function () {angular.element(document.getElementById("loadCompanyIncCSV")).trigger('click');}, 0)
                })
            }
        }
        $scope.getCompany=function(id,type) {
            if ($scope.id!=undefined){
                if ($scope.openClose == true) {
                    if ($scope.companies.length == 0 || $scope.loading == false) {
                        $scope.loading = true;
                        nrgiTablesSrvc.get({
                            _id: id,
                            type: type,
                            skip: currentPage*limit,
                            limit: limit
                        }, function (success) {
                            $scope.expression='';
                            if (success.companies.length == 0 && $scope.companies.length == 0) {
                                $scope.expression = 'showLast';
                            }
                            $scope.companies = success.companies;
                            usSpinnerService.stop('spinner-company');
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
                                                company_group_name = '';
                                                if (group != undefined) {
                                                    company_group_name = group.company_group_name.toString();
                                                    company_group_name = company_group_name.charAt(0).toUpperCase() + company_group_name.substr(1);
                                                }
                                                if (i != company[field].length - 1 && company_group_name != '') {
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
                        }, function(error){
                            usSpinnerService.stop('spinner-company');
                        })
                    }
                }
            }
        }
    });
