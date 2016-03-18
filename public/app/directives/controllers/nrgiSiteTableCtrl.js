'use strict';

angular
    .module('app')
    .controller('nrgiSiteTableCtrl', function ($scope,$filter) {
        setTimeout(function(){
            $scope.csv_site =[]; var header_site=[]; var fields=[]; var str; var com =', ';
            var headers = [{name:'Name',status:true,field:'site_name'},
                // {name:'Country',status:$scope.country,field:'proj_country'},
                // {name:'Commodity Type ',status:$scope.type,field:'proj_type'},
                // {name:'Commodity ',status:$scope.commodity,field:'proj_commodity'},
                // {name:'Companies ',status:$scope.companies,field:'companies'},
                {name:'Status ',status:$scope.status,field:'proj_status'}];
            angular.forEach(headers, function(header) {
                if(header.status!=false&&header.status!= undefined){
                    header_site.push(header.name);
                    fields.push(header.field);
                }
            });
            $scope.getHeaderSites = function () {return header_site};
            angular.forEach($scope.sites, function(p,key) {
                $scope.csv_site[key] = [];
                angular.forEach(fields, function(field) {
//                     if(field=='proj_commodity'){
//                         if(p[field].length>0) {
//                             str = '';
//                             angular.forEach(p[field], function (commodity, i) {
//                                 var commodity_name = commodity.commodity.commodity_name.toString();
//                                 commodity_name = commodity_name.charAt(0).toUpperCase()+commodity_name.substr(1);
//                                 if (i != p[field].length - 1) {
//                                     str = str + commodity_name + com;
//                                 } else {
//                                     str = str + commodity_name;
//                                     $scope.csv_project[key].push(str);
//                                 }
//                             })
//                         } else {
//                             $scope.csv_project[key].push('');
//                         }
//                     }
                    if(field=='site_status'){
                        if(p[field].length>0) {
                            str = '';
                            angular.forEach(p[field], function (status, i) {
                                var date = new Date(status.timestamp);
                                date= $filter('date')( date, "MM/dd/yyyy @ h:mma");
                                var status_name = status.string.toString();
                                status_name = status_name.charAt(0).toUpperCase()+status_name.substr(1);
                                if (i != p[field].length - 1) {
                                    str = str + status_name +'(true at '+date+')' +  com;
                                } else {
                                    str = str + status_name +'(true at '+date+')';
                                    $scope.csv_project[key].push(str);
                                }
                            })
                        }else {
                            $scope.csv_site[key].push('');
                        }
                    }
//                     if(field=='proj_country'){
//                         if(p[field].length>0) {
//                             str = '';
//                             angular.forEach(p[field], function (country, i) {
//                                 var country_name = country.country.name.toString();
//                                 country_name = country_name.charAt(0).toUpperCase()+country_name.substr(1);
//                                 if (i != p[field].length - 1) {
//                                     str = str + country_name + com;
//                                 } else {
//                                     str = str + country_name;
//                                     $scope.csv_project[key].push(str);
//                                 }
//                             })
//                         }else {
//                             $scope.csv_project[key].push('');
//                         }
//                     }
//                     if(field=='proj_type'){
//                         if(p[field].length>0) {
//                             str = '';
//                             angular.forEach(p[field], function (type, i) {
//                                 var type_name = type.string.toString();
//                                 type_name = type_name.charAt(0).toUpperCase()+type_name.substr(1);
//                                 if (i != p[field].length - 1) {
//                                     str = str + type_name + com;
//                                 } else {
//                                     str = str + type_name;
//                                     $scope.csv_project[key].push(str);
//                                 }
//                             })
//                         }else {
//                             $scope.csv_project[key].push('');
//                         }
//                     }
//                     if(field!='proj_status'&&field!='proj_commodity'&&field!='proj_type'&&field!='proj_country'){
//                         $scope.csv_project[key].push(p[field]);
//                     }
                });
            });
        },2000)
    });