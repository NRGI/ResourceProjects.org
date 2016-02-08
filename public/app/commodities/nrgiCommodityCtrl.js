'use strict';

angular.module('app')
    .controller('nrgiCommodityCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiCommoditiesSrvc,
        $routeParams
    ) {
        nrgiCommoditiesSrvc.getCoommodityById($routeParams.id).then(function(response) {
            $scope.commodity=response;
        });
        //$scope.commodity =
        //{id:'Antimony',name:'Antimony',countryMap:{lat:-5.35,lng:12,zoom: 5},
        //    projectMarkers:[{message:'Malongo North and South',lat:-5.35,lng:12.083333},{message:'Takula',lat:-5.25,lng:11.25},
        //        {message:'Malongo',lat:0,lng: 0},{message:'Mafumeira Norte',lat:0,lng:0},{message:'Malongo West',lat:-5.416667,lng:12.05}],
        //    projects:[
        //        {name:'Estaci&oacute;n Madero',id:'AO/bl14-jwxky7',country:'Ghana',countryId:'GH'},
        //        {name:'Tarkwa Mine',id:'AO/bl14-jwxky7',country:'Ghana',countryId:'GH'}
        //    ],
        //    companies:[{name:'Chevron',idCompany:'19e2204591b91eae',group:'Chevron',idGroup:'Chevron'},
        //        {name:'ENI',idCompany:'19e2204591b91eae',group:'ENI',idGroup:'ENI'},
        //        {name:'Sonangol',idCompany:'19e2204591b91eae',group:'Sonangol',idGroup:'Sonangol'},
        //        {name:'Total',idCompany:'19e2204591b91eae',group:'Total',idGroup:'Total'}]
        //};
        var tilesDict = {
            openstreetmap: {
                url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
                options: {
                    attribution: 'Tiles: &copy; Esri'
                }
            }
        };
        angular.extend($scope, {
            tiles: tilesDict.openstreetmap,
            defaults: {
                scrollWheelZoom: false
            },
            controls: {
                fullscreen: {
                    position: 'topleft'
                }
            }
        });
    });

