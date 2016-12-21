'use strict';

angular
    .module('app')
    .controller('nrgiTreeMapCtrl', function ($scope,$rootScope, nrgiTreeMapSrvc, $http,usSpinnerService) {
        $scope.sunburst=[];
        $scope.currency_filter='USD'; $scope.year_filter='2015';
        var searchOptions = {transfer_year:'2015',transfer_unit:"USD"};
        $scope.show_total = true;

        $scope.load = function(searchOptions) {
            usSpinnerService.spin('spinner-treemap');
            $('.tree-map-data').empty()
            nrgiTreeMapSrvc.query(searchOptions, function (success) {
                if(success.sunburstNew && success.sunburstNew[0].children && success.sunburstNew[0].children.length>0) {
                    $scope.show_total = true;
                    $scope.treemapData = success.sunburstNew[0];
                    $scope.total = success.sunburstNew[0].total_value;
                    $scope.all_currency_value = success.total;
                    usSpinnerService.stop('spinner-treemap');
                    drawmap($scope.treemapData)
                } else{
                    $scope.show_total = false;
                    usSpinnerService.stop('spinner-treemap');
                }

                $scope.year_selector = success.filters.year_selector;
                $scope.currency_selector = success.filters.currency_selector;

            });
        }

        $scope.load(searchOptions);
        if(parent.document.getElementsByTagName("iframe")[0]) {
            parent.document.getElementsByTagName("iframe")[0].setAttribute('style', 'height: 700px !important');
        }

        var margin = {top: 20, right: 0, bottom: 0, left: 0},
            width = $('.container').innerWidth() ,
            height = 600 - margin.top - margin.bottom,
            formatNumber = d3.format(",d"),
            transitioning;

        /* create x and y scales */
        var x = d3.scale.linear()
            .domain([0, width])
            .range([0, width]);

        var y = d3.scale.linear()
            .domain([0, height])
            .range([0, height]);

        var color = d3.scale.category20c();
        $scope.$watch('year_filter', function(year) {
            if(year&&year!='Show all years'&&$scope.year_filter!=year) {
                searchOptions.transfer_year = year;
                $scope.load(searchOptions);

            }else if(searchOptions.transfer_year&&year=='Show all years'){
                delete searchOptions.transfer_year;
                $scope.load(searchOptions);
            }
        });
        $scope.$watch('currency_filter', function(currency) {
            if(currency&&currency!='Show all currency'&&$scope.currency_filter!=currency) {
                searchOptions.transfer_unit = currency;
                $scope.load(searchOptions);
            }else if(searchOptions.transfer_unit&&currency=='Show all currency'){
                delete searchOptions.transfer_unit;
                $scope.load(searchOptions);
            }
        });
        var drawmap = function(treemap){

            $scope.treemap  = d3.layout.treemap()
                .children(function(d) { return d.children; })
                .sort(function(a, b) { return a.size - b.size; })
                .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
                .round(false);

            $scope.svg = d3.select(".tree-map-data").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.bottom + margin.top)
                .style("margin-left", -margin.left + "px")
                .style("margin.right", -margin.right + "px")
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .style("shape-rendering", "crispEdges");

            $scope.grandparent = $scope.svg.append("g")
                .attr("class", "grandparent");
            $scope.grandparent.append("rect")
                .attr("y", -margin.top)
                .attr("width", width)
                .attr("height", margin.top);

            $scope.grandparent.append("text")
                .attr("x", 6)
                .attr("y", 6 - margin.top)
                .attr("dy", ".75em");

            initialize(treemap);
            accumulate(treemap);
            layout(treemap);
            display(treemap);
        }

        function initialize(root) {
            root.x = root.y = 0;
            root.dx = width;
            root.dy = height;
        }
        function accumulate(d) {

            return d.children
                ? d.size = d.children.reduce(function(p, v) { return p + accumulate(v); }, 0)
                        : d.size;
        }

        function layout(d) {
            if (d.children) {
                var uniques = _.map(_.groupBy(d.children,function(doc){
                    if(doc.name!='') {
                        return doc.name;
                    }
                }),function(grouped){
                    var sum = _.reduce(grouped, function(memo, num){
                        return memo + num.value; }, 0);
                    grouped[0].value =sum;
                    return grouped[0];
                });
                if(uniques.length>0) {
                    $scope.treemap.nodes({children: uniques});
                    uniques.forEach(function (c) {
                        c.x = d.x + c.x * d.dx;
                        c.y = d.y + c.y * d.dy;
                        c.dx *= d.dx;
                        c.dy *= d.dy;
                        c.parent = d;
                        layout(c);
                    });
                }
            }
        }

        function display(d) {
            $scope.grandparent
                .datum(d.parent)
                .on("click", transition)
                .select("text")
                .html(name(d));

            var g1 = $scope.svg.insert("g", ".grandparent")
                .datum(d)

            var g = g1.selectAll("g")
                .data(d.children)
                .enter().append("g")
                .on("mousemove", mousemove)
                .on("mouseout", mouseout);



            g.filter(function(d) { return d.children; })
                .classed("children", true)
                .on("click", transition);

            /* write children rectangles */
            g.selectAll(".child")
                .data(function(d) { return d.children || [d]; })
                .enter().append("rect")
                .attr("class", "child")
                .call(rect)


            g.append("rect")
                .attr("class", "parent")
                .call(rect)


            g.append("foreignObject")
                .call(rect)
                .attr("class","foreignobj")
                .append("xhtml:div")
                .attr("dy", ".75em")
                .html(function(d) { return 'Payment to <b>' + d.name +'</b> '+ (d.value / 1000000).toFixed(1)+' Million'; })
                .attr("class","textdiv");

            function transition(d) {
                if (transitioning || !d) return;
                transitioning = true;

                var g2 = display(d),
                    t1 = g1.transition().duration(750),
                    t2 = g2.transition().duration(750);

                x.domain([d.x, d.x + d.dx]);
                y.domain([d.y, d.y + d.dy]);

                $scope.svg.style("shape-rendering", null);

                g2.selectAll("text").style("fill-opacity", 0);
                g2.selectAll("foreignObject div").style("display", "none");

                t1.selectAll("text").call(text).style("fill-opacity", 0);
                t2.selectAll("text").call(text).style("fill-opacity", 1);
                t1.selectAll("rect").call(rect);
                t2.selectAll("rect").call(rect);

                t1.selectAll(".textdiv").style("display", "none"); /* added */
                t1.selectAll(".foreignobj").call(foreign); /* added */
                t2.selectAll(".textdiv").style("display", "block"); /* added */
                t2.selectAll(".foreignobj").call(foreign); /* added */

                // Remove the old node when the transition is finished.
                t1.remove().each("end", function() {
                    $scope.svg.style("shape-rendering", "crispEdges");
                    transitioning = false;
                });

            }//endfunc transition

            return g;
        }

        function text(text) {
            text.attr("x", function(d) { return x(d.x) + 6; })
                .attr("y", function(d) { return y(d.y) + 6; });
        }



        function rect(rect) {
            rect.attr("x", function(d) { return x(d.x); })
                .attr("y", function(d) { return y(d.y); })
                .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
                .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); })
                .style("background", function(d) { return d.parent ? color(d.name) : null; });
        }

        function foreign(foreign){ /* added */
            foreign.attr("x", function(d) { return x(d.x); })
                .attr("y", function(d) { return y(d.y); })
                .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
                .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });
        }

        function name(d) {
            return d.parent
                ? name(d.parent) + " > " + d.name
                : d.name;
        }


        var mousemove = function(d) {
            var xPosition = d3.event.pageX + 5;
            var yPosition = d3.event.pageY + 5;

            d3.select("#tooltip")
                .style("left", xPosition + "px")
                .style("top", yPosition + "px");
            d3.select("#tooltip")
                .html('<span class="text-center">Payment to </br><b>' + d.name +'</b></br> '+ (d.value / 1000000).toFixed(1)+' Million</p>');
            d3.select("#tooltip").classed("hidden", false);
        };

        var mouseout = function() {
            d3.select("#tooltip").classed("hidden", true);
        };
    });















