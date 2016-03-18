'use strict';

angular
    .module('app')
    .controller('nrgiProjectRoutingCtrl', function ($scope) {
        $scope.findId = function(id,rout){
            window.localStorage.setItem('id_project',id);
            window.localStorage.setItem('routing_project',rout);
        }
    });
