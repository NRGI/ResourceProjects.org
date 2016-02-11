'use strict';

angular.module('app')
    .controller('nrgiCompanyDetailCtrl', function (
        $scope,
        $routeParams,
        nrgiCompaniesSrvc
        //nrgiAuthSrvc,
        //nrgiIdentitySrvc,
        //nrgiCountriesSrvc
    ) {
        nrgiCompaniesSrvc.get({_id: $routeParams.id}, function (success) {
            $scope.company = success;
        });
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
        //nrgiCountriesSrvc.getAllCountries().then(function(countries) {
        //    $scope.countries=countries;
        //});
        //nrgiCompaniesSrvc.getCompanyById($routeParams.id).then(function(success) {
        //    angular.forEach(success.countries_of_operation,function(item){
        //        var countries_of_operation = item.country;
        //        angular.forEach($scope.countries,function(country){
        //            if(country._id == countries_of_operation){
        //                item.name=country.name;
        //            }
        //        })
        //    })
        //    $scope.company=success;
        //});
        //    $scope.company =
        //{id:'92dc0bd39f65ed90',name:'Gold Fields Ghana Limited',openCorporates:'https://opencorporates.com/companies/au/153067639',website:'https://www.goldfields.com/',group:'Gold Fields',groupId:'Gold Fields',country:'South Africa',countryMap:{lat:-5.35,lng:12,zoom: 5},
        //    countryId:'MX',
        //    projectMarkers:[{message:'Malongo North and South',lat:-5.35,lng:12.083333},{message:'Takula',lat:-5.25,lng:11.25},
        //        {message:'Malongo',lat:0,lng: 0},{message:'Mafumeira Norte',lat:0,lng:0},{message:'Malongo West',lat:-5.416667,lng:12.05}],
        //    projects:[
        //        {name:'Damang Mine',id:'AO/bl14-jwxky7',country:'Ghana',countryId:'GH',type:'Mining'},
        //        {name:'Tarkwa Mine',id:'AO/bl14-jwxky7',country:'Ghana',countryId:'GH',type:'Mining'}
        //    ],
        //    payments:[
        //        {year:'2006', paidTo:'Prestea Huni Valley (Ghana)',paidToId:'92dc0bd39f65ed90',type:'Other',currency:'GHS',value:'23714',receipt:'GovernmentReceipt',id:'ET/2c6a34b8d282a018'},
        //    ]
        //};

    //});

