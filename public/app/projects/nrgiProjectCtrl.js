'use strict';

angular.module('app')
    .controller('nrgiProjectCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc
    ) {
        $scope.project =
            {id:'AO / bl0-kp7ie6',name:'Block 0 A',country:'Angola',countryMap:{lat:-5.35,lng:12,zoom: 5},
                id_country:'MX',aliases:[{name:'BLOCO 0 A'}, {name:'Block 0- Area A offshore'}],types:[{type:'Oil and Gas'},{type:''}],
                number:'1',commodities:[{id:'Oil',name:'Oil'},{id:'',name:''}], status:'Production (True at: 2014-01-01)',
            contracts:'', concessions:'',
                projectMarkers:[{message:'Malongo North and South',lat:-5.35,lng:12.083333},{message:'Takula',lat:-5.25,lng:11.25},
                {message:'Malongo',lat:0,lng: 0},{message:'Mafumeira Norte',lat:0,lng:0},{message:'Malongo West',lat:-5.416667,lng:12.05}],
                companies:[{name:'Chevron',idCompany:'19e2204591b91eae',group:'Chevron',idGroup:'Chevron'},
                    {name:'ENI',idCompany:'19e2204591b91eae',group:'ENI',idGroup:'ENI'},
                    {name:'Sonangol',idCompany:'19e2204591b91eae',group:'Sonangol',idGroup:'Sonangol'},
                    {name:'Total',idCompany:'19e2204591b91eae',group:'Total',idGroup:'Total'}],
                productionStats:[
                    {year:'2009',volume:'66,434,608', unit:'bbl',commodityId:'Oil',commodity:'Oil', price:'55', pricePerUnit:'$/bbl', id:'AO/127434e6d53d5b8e' },
                    {year:'2010',volume:'81,385,321', unit:'bbl',commodityId:'Oil',commodity:'Oil', price:'78', pricePerUnit:'$/bbl', id:'AO/127434e6d53d5b8e' },
                    {year:'2011',volume:'78,096,417', unit:'bbl',commodityId:'Oil',commodity:'Oil', price:'108', pricePerUnit:'$/bbl', id:'AO/127434e6d53d5b8e' },
                    {year:'2012',volume:'70,509,246', unit:'bbl',commodityId:'Oil',commodity:'Oil', price:'112', pricePerUnit:'$/bbl', id:'AO/127434e6d53d5b8e' },
                    {year:'2013',volume:'60,988,474', unit:'bbl',commodityId:'Oil',commodity:'Oil', price:'109', pricePerUnit:'$/bbl', id:'AO/127434e6d53d5b8e' },
                    {year:'2014',volume:'61,034,759', unit:'bbl',commodityId:'Oil',commodity:'Oil', price:'103', pricePerUnit:'$/bbl', id:'AO/127434e6d53d5b8e' }
                ],
                payments:[
                    {year:'2009',paidBy:'',paidById:'',paidTo:'Angola',paidToId:'AO',type:'Total',currency:'USD',value:'1394922844',receipt:'GovernmentReceipt',id:'AO/761c868699c0bf3e'},
                    {year:'2010',paidBy:'',paidById:'',paidTo:'Angola',paidToId:'AO',type:'Total',currency:'USD',value:'3318197309',receipt:'GovernmentReceipt',id:'AO/761c868699c0bf3e'},
                    {year:'2011',paidBy:'',paidById:'',paidTo:'Angola',paidToId:'AO',type:'Total',currency:'USD',value:'5064533498',receipt:'GovernmentReceipt',id:'AO/761c868699c0bf3e'},
                    {year:'2012',paidBy:'',paidById:'',paidTo:'Angola',paidToId:'AO',type:'Total',currency:'USD',value:'4724351674',receipt:'GovernmentReceipt',id:'AO/761c868699c0bf3e'},
                    {year:'2013',paidBy:'',paidById:'',paidTo:'Angola',paidToId:'AO',type:'Total',currency:'USD',value:'3024036542',receipt:'GovernmentReceipt',id:'AO/761c868699c0bf3e'},
                    {year:'2014',paidBy:'',paidById:'',paidTo:'Angola',paidToId:'AO',type:'Total',currency:'USD',value:'2715227235',receipt:'GovernmentReceipt',id:'AO/761c868699c0bf3e'}
                ]

            };
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





