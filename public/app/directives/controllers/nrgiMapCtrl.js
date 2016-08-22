'use strict';

angular
    .module('app')
    .controller('nrgiMapCtrl', function ($scope,$rootScope, nrgiMainMaprvc, $http,usSpinnerService) {

        usSpinnerService.spin('spinner-map');
        nrgiMainMaprvc.get({ }, function (success) {
            $scope.resourceproject = success.data;
            $scope.world = success.world;
            $scope.subunits = topojson.feature($scope.world,$scope.world.objects.world_subunits).features;
            $scope.countrycodes = $scope.world.objects.world_subunits.geometries;
            angular.forEach($scope.subunits,function(subunits){
                angular.forEach($scope.countrycodes,function(countrycodes){
                    if(subunits.id == countrycodes.id){
                        subunits.iso2 = countrycodes.iso2;
                        subunits.project_count = 0;
                        subunits.transfer_count = 0;
                    }
                })
                angular.forEach($scope.resourceproject,function(resourceproject){
                    if(subunits.iso2 == resourceproject.iso2){
                        subunits.project_count = resourceproject.project_count;
                        subunits.transfer_count = resourceproject.transfer_count;
                    }
                })
            });
            $scope.path = d3.geo.path()
                .projection(projection);
            g = svg.append("g")
            $scope.countries = g.selectAll(".subunit")
                .data($scope.subunits)
                .enter();
            drawmap();
            usSpinnerService.stop('spinner-map');

        })
        $scope.projCheckbox =true;
        $scope.paymentsCheckbox =true;
        $scope.count = 2;

        var width = 635,
             height = 450;

        var projection = d3.geo.mercator()
            .translate([width / 2, height / 2])
            .scale((width - 1) / 2 / Math.PI);

        var zoom = d3.behavior.zoom()
            .scaleExtent([1, 8])
            .on("zoom", zoomed);

        var svg = d3.select(".map_data").append("svg")
            .attr("width", width)
            .attr("height", height)

        var g = svg.append("g")

        var tooltip = d3.select('.map_data').append('div')
            .attr('class', 'hidden tooltip');

        svg.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .call(zoom)
            .call(zoom.event);

        function drawmap() {
            $scope.countries.append("path")
                .attr("class", function (d) {
                    var color = getGroup(d.project_count);
                    return "subunit-boundary subunit Group" + color + " " + d.id;
                })
                .attr("d", $scope.path)
                .on("mousemove", mouseover)
                .on("mouseout", mouseout)

            var circle = $scope.countries.append('circle')
                .attr("class", function (d) {
                    var color = 0;
                    if (d.transfer_count > 0) {
                        color = 1
                    }
                    return "bubble-boundary bubble Group" + color + " " + d.id;
                })
                .attr("transform", function (d) {
                    return "translate(" + $scope.path.centroid(d) + ")";
                })
                .attr("r", function (d) {
                    return radius(d.transfer_count);
                })
                .attr("d", $scope.path)
                .on("mousemove", mouseover)
                .on("mouseout", mouseout)
            usSpinnerService.stop('spinner-map');
        }

        function zoomed() {
            g.attr("transform",
                "translate(" + zoom.translate() + ")" +
                "scale(" + zoom.scale() + ")"
            );
            g.select("subunit-boundary").style("stroke-width", 1 / zoom.scale() + "px");
        }

        function mouseover(d) {
            var mouse = d3.mouse(g.node()).map(function(d) { return parseInt(d); });
            //g.selectAll("." + d.id)
            //    .attr("class", function(d) { return "subunit-boundary subunit Group0" + " " + d.id});
            tooltip.classed('hidden', false)
                .attr('style', 'left:' + (mouse[0] +35) + 'px; top:' + (mouse[1] ) + 'px')
                .html("<p>" + d.properties.name +  "<br> Projects: " + d.project_count + "<br> Payments:"  + d.transfer_count + "</p>");
        }

        function mouseout(d) {
            g.selectAll("." + d.id)
                //.attr("class", function(d) {
                //    iso2 = getiso2(d.id)
                //    var value = getprojectnum(iso2);
                //    var color = getGroup(value);
                //    return "subunit-boundary subunit Group" + color + " " + d.id});
            tooltip.classed('hidden', true);

        }
        function getGroup(value) {
            if (value < 1) return 1;
            else if (value < 2) return 2;
            else if (value < 5) return 3
            else if (value < 10) return 4;
            else if (value < 15) return 5;
            else if (value < 20) return 6;
            else if (value < 50) return 7;
            else if (value < 100) return 8;
            else if (value < 150) return 9;
            else return 10;
        }
        function radius(value) {
            if (value < 0) return 0;
            else if (value < 1) return 1;
            else if (value < 10) return 2
            else if (value < 15) return 3;
            else if (value < 30) return 4;
            else if (value < 50) return 5;
            else return 6;
        }
        function interpolateZoom (translate, scale) {
            var self = this;
            return d3.transition().duration(350).tween("zoom", function () {
                var iTranslate = d3.interpolate(zoom.translate(), translate),
                    iScale = d3.interpolate(zoom.scale(), scale);
                return function (t) {
                    zoom
                        .scale(iScale(t))
                        .translate(iTranslate(t));
                    zoomed();
                };
            });
        }

        function zoomClick() {
            var clicked = d3.event.target,
                direction = 1,
                factor = 0.2,
                target_zoom = 1,
                center = [width / 2, height / 2],
                extent = zoom.scaleExtent(),
                translate = zoom.translate(),
                translate0 = [],
                l = [],
                view = {x: translate[0], y: translate[1], k: zoom.scale()};

            d3.event.preventDefault();
            direction = (this.id === 'zoomIn') ? 1 : -1;
            target_zoom = zoom.scale() * (1 + factor * direction);

            if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

            translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
            view.k = target_zoom;
            l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

            view.x += center[0] - l[0];
            view.y += center[1] - l[1];

            interpolateZoom([view.x, view.y], view.k);
        }

        d3.selectAll('button').on('click', zoomClick);
        d3.select(self.frameElement).style("height", height + "px");

        $scope.checked = function(check,type){
            if(check==false){$scope.count--;}else{ $scope.count++;}
            if(type =='paymentsCheckbox' && check==false){
                d3.select('.map_data').selectAll('.bubble').attr("class", function (d) {
                    return "bubble-boundary bubble Group0 " + d.id;
                })
            }
            if(type =='projCheckbox' && check==false){
                d3.select('.map_data').selectAll('.subunit')
                    .attr("class", function (d) {
                        return "subunit-boundary subunit Group1 " + d.id;
                    })
            }
            if(type =='projCheckbox' && check==true){
                g.selectAll(".subunit")
                    .attr("class", function (d) {
                        var color = getGroup(d.project_count);
                        return "subunit-boundary subunit Group" + color + " " + d.id;
                    })
            }
            if(type =='paymentsCheckbox' && check==true) {
                g.selectAll(".bubble")
                    .attr("class", function (d) {
                        var color = 0;
                        if (d.transfer_count > 0) {
                            color = 1
                        }
                        return "bubble-boundary bubble Group" + color + " " + d.id;
                    })
            }
        }
    });
