'use strict';
angular
    .module('app')
    .controller('nrgiSummaryStatsCtrl', function ($scope, nrgiSummaryStatsSrvc, nrgiSumOfPaymentsSrvc) {
        $scope.summaryStats=[];
        nrgiSummaryStatsSrvc.get(function (success) {
            $scope.summaryStats = success;
        }, function(error) {

        });
        nrgiSumOfPaymentsSrvc.get(function (success) {
            $scope.usd = success.usd;
            $scope.bbl = success.bbl;
            $scope.gbp = success.gbp;
        }, function(error) {

        });
    });
