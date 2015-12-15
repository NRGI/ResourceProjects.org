'use strict';

angular.module('app')
    .controller('nrgiSourcesCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc
    ) {
        $scope.sources = [
            {id:'AGNICOEAGLEMINESLIMITED-qgl67j',name:'AGNICO-EAGLE MINES LIMITED',type:'Extractive company report',details:'AGNICOEAGLEMINESLIMITED-qgl67j',date:''},
            {id:'ALAMOSGOLDINC-1dsz22',name:'ALAMOS GOLD INC',type:'',details:'ALAMOSGOLDINC-1dsz22',date:''},
            {id:'ALMADENMINERALSLTD-s2l4qu',name:'ALMADEN MINERALS LTD',type:'Extractive company report',details:'ALMADENMINERALSLTD-s2l4qu',date:''},
            {id:'ARCELIAGOLDCORP-uc9n5y',name:'ARCELIA GOLD CORP',type:'Extractive company report',details:'ARCELIAGOLDCORP-uc9n5y',date:''},
            {id:'ARCELORMITTALSTEELCOMPANYNV-pf0n7e',name:'ARCELORMITTAL STEEL COMPANY N.V.',type:'Extractive company report',details:'ARCELORMITTALSTEELCOMPANYNV-pf0n7e',date:''}
        ];

    });

