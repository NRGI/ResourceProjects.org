'use strict';

angular
    .module('app')
    .controller('nrgiCommodityRouteCtrl', function ($scope) {
        $scope.findId = function(id,rout){
            window.localStorage.setItem('id',id);
            window.localStorage.setItem('rout',rout);
        }
    });
