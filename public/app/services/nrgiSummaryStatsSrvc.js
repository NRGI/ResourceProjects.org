'use strict';

angular.module('app')
    .factory('nrgiSummaryStatsSrvc', function($resource) {
        var SummaryStatsResource = $resource('/api/summary_stats', {}, {
            query:  {method:'GET', isArray: false}
        });

        return SummaryStatsResource;

    })
    .factory('nrgiSumOfPaymentsSrvc', function($resource) {
        var SumOfPaymentsResource = $resource('/api/sum_of_payments', {}, {
            query:  {method:'GET', isArray: false}
        });

        return SumOfPaymentsResource;

    })
    .factory('nrgiPaymentsSrvc', function($resource) {
        var PaymentsResource = $resource('/api/payments', {}, {
            query:  {method:'GET', isArray: false}
        });

        return PaymentsResource;

    });