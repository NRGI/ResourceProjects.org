'use strict';

angular.module('app')
    .factory('nrgiSummaryStatsSrvc', function($resource) {
        var SummaryStatsResource = $resource('/api/summary_stats', {}, {
            query:  {method:'GET', isArray: false}
        });

        return SummaryStatsResource;

    });