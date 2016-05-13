describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var scope,
        controllerService,
        httpMock,
        ID = '56a2b8236e585b7316655794',
        data = {
            "_id": "56a2b8236e585b7316655794",
            "concession_name": "Block A",
            "concession_established_source": "56747e060e8cc07115200ee6",
            "description": "<p>yes</p><p>no</p>",
            "oo_concession_id": "junkid",
            "oo_url_api": "http://api.openoil.net/concession/BR/ES-M-525",
            "oo_url_wiki": "http://repository.openoil.net/wiki/Brazil",
            "oo_source_date": "2016-03-28T06:04:50.385Z",
            "oo_details": {
                "Vencimento1º": "20.01.2012",
                "Operador": "Petrobras",
                "Observacao": "",
                "Contrato": "BM-ES-23",
                "Concessionários": "*Petrobras - 65%, Inpex - 15%, PTTEP Brasil - 20%"
            },
            "concession_polygon": [
                {
                    "loc": [11.748649323579226, -17.210253839242714],
                    "_id": "56f8c98288a7024614708fd5",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.307674202275505, -17.210102480701448],
                    "_id": "56f8c98288a7024614708fd4",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.310530637241978, -16.400985109343015],
                    "_id": "56f8c98288a7024614708fd3",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.812405260618743, -16.401159036494015],
                    "_id": "56f8c98288a7024614708fd2",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.816784178829087, -16.508152467400027],
                    "_id": "56f8c98288a7024614708fd1",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.813456662642464, -16.60839467745107],
                    "_id": "56f8c98288a7024614708fd0",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.81393202209779, -16.701299832830344],
                    "_id": "56f8c98288a7024614708fcf",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.80394947353795, -16.731802955904314],
                    "_id": "56f8c98288a7024614708fce",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.800146597895962, -16.77823117187359],
                    "_id": "56f8c98288a7024614708fcd",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.784935095328619, -16.781872121336452],
                    "_id": "56f8c98288a7024614708fcc",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.767822154940232, -16.767763053628805],
                    "_id": "56f8c98288a7024614708fcb",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.741202025447263, -16.711316321438986],
                    "_id": "56f8c98288a7024614708fca",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.73787450926064, -16.663961021315856],
                    "_id": "56f8c98288a7024614708fc9",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.729318039066445, -16.63891261377925],
                    "_id": "56f8c98288a7024614708fc8",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.71648333377514, -16.50678516812883],
                    "_id": "56f8c98288a7024614708fc7",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.709828301401888, -16.499948526745378],
                    "_id": "56f8c98288a7024614708fc6",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.694141439379218, -16.502227434060607],
                    "_id": "56f8c98288a7024614708fc5",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.66514451261008, -16.542331804535664],
                    "_id": "56f8c98288a7024614708fc4",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.713155817588515, -16.690372155115245],
                    "_id": "56f8c98288a7024614708fc3",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.73787450926064, -16.75638401060223],
                    "_id": "56f8c98288a7024614708fc2",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.769248233305914, -16.793249638635288],
                    "_id": "56f8c98288a7024614708fc1",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.762593200932665, -16.815547594428416],
                    "_id": "56f8c98288a7024614708fc0",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.773526468402993, -16.847397267462977],
                    "_id": "56f8c98288a7024614708fbf",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.771149671126858, -16.880606216395435],
                    "_id": "56f8c98288a7024614708fbe",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.754987449648992, -16.90607761674285],
                    "_id": "56f8c98288a7024614708fbd",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.749283136186163, -17.101546585959174],
                    "_id": "56f8c98288a7024614708fbc",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                {
                    "loc": [11.748649323579226, -17.210253839242714],
                    "_id": "56f8c98288a7024614708fbb",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                }
            ],
            "concession_commodity": [
                {
                    "_id": "56f8c98288a702461470903c",
                    "commodity_name": "Ferrochrome",
                    "commodity_type": "mining",
                    "commodity_id": "ferrochrome"
                },
                {
                    "_id": "56f8c98288a702461470903c",
                    "commodity_name": "Ferrochrome",
                    "commodity_type": "mining",
                    "commodity_id": "ferrochrome"
                },
                {
                    "_id": "56f8c98288a702461470900f",
                    "commodity_name": "Ferrotitanium",
                    "commodity_type": "mining",
                    "commodity_id": "ferrotitanium"
                },
                {
                    "_id": "56f8c98288a702461470900f",
                    "commodity_name": "Ferrotitanium",
                    "commodity_type": "mining",
                    "commodity_id": "ferrotitanium"
                }
            ],
            "concession_type": [{
                "source": "56747e060e8cc07115200ee6",
                "string": "offshore",
                "_id": "56f8c98288a7024614708fd8",
                "timestamp": "2016-03-28T06:04:49.711Z"
            }],
            "concession_status": [{
                "source": "56747e060e8cc07115200ee6",
                "_id": "56f8c98288a7024614708fd9",
                "timestamp": "2016-03-28T06:04:49.727Z",
                "string": "exploration"
            }],
            "concession_company_share": [],
            "concession_operated_by": [],
            "concession_country": [{
                "source": "56747e060e8cc07115200ee6",
                "country": {
                    "iso2": "AD",
                    "name": "Andorra",
                    "_id": "56f8c98288a7024614708e98",
                    "country_aliases": [],
                    "__v": 0
                },
                "_id": "56f8c98288a7024614708fda",
                "timestamp": "2016-03-28T06:04:49.711Z"
            }],
            "concession_aliases": [{
                "_id": "56a7d75bd9caddb614ab02b3",
                "alias": "Block aye"
            }, {"_id": "56a7d75bd9caddb614ab02b4", "alias": "Block no way"}],
            "__v": 0,
            "projects": [],
            "contracts": [{
                "_id": "56a2eb4345d114c30439ec22",
                "contract_id": "ocds-591adf-PH9670211788RC",
                "__v": 0
            }, {"_id": "56a2eb4345d114c30439ec20", "contract_id": "ocds-591adf-YE2702919895RC", "__v": 0}],
            "sites": [],
            "source_type": {"p": true, "c": true},
            "site_coordinates": {"sites": [], "fields": []},
            "polygon": [{
                "coordinate": [
                    {
                        "lat": 11.748649323579226,
                        "lng": -17.210253839242714
                    },
                    {
                        "lat": 11.307674202275505, "lng": -17.210102480701448
                    },
                    {
                    "lat": 11.310530637241978,
                    "lng": -16.400985109343015
                    },
                    {
                        "lat": 11.812405260618743, "lng": -16.401159036494015
                    },
                    {
                        "lat": 11.816784178829087,
                        "lng": -16.508152467400027
                    },
                    {
                        "lat": 11.813456662642464,
                        "lng": -16.60839467745107
                    }
                ]
            }],
            "proj_coordinates": [{
                "lat": 79.22885591,
                "lng": -44.84381911,
                "message": "Agnes",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "ad-agne-11geq3"
            }, {
                "lat": -73.15392307,
                "lng": 17.50168983,
                "message": "Jubilee Field",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "ad-jufi-yqceeo"
            }, {
                "lat": 79.22885591,
                "lng": -44.84381911,
                "message": "Agnes",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "ad-agne-11geq3"
            }, {
                "lat": 31.15392307,
                "lng": 47.50168983,
                "message": "Test field 1",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "field",
                "id": "56eb117c0007bf5b2a3e4b76"
            }]
        }

    beforeEach(inject(function ($rootScope, $controller, $httpBackend) {
        scope = $rootScope.$new();
        controllerService = $controller;
        httpMock = $httpBackend;
    }));

    it("should get '56a2b8236e585b7316655794' from '/api/concessions'", function () {

        httpMock.expectGET('/api/concessions/' + ID).respond(data);

        ctrl = controllerService('nrgiConcessionDetailCtrl', {
            $scope: scope,
            $routeParams:{
                id: ID
            }
        });

        httpMock.flush();

        expect(scope.concession._id).toEqual(ID);
    });
});
