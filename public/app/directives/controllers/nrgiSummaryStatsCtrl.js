'use strict';
angular
    .module('app')
    .controller('nrgiSummaryStatsCtrl', function ($scope, nrgiSummaryStatsSrvc, nrgiSumOfPaymentsSrvc,nrgiPaymentsSrvc) {
        $scope.summaryStats=[];
        nrgiSummaryStatsSrvc.get(function (success) {
            $scope.summaryStats = success;
        }, function(error) {

        });
        nrgiPaymentsSrvc.get(function (success) {
           console.log(success);
        }, function(error) {

        });
        nrgiSumOfPaymentsSrvc.get(function (success) {
            $scope.usd = success.usd;
            $scope.bbl = success.bbl;
            $scope.gbp = success.gbp;
        }, function(error) {

        });
    });
