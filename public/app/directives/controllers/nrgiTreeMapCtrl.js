'use strict';

angular
    .module('app')
    .controller('nrgiTreeMapCtrl', function ($scope,$rootScope, nrgiTreeMapSrvc, $http,usSpinnerService) {
        $scope.sunburst=[];
        $scope.currency_filter='Show all currency'; $scope.year_filter='Show all years';
        var searchOptions = {};
        $scope.show_total = true;

        $scope.load = function(searchOptions) {
            usSpinnerService.spin('spinner-treemap');
            $('.tree-map-data').empty()
            nrgiTreeMapSrvc.query(searchOptions, function (success) {
                if(success.data && success.data[0].children && success.data[0].children.length>0) {
                    $scope.show_total = true;
                    $scope.treemapData = success.data[0];
                    $scope.total = success.data[0].total_value;
                    $scope.all_currency_value = success.total;
                    usSpinnerService.stop('spinner-treemap');
                    $scope.treemap = d3.layout.treemap()
                        .size([width, height])
                        .sticky(true)
                        .value(function(d) { return d.size; });
                    $scope.div = d3.select(".tree-map-data").append("div")
                        .style("position", "relative")
                        .style("width", (width + margin.left + margin.right) + "px")
                        .style("height", (height + margin.top + margin.bottom) + "px")
                        .style("left", margin.left + "px")
                        .style("top", margin.top + "px");
                    drawmap();
                } else{
                    $scope.show_total = false;
                    usSpinnerService.stop('spinner-treemap');
                }

                $scope.year_selector = success.filters.year_selector;
                $scope.currency_selector = success.filters.currency_selector;

            });
        }

        $scope.load(searchOptions);

        $scope.$watch('year_filter', function(year) {
            if(year&&year!='Show all years') {
                searchOptions.transfer_year = year;
                $scope.load(searchOptions);

            }else if(searchOptions.transfer_year&&year=='Show all years'){
                delete searchOptions.transfer_year;
                $scope.load(searchOptions);
            }
        });
        $scope.$watch('currency_filter', function(currency) {
            if(currency&&currency!='Show all currency') {
                searchOptions.transfer_unit = currency;
                $scope.load(searchOptions);
            }else if(searchOptions.transfer_unit&&currency=='Show all currency'){
                delete searchOptions.transfer_unit;
                $scope.load(searchOptions);
            }
        });
        var margin = {top: 40, right: 10, bottom: 10, left: 10},
            width = $('.container').innerWidth() - margin.left - margin.right,
            height = 600 - margin.top - margin.bottom;

        var color = d3.scale.category20c();
        function drawmap() {
            $scope.node  = $scope.div.datum($scope.treemapData).selectAll(".node")
                .data($scope.treemap.nodes)
                .enter().append("div")
                .attr("class", "node")
                .call(position)
                .style("background", function(d) { return d.children ? color(d.name) : null; })
                .html(function(d) { return d.children ? null : d.name; });
        }
        function position() {
            this.style("left", function(d) { return d.x + "px"; })
                .style("top", function(d) { return d.y + "px"; })
                .style("width", function(d) { return Math.max(0, d.dx) + "px"; })
                .style("height", function(d) { return Math.max(0, d.dy) + "px"; });
        }
    });
