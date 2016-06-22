'use strict';
angular
    .module('app')
    .controller('nrgiSummaryStatsCtrl', function ($scope, nrgiSummaryStatsSrvc, nrgiSumOfPaymentsSrvc,nrgiPaymentsSrvc) {
        $scope.summaryStats=[];
        nrgiSummaryStatsSrvc.get(function (success) {
            $scope.summaryStats = success;
        }, function(error) {

        });

        //$scope.options = {
        //    chart: {
        //        type: 'sunburstChart',
        //        height: 450,
        //        color: d3.scale.category20c(),
        //        duration: 250,
        //        mode: 'size'
        //    },
        //    "tooltip": {
        //        "duration": 0,
        //        "gravity": "w",
        //        "distance": 25,
        //        "snapDistance": 0,
        //        "classes": null,
        //        "chartContainer": null,
        //        "enabled": true,
        //        "hideDelay": 200,
        //        "headerEnabled": false,
        //        "fixedTop": null,
        //        "offset": {
        //            "left": 0,
        //            "top": 0
        //        },
        //        "hidden": true,
        //        "data": null,
        //        "id": "nvtooltip-84422"
        //    }
        //};
        //$scope.sunburst_new.push({
        //    name:'payments',
        //    children:[]
        //});
        //nrgiPaymentsSrvc.get(function (success) {
        //    $scope.sunburst=success.data;
        //    console.log($scope.sunburst)
        //}, function(error) {
        //
        //});
        nrgiSumOfPaymentsSrvc.get(function (success) {
            $scope.usd = success.usd;
            $scope.bbl = success.bbl;
            $scope.gbp = success.gbp;
        }, function(error) {

        });
    });
