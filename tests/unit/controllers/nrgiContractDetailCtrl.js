describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var scope,
        controllerService,
        httpMock,
        ID = 'ocds-591adf-PH9670211788RC',
        data = {
            "_id": "56a2eb4345d114c30439ec22",
            "contract_id": "ocds-591adf-PH9670211788RC",
            "__v": 0,
            "rc_info": {},
            "commodities": [],
            "commodity": [],
            "projects": [],
            "concessions": [{
                "_id": "56a2b8236e585b7316655794",
                "concession_name": "Block A",
                "concession_country": {
                    "iso2": "AD",
                    "name": "Andorra",
                    "_id": "56f8c98288a7024614708e98",
                    "__v": 0,
                    "country_aliases": []
                },
                "concession_type": {
                    "source": "56747e060e8cc07115200ee6",
                    "string": "offshore",
                    "_id": "56f8c98288a7024614708fd8",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                "concession_commodities": [{
                    "source": "56747e060e8cc07115200ee5",
                    "commodity": {
                        "commodity_name": "Ferrochrome",
                        "commodity_type": "mining",
                        "commodity_id": "ferrochrome",
                        "_id": "56f8c98288a702461470903c",
                        "__v": 0,
                        "commodity_aliases": []
                    },
                    "_id": "56f8c98288a7024614708fd7",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "source": "56747e060e8cc07115200ee5",
                    "commodity": {
                        "commodity_name": "Ferrochrome",
                        "commodity_type": "mining",
                        "commodity_id": "ferrochrome",
                        "_id": "56f8c98288a702461470903c",
                        "__v": 0,
                        "commodity_aliases": []
                    },
                    "_id": "56f8c98288a7024614708fd6",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }],
                "concession_status": [{
                    "source": "56747e060e8cc07115200ee6",
                    "_id": "56f8c98288a7024614708fd9",
                    "timestamp": "2016-03-28T06:04:49.727Z",
                    "string": "exploration"
                }],
                "concession_polygon": [{
                    "loc": [11.748649323579226, -17.210253839242714],
                    "_id": "56f8c98288a7024614708fd5",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.307674202275505, -17.210102480701448],
                    "_id": "56f8c98288a7024614708fd4",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.310530637241978, -16.400985109343015],
                    "_id": "56f8c98288a7024614708fd3",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.812405260618743, -16.401159036494015],
                    "_id": "56f8c98288a7024614708fd2",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.816784178829087, -16.508152467400027],
                    "_id": "56f8c98288a7024614708fd1",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.813456662642464, -16.60839467745107],
                    "_id": "56f8c98288a7024614708fd0",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.81393202209779, -16.701299832830344],
                    "_id": "56f8c98288a7024614708fcf",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.80394947353795, -16.731802955904314],
                    "_id": "56f8c98288a7024614708fce",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.800146597895962, -16.77823117187359],
                    "_id": "56f8c98288a7024614708fcd",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.784935095328619, -16.781872121336452],
                    "_id": "56f8c98288a7024614708fcc",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.767822154940232, -16.767763053628805],
                    "_id": "56f8c98288a7024614708fcb",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.741202025447263, -16.711316321438986],
                    "_id": "56f8c98288a7024614708fca",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.73787450926064, -16.663961021315856],
                    "_id": "56f8c98288a7024614708fc9",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.729318039066445, -16.63891261377925],
                    "_id": "56f8c98288a7024614708fc8",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.71648333377514, -16.50678516812883],
                    "_id": "56f8c98288a7024614708fc7",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.709828301401888, -16.499948526745378],
                    "_id": "56f8c98288a7024614708fc6",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.694141439379218, -16.502227434060607],
                    "_id": "56f8c98288a7024614708fc5",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.66514451261008, -16.542331804535664],
                    "_id": "56f8c98288a7024614708fc4",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.713155817588515, -16.690372155115245],
                    "_id": "56f8c98288a7024614708fc3",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.73787450926064, -16.75638401060223],
                    "_id": "56f8c98288a7024614708fc2",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.769248233305914, -16.793249638635288],
                    "_id": "56f8c98288a7024614708fc1",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.762593200932665, -16.815547594428416],
                    "_id": "56f8c98288a7024614708fc0",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.773526468402993, -16.847397267462977],
                    "_id": "56f8c98288a7024614708fbf",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.771149671126858, -16.880606216395435],
                    "_id": "56f8c98288a7024614708fbe",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.754987449648992, -16.90607761674285],
                    "_id": "56f8c98288a7024614708fbd",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.749283136186163, -17.101546585959174],
                    "_id": "56f8c98288a7024614708fbc",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [11.748649323579226, -17.210253839242714],
                    "_id": "56f8c98288a7024614708fbb",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }]
            }, {
                "_id": "56a2b8236e585b731665579d",
                "concession_name": "Block B",
                "concession_country": {
                    "iso2": "AD",
                    "name": "Andorra",
                    "_id": "56f8c98288a7024614708e98",
                    "__v": 0,
                    "country_aliases": []
                },
                "concession_type": {
                    "source": "56747e060e8cc07115200ee5",
                    "string": "offshore",
                    "_id": "56f8c98288a7024614708ff7",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                "concession_commodities": [{
                    "source": "56747e060e8cc07115200ee5",
                    "commodity": {
                        "commodity_name": "Ferrochrome",
                        "commodity_type": "mining",
                        "commodity_id": "ferrochrome",
                        "_id": "56f8c98288a702461470903c",
                        "__v": 0,
                        "commodity_aliases": []
                    },
                    "_id": "56f8c98288a7024614708ff6",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }],
                "concession_status": [{
                    "source": "56747e060e8cc07115200ee5",
                    "_id": "56f8c98288a7024614708ff8",
                    "timestamp": "2016-03-28T06:04:49.727Z",
                    "string": "exploration"
                }],
                "concession_polygon": [{
                    "loc": [-20.748649323579226, -17.210253839242714],
                    "_id": "56f8c98288a7024614708ff5",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.307674202275503, -17.210102480701448],
                    "_id": "56f8c98288a7024614708ff4",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.31053063724198, -16.400985109343015],
                    "_id": "56f8c98288a7024614708ff3",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.812405260618743, -16.401159036494015],
                    "_id": "56f8c98288a7024614708ff2",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.81678417882909, -16.508152467400027],
                    "_id": "56f8c98288a7024614708ff1",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.813456662642466, -16.60839467745107],
                    "_id": "56f8c98288a7024614708ff0",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.81393202209779, -16.701299832830344],
                    "_id": "56f8c98288a7024614708fef",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.80394947353795, -16.731802955904314],
                    "_id": "56f8c98288a7024614708fee",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.800146597895964, -16.77823117187359],
                    "_id": "56f8c98288a7024614708fed",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.78493509532862, -16.781872121336452],
                    "_id": "56f8c98288a7024614708fec",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.767822154940234, -16.767763053628805],
                    "_id": "56f8c98288a7024614708feb",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.74120202544726, -16.711316321438986],
                    "_id": "56f8c98288a7024614708fea",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.73787450926064, -16.663961021315856],
                    "_id": "56f8c98288a7024614708fe9",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.729318039066445, -16.63891261377925],
                    "_id": "56f8c98288a7024614708fe8",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.716483333775138, -16.50678516812883],
                    "_id": "56f8c98288a7024614708fe7",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.70982830140189, -16.499948526745378],
                    "_id": "56f8c98288a7024614708fe6",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.69414143937922, -16.502227434060607],
                    "_id": "56f8c98288a7024614708fe5",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.66514451261008, -16.542331804535664],
                    "_id": "56f8c98288a7024614708fe4",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.713155817588515, -16.690372155115245],
                    "_id": "56f8c98288a7024614708fe3",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.73787450926064, -16.75638401060223],
                    "_id": "56f8c98288a7024614708fe2",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.769248233305913, -16.793249638635288],
                    "_id": "56f8c98288a7024614708fe1",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.762593200932663, -16.815547594428416],
                    "_id": "56f8c98288a7024614708fe0",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.77352646840299, -16.847397267462977],
                    "_id": "56f8c98288a7024614708fdf",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.771149671126857, -16.880606216395435],
                    "_id": "56f8c98288a7024614708fde",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.754987449648993, -16.90607761674285],
                    "_id": "56f8c98288a7024614708fdd",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.749283136186165, -17.101546585959174],
                    "_id": "56f8c98288a7024614708fdc",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "loc": [-20.748649323579226, -17.210253839242714],
                    "_id": "56f8c98288a7024614708fdb",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }]
            }],
            "sites": [{
                "_id": "56eb117c0007bf5b2a3e4b71",
                "field": false,
                "site_name": "Test site 1",
                "site_country": [{
                    "source": "56747e060e8cc07115200ee3",
                    "country": {
                        "iso2": "AD",
                        "name": "Andorra",
                        "_id": "56f8c98288a7024614708e98",
                        "__v": 0,
                        "country_aliases": []
                    },
                    "_id": "56f8c98288a7024614709006",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }],
                "site_commodity": [{
                    "source": "56747e060e8cc07115200ee3",
                    "commodity": {
                        "commodity_name": "Marble",
                        "commodity_type": "mining",
                        "commodity_id": "marble",
                        "_id": "56f8c98288a70246147090a5",
                        "__v": 0,
                        "commodity_aliases": []
                    },
                    "_id": "56f8c98288a7024614709004",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "source": "56747e060e8cc07115200ee3",
                    "commodity": {
                        "commodity_name": "Chromite",
                        "commodity_type": "mining",
                        "commodity_id": "chromite",
                        "_id": "56f8c98288a702461470903b",
                        "__v": 0,
                        "commodity_aliases": []
                    },
                    "_id": "56f8c98288a7024614709003",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }, {
                    "source": "56747e060e8cc07115200ee6",
                    "commodity": {
                        "commodity_name": "Ferrotitanium",
                        "commodity_type": "mining",
                        "commodity_id": "ferrotitanium",
                        "_id": "56f8c98288a702461470900f",
                        "__v": 0,
                        "commodity_aliases": []
                    },
                    "_id": "56f8c98288a7024614709002",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }],
                "site_status": [{
                    "source": "56747e060e8cc07115200ee3",
                    "_id": "56f8c98288a7024614709001",
                    "timestamp": "2016-03-28T06:04:49.836Z",
                    "string": "exploration"
                }]
            }, {
                "_id": "56eb117c0007bf5b2a3e4b76",
                "field": true,
                "site_name": "Test field 1",
                "site_country": [{
                    "source": "56747e060e8cc07115200ee3",
                    "country": {
                        "iso2": "AD",
                        "name": "Andorra",
                        "_id": "56f8c98288a7024614708e98",
                        "__v": 0,
                        "country_aliases": []
                    },
                    "_id": "56f8c98288a702461470900a",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }],
                "site_commodity": [{
                    "source": "56747e060e8cc07115200ee6",
                    "commodity": {
                        "commodity_name": "Ferrotitanium",
                        "commodity_type": "mining",
                        "commodity_id": "ferrotitanium",
                        "_id": "56f8c98288a702461470900f",
                        "__v": 0,
                        "commodity_aliases": []
                    },
                    "_id": "56f8c98288a7024614709002",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }],
                "site_status": [{
                    "source": "56747e060e8cc07115200ee6",
                    "_id": "56f8c98288a7024614709008",
                    "timestamp": "2016-03-28T06:04:49.836Z",
                    "string": "development"
                }]
            }],
            "location": [{
                "lat": 14.15392307,
                "lng": 19.50168983,
                "message": "Test site 1",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "site",
                "id": "56eb117c0007bf5b2a3e4b71"
            }, {
                "lat": 31.15392307,
                "lng": 47.50168983,
                "message": "Test field 1",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "field",
                "id": "56eb117c0007bf5b2a3e4b76"
            }],
            "site_coordinates": {"sites": [], "fields": []}
        }

    beforeEach(inject(function ($rootScope, $controller, $httpBackend) {
        scope = $rootScope.$new();
        controllerService = $controller;
        httpMock = $httpBackend;
    }));

    it("should get 'ocds-591adf-PH9670211788RC' from '/api/contract'", function () {

        httpMock.expectGET('/api/contracts/' + ID).respond(data);

        ctrl = controllerService('nrgiContractDetailCtrl', {
            $scope: scope,
            $routeParams:{
                id: ID
            }
        });

        httpMock.flush();

        expect(scope.contract.contract_id).toEqual(ID);
    });
});
