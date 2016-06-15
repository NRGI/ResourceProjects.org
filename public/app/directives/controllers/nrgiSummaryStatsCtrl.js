'use strict';
angular
    .module('app')
    .controller('nrgiSummaryStatsCtrl', function ($scope, nrgiSummaryStatsSrvc) {
        $scope.summaryStats=[];
        nrgiSummaryStatsSrvc.get(function (success) {
            $scope.summaryStats = success;
        }, function(error) {

        });
    });
