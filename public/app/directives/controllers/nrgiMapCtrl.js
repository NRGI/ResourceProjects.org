'use strict';

angular
    .module('app')
    .controller('nrgiMapCtrl', function ($scope,$rootScope, nrgiMainMapSrvc, $http,usSpinnerService,$location) {

        usSpinnerService.spin('spinner-map');
        var zoom = d3.behavior.zoom()
            .scaleExtent([0.7, 8])
            .on("zoom", zoomed);
        var width = 635,
            height = 450;
        var tooltip = d3.select('.map_data').append('div')
            .attr('class', 'hidden tooltip');
        $scope.projCheckbox =true;
        $scope.paymentsCheckbox =true;
        $scope.count = 2;
        var g, color, coords, circle, element, mouse;

        nrgiMainMapSrvc.get({ }, function (success) {
            if(success.data && success.world ) {
                $scope.resourceproject = success.data;
                $scope.capitals = success.world;
                drawmap();
            }else{
                console.log('Error')
            }
        })
        function drawmap() {
            d3.xml("../../assets/worldWithAntarcticaHigh.svg", function(xml) {
                d3.select(".map_data").node()
                    .appendChild(xml.documentElement)
                d3.select("svg")
                    .attr("width", width)
                    .attr("height", height)
                d3.select("g").attr("transform", "translate(0,0)scale(0.7)")
                d3.select("rect")
                    .attr("class", "overlay")
                    .attr("width", width)
                    .attr("height", height)
                    .call(zoom)
                g = d3.select("g")
                $scope.countries = g.selectAll(".land")
                    .attr("project_count", function () {
                        return 0;
                    })
                    .attr("transfer_count", function () {
                        return 0
                    })
                    .on("mousemove", mouseover)
                    .on("mouseout", mouseout)
                    .on('click', clickCountry)
                angular.forEach($scope.resourceproject,function(resourceproject){
                    angular.forEach($scope.countries[0],function(country){
                        if(country.id == resourceproject.iso2) {
                            d3.select('#' + country.id)
                                .attr("class", function () {
                                    color = getGroup(resourceproject.project_count);
                                    return "subunit-boundary subunit Group" + color + " " + country.id;
                                })
                                .attr("project_count", function () {
                                    return resourceproject.project_count;
                                })
                                .attr("transfer_count", function () {
                                    return resourceproject.transfer_count;
                                })
                                .on("mousemove", mouseover)
                                .on("mouseout", mouseout)
                                .on('click', clickCountry)
                            coords = $scope.capitals.filter(function (item) {
                                return item.iso2 === country.id;
                            });
                            coords = coords[0];
                            if (coords) {
                                circle = d3.select("g").append('circle')
                                    .attr("class", function () {
                                        color = 0;
                                        if (resourceproject.transfer_count > 0) {
                                            color = 1
                                        }
                                        return "bubble-boundary bubble Group" + color + " " + country.id;
                                    })
                                    .attr("transfer_count", function () {
                                        return resourceproject.transfer_count;
                                    }).attr("project_count", function () {
                                        return resourceproject.project_count;
                                    }).attr("title", function () {
                                        return  d3.select('#' + country.id).attr('title');
                                    }).attr("id", function () {
                                        return  country.id;
                                    })
                                    .attr("d", $scope.path)
                                    .attr("transform", function (d) {
                                        element = d3.select('#' + country.id).node();
                                        if(element.getBBox().width>50 && element.getBBox().height>50) {
                                            if (coords.lat >= 0 && coords.long >= 0) {
                                                return "translate(" + [element.getBBox().x + coords.lat / 2, element.getBBox().y + coords.long / 2] + ")";
                                            } else {
                                                return "translate(" + [element.getBBox().x + element.getBBox().width - Math.abs(coords.lat),
                                                        element.getBBox().y + element.getBBox().height - Math.abs(coords.long) / 2] + ")";
                                            }
                                        }else{
                                            return "translate(" + [element.getBBox().x  + element.getBBox().width/2, element.getBBox().y + element.getBBox().height/2] + ")";
                                        }
                                    })
                                    .attr("r", function (d) {
                                        return radius(resourceproject.transfer_count);
                                    })
                                    .on('click', clickCountry)
                                    .on("mousemove", mouseover)
                                    .on("mouseout", mouseout)
                            }
                        }
                    })
                })
            });
            usSpinnerService.stop('spinner-map');
        }

        function zoomed() {
            g.attr("transform",
                "translate(" + zoom.translate() + ")" +
                "scale(" + zoom.scale() + ")"
            );
            g.select("land").style("stroke-width", 1 / zoom.scale() + "px");
        }
        function mouseover() {
            mouse = d3.mouse(d3.select('rect').node()).map(function(d) { return parseInt(d); });
            d3.select(this).style("cursor", "pointer")
            tooltip.classed('hidden', false)
                .attr('style', 'left:' + (mouse[0] +35) + 'px; top:' + (mouse[1] ) + 'px')
                .html("<p>" + d3.select(this).attr("title") +  "<br> Projects: " + d3.select(this).attr("project_count") + "<br> Payments:"  + d3.select(this).attr("transfer_count") + "</p>");
        }
        function mouseout() {
            g.selectAll("." +d3.select(this).attr("id"))
            d3.select(this).style("cursor", "default")
            tooltip.classed('hidden', true);

        }
        function clickCountry() {
            console.log(d3.select(this).attr("id"))
            $location.path('/country/'+d3.select(this).attr("id"));
            $scope.$apply()
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
            else if (value < 1) return 4;
            else if (value < 10) return 5
            else if (value < 15) return 6;
            else if (value < 30) return 7;
            else if (value < 50) return 8;
            else return 9;
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
                    return "bubble-boundary bubble Group0 " + d3.select(this).attr("id");
                })
            }
            if(type =='projCheckbox' && check==false){
                d3.select('.map_data').selectAll('.subunit')
                    .attr("class", function (d) {
                        return "subunit-boundary subunit Group1 " + d3.select(this).attr("id");
                    })
            }
            if(type =='projCheckbox' && check==true){
                g.selectAll(".subunit")
                    .attr("class", function (d) {
                        color = getGroup(d3.select(this).attr("project_count"));
                        return "subunit-boundary subunit Group" + color + " " + d3.select(this).attr("id");
                    })
            }
            if(type =='paymentsCheckbox' && check==true) {
                g.selectAll(".bubble")
                    .attr("class", function (d) {
                        color = 0;
                        if (d3.select(this).attr("transfer_count") > 0) {
                            color = 1
                        }
                        return "bubble-boundary bubble Group" + color + " " + d3.select(this).attr("id");
                    })
            }
        }
    });
