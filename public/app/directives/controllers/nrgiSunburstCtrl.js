'use strict';
angular
    .module('app')
    .controller('nrgiSunburstCtrl', function ($scope, nrgiPaymentsSrvc) {
        $scope.sunburst_new=[];

        $scope.options = {
            chart: {
                type: 'sunburstChart',
                height: 450,
                color: d3.scale.category20c(),
                duration: 250,
                mode: 'size'
            }
        };

        nrgiPaymentsSrvc.get(function (success) {
            $scope.sunburst = success.data;
        }, function(error) {

        });
    });
