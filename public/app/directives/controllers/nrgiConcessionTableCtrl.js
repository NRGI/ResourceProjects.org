'use strict';

angular.module('app').controller('nrgiConcessionTableCtrl', function ($scope,$filter,nrgiConcessionTablesSrvc,usSpinnerService,nrgiCSV) {
    $scope.concessions=[];
    $scope.openClose=true;
    //$scope.loading = false;
    $scope.expression='';
    var headerConcessions = [], fields = [];
    var limit = 50, currentPage = 0;
    var headers = [
        {name: 'Name', status: true, field: 'concession_name'},
        {name: 'Country', status: $scope.country, field: 'concession_country'},
        {name: 'Commodity Type ', status: $scope.type, field: 'concession_type'},
        {name: 'Commodity ', status: $scope.commodity, field: 'concession_commodities'},
        {name: 'Status ', status: $scope.status, field: 'concession_status'},
        {name: 'No. Projects ', status: $scope.projects, field: 'projects_count'}];

    angular.forEach(headers, function (header) {
        if (header.status != false && header.status != undefined) {
            headerConcessions.push(header.name);
            fields.push(header.field);
        }
    });

    $scope.getHeaderConcessions = function () {
        return headerConcessions
    };

    usSpinnerService.spin('spinner-concession');

    $scope.$watch('id', function(value) {
        if($scope.name=='country'&&value!=undefined) {
            $scope.concessions = value;
            usSpinnerService.stop('spinner-concession');
            if ($scope.concessions.length == 0 ) {
                $scope.expression = 'showLast';
            }else {
                $scope.busy = false;
                limit = 50;
                currentPage = 1;
            }
        }
        if($scope.name!='country'&&value!=undefined){
            $scope.loading = false;
            $scope.getConcessions($scope.id, $scope.name);
        }
    });

    $scope.loadMoreConcessions = function() {
        if ($scope.busy) return;
        $scope.busy = true;
        nrgiConcessionTablesSrvc.query({_id: $scope.countryid,
            type: $scope.name,skip: currentPage*limit, limit: limit}, function (response) {
            $scope.concessions = _.union($scope.concessions, response.concessions);
            if( response.concessions.length>49){
                currentPage = currentPage + 1;
                $scope.busy = false;
            }else{
                $scope.busy = true;
            }
        });
    };

    $scope.loadConcessionsCSV = function () {
        nrgiCSV.setCsv(fields, $scope.concessions)
        return nrgiCSV.getResult()
    };

    $scope.getAllConcessions = function () {
        if ($scope.busy == true && $scope.concessions.length > 49 || $scope.concessions.length < 49) {
            setTimeout(function () {angular.element(document.getElementById("loadConcessionCSV")).trigger('click');}, 0)
        } else {
            nrgiConcessionTablesSrvc.query({
                _id: $scope.countryid,
                type: $scope.name, skip: 0, limit: 5000000
            }, function (data) {
                $scope.concessions = data.concessions
                $scope.busy = true;
                setTimeout(function () {angular.element(document.getElementById("loadConcessionCSV")).trigger('click');}, 0)
            })
        }
    }
    $scope.getConcessions=function(id,type) {
        if ($scope.id != undefined) {
            if ($scope.openClose == true) {
                if ($scope.concessions.length == 0 || $scope.loading == false) {
                    $scope.loading = true;
                    nrgiConcessionTablesSrvc.get({
                        _id: id,
                        type: type,
                        skip: currentPage*limit,
                        limit: limit
                    }, function (success) {
                        $scope.expression='';
                        if (success.concessions.length == 0 && $scope.concessions.length == 0) {
                            $scope.expression = 'showLast';
                        }
                        $scope.concessions=success.concessions;
                        usSpinnerService.stop('spinner-concession');


                    }, function(error){
                        usSpinnerService.stop('spinner-concession');
                    })
                }
            }
        }
    }
});