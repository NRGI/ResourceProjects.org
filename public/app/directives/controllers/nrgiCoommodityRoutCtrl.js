'use strict';

angular
    .module('app')
    .controller('nrgiCommodityRoutCtrl', function ($scope) {
        $scope.findId = function(id,rout){
            window.localStorage.setItem('id',id);
            window.localStorage.setItem('rout',rout);
        }
    });
