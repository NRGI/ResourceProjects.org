'use strict';

angular.module('app')
    .controller('nrgiCountryDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiCountriesSrvc,
        $routeParams
    ) {
        nrgiCountriesSrvc.get({_id: $routeParams.id}, function (response) {
            $scope.country=response;
        });
        //$scope.country =
        //{id:'AO / bl0-kp7ie6',name:'Angola',projectMarkers:[{message:'Malongo North and South',lat:-5.35,lng:12.083333},{message:'Takula',lat:-5.25,lng:11.25},
        //    {message:'Malongo',lat:0,lng: 0},{message:'Mafumeira Norte',lat:0,lng:0},{message:'Malongo West',lat:-5.416667,lng:12.05}],countryMap:{lat:-5.35,lng:12,zoom: 5},
        //    projects:[
        //        {name:'Block 0 A',id:'AO/bl14-jwxky7',commodity:'Oil and Gas',status:'Production',count:'4'},
        //        {name:'Block 0 A',id:'AO/bl14-jwxky7',commodity:'Oil and Gas',status:'Production',count:'4'},
        //        {name:'Block 0 B',id:'AO/bl14-jwxky7',commodity:'Oil and Gas',status:'Production',count:'4'},
        //        {name:'Block 14',id:'AO/bl14-jwxky7',commodity:'Oil and Gas',status:'Production',count:'4'},
        //        {name:'Block 15',id:'AO/bl14-jwxky7',commodity:'Oil and Gas',status:'Production',count:'4'},
        //        {name:'Block 17',id:'AO/bl14-jwxky7',commodity:'Oil and Gas',status:'Production',count:'4'},
        //        {name:'Block 18',id:'AO/bl14-jwxky7',commodity:'Oil and Gas',status:'Production',count:'4'},
        //        {name:'Block 2/05',id:'AO/bl14-jwxky7',commodity:'Oil and Gas',status:'Production',count:'4'},
        //        {name:'Block 2/85',id:'AO/bl14-jwxky7',commodity:'Oil and Gas',status:'Production',count:'4'}
        //    ],
        //    companies:[{name:'Chevron',idCompany:'19e2204591b91eae',group:'Chevron',idGroup:'Chevron'},
        //    {name:'ENI',idCompany:'19e2204591b91eae',group:'ENI',idGroup:'ENI'},
        //    {name:'Sonangol',idCompany:'19e2204591b91eae',group:'Sonangol',idGroup:'Sonangol'},
        //    {name:'Total',idCompany:'19e2204591b91eae',group:'Total',idGroup:'Total'}],
        //    payments:[
        //        {year:'2009',project:'South Omo',projectId:'ET/soom-1xt6qc',paidBy:'Tullow Oil Plc',paidById:'23f5781a0538dc18',type:'License fees, rental fees, entry fees, and other considerations for licenses and/or concessions',currency:'USD',value:'176000',receipt:'CompanyPayment',id:'ET/2c6a34b8d282a018'},
        //    ]
        //
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



