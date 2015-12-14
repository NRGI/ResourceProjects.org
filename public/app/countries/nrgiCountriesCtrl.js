'use strict';

angular.module('app')
    .controller('nrgiCountriesCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc
    ) {
        $scope.param =='-name';
        // bring in current user data to customize front page
        $scope.countries = [
            {id:'AO',name:'Angola',count:'15'},
            {id:'CG',name:'Congo',count:'1'},
            {id:'CI',name:'Cote d&apos;Ivoire',count:'2'},
            {id:'GQ',name:'Equatorial Guinea',count:'2'},
            {id:'ET',name:'Ethiopia',count:'1'},
            {id:'GA',name:'Gabon',count:'7'},
            {id:'GH',name:'Ghana',count:'18'},
            {id:'JM',name:'Jamaica',count:'1'},
            {id:'MG',name:'Madagascar',count:'1'},
            {id:'MR',name:'Mauritania',count:'3'}
        ];
    });
