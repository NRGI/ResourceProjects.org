'use strict';

angular.module('app')
    .controller('nrgiGroupDetailCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc,
        nrgiCompaniesSrvc,
        $routeParams
    ) {
        $scope.record_type = 'companyGroups';
        nrgiCompaniesSrvc.get({_id: $routeParams.id,record_type:$scope.record_type}, function (success) {
            console.log(success);
            $scope.group=success;
        });
        //$scope.group =
        //{id:'AnglogoldAshanti',name:'Anglogold Ashanti',countryMap:{lat:-5.35,lng:12,zoom: 5},
        //    countryId:'MX',
        //    projectMarkers:[{message:'Malongo North and South',lat:-5.35,lng:12.083333},{message:'Takula',lat:-5.25,lng:11.25},
        //        {message:'Malongo',lat:0,lng: 0},{message:'Mafumeira Norte',lat:0,lng:0},{message:'Malongo West',lat:-5.416667,lng:12.05}],
        //    companies:[
        //        {name:'Anglogold Ashanti Ghana Limited',id:'AO/'}
        //    ],
        //    projects:[
        //    {name:'Damang Mine',id:'AO/bl14-jwxky7',country:'Ghana',countryId:'GH',type:'Mining'},
        //    {name:'Tarkwa Mine',id:'AO/bl14-jwxky7',country:'Ghana',countryId:'GH',type:'Mining'}
        //    ],
        //    payments:[
        //        {year:'2006', paidBy:'Anglogold Ashanti Ghana Limited',paidById:'d06a1478172a28f6',paidTo:'Ghana',paidToId:'GH',type:'Other',currency:'GHS',value:'23714',receipt:'GovernmentReceipt',id:'ET/2c6a34b8d282a018'},
        //    ]
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
