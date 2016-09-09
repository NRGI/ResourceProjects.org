'use strict';

angular.module('app')
    .controller('nrgiPieChartCtrl', function (
        $scope,
        nrgiPieChartSrvc
    ) {

        var currency='NOK', year='2014';
        var searchOptions = {transfer_unit: currency,transfer_year: year};
        nrgiPieChartSrvc.query(searchOptions, function (response) {
            $scope.data = response.data[0].children;
        });
        $scope.options = {
            chart: {
                type: 'pieChart',
                height: 500,
                x: function(d){return d.key + ', ' + d.value;},
                y: function(d){return d.y;},
                showLabels: false,
                duration: 500,
                labelThreshold: 0.01,
                labelSunbeamLayout: true,
                showLegend:false
            }
        };

    });





