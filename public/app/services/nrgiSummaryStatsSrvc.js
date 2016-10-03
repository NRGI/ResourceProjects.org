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
        var PaymentsResource = $resource('/api/transfers', {}, {
            query:  {method:'GET', isArray: false}
        });

        return PaymentsResource;

    })

    .factory('nrgiPieChartSrvc', function($resource) {
        var TransferResource = $resource('/api/pie_chart', {}, {
            query: {method: 'GET', isArray: false}
        });

        return TransferResource;
    })
    .factory('nrgiPaymentsByGovSrvc', function($resource) {
        var PaymentsByGov = $resource('/api/transfers_by_gov', {}, {
            query: {method: 'GET', isArray: false}
        });

        return PaymentsByGov;
    });