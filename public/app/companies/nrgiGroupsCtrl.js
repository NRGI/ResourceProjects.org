'use strict';

angular.module('app')
    .controller('nrgiGroupsCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiCompaniesSrvc
    ) {
        nrgiCompaniesSrvc.getAllCompanyGroups().then(function(response) {
            $scope.groups =response;
        });
        //$scope.groups = [s
        //    {id:'e78a24ef78c0b90a',name:'Aa Mine Holding',numberCompanies:'1',numberProject:'1'}
        //];
    });
