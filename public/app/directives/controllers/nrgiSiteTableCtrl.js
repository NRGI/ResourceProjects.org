'use strict';

angular
    .module('app')
    .controller('nrgiSiteTableCtrl', function ($scope,$filter,nrgiSiteFieldTablesSrvc,usSpinnerService,nrgiCSV) {
        $scope.sites=[];
        $scope.openClose=true;
        $scope.loading = false;
        $scope.csv_site = [];
        $scope.expression='';
        var headerSite = [];
        var fields = [];
        var limit = 50,
            currentPage = 0;
        var headers = [{name: 'Name', status: true, field: 'site_name'},
            {name: 'Type', status: $scope.type, field: 'site_type'},
            {name: 'Country', status: $scope.country, field: 'site_country'},
            {name: 'Commodity Type ', status: $scope.commoditytype, field: 'site_commodity_type'},
            {name: 'Commodity ', status: $scope.commodity, field: 'site_commodity'},
            {name: 'Status ', status: $scope.status, field: 'site_status'},
            {name: 'Companies ', status: $scope.company, field: 'companies'}];
        angular.forEach(headers, function (header) {
            if (header.status != false && header.status != undefined) {
                headerSite.push(header.name);
                fields.push(header.field);
            }
        });
        $scope.getHeaderSites = function () {
            return headerSite
        };
        usSpinnerService.spin('spinner-site');
        $scope.$watch('id', function(value) {
            if ($scope.name == 'country' && value == undefined || $scope.name == 'company' && value == undefined || $scope.name == 'concession' && value == undefined) {
                usSpinnerService.stop('spinner-site');
                $scope.expression = 'showLast';
            }
            if ($scope.name == 'country' && value != undefined || $scope.name == 'company' && value != undefined|| $scope.name == 'concession' && value != undefined) {
                $scope.sites = value;
                usSpinnerService.stop('spinner-site');
                if ($scope.sites.length == 0 ) {
                    $scope.expression = 'showLast';
                }else {
                    $scope.busy = false;
                    limit = 50;
                    currentPage = 1;
                }
            }
            if($scope.name!='country' && value!=undefined && $scope.name!= 'company' && $scope.name!= 'concession'){
                $scope.loading = false;
                $scope.getSites($scope.id, $scope.name);
            }
        });
        $scope.loadMoreSites = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            nrgiSiteFieldTablesSrvc.query({_id: $scope.countryid,
                type: $scope.name,skip: currentPage*limit, limit: limit}, function (response) {
                $scope.sites = _.union($scope.sites, response.sites);
                if( response.sites.length>49){
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                }else{
                    $scope.busy = true;
                }
            });
        };
        $scope.loadSitesCSV = function() {
            nrgiCSV.setCsv(fields,$scope.sites)
            return nrgiCSV.getResult()
        };
        $scope.getAllSites=function() {
            if($scope.busy == true && $scope.sites.length>49 || $scope.sites.length<49) {
                setTimeout(function () {angular.element(document.getElementById("loadSitesCSV")).trigger('click');},0)
            } else {
                nrgiSiteFieldTablesSrvc.query({
                    _id: $scope.countryid,
                    type: $scope.name, skip: 0, limit: 5000000
                }, function (data) {
                    $scope.sites = data.sites
                    $scope.busy = true;
                    setTimeout(function () {angular.element(document.getElementById("loadSitesCSV")).trigger('click');},0)
                })
            }
        }
        $scope.getSites=function(id,type) {
            if ($scope.id != undefined) {
                if ($scope.openClose == true) {
                    if ($scope.sites.length == 0 || $scope.loading == false) {
                        $scope.loading = true;
                        nrgiSiteFieldTablesSrvc.get({
                            _id: id,
                            type: type,
                            skip: currentPage*limit,
                            limit: limit
                        }, function (success) {
                            $scope.expression='';
                            if (success.sites.length == 0 && $scope.sites.length == 0) {
                                $scope.expression = 'showLast';
                            }
                            $scope.sites=success.sites;
                            usSpinnerService.stop('spinner-site');

                        }, function(error){
                            console.log(error)
                            usSpinnerService.stop('spinner-site');
                        })
                    }
                }
            }
        }
    });