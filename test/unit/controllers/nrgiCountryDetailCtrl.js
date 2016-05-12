describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var scope,
        controllerService,
        httpMock,
        ID = 'MX',
        data = {
            "iso2": "MX",
            "name": "Mexico",
            "_id": "56f8c98288a7024614708f34",
            "country_aliases": [],
            "__v": 0,
            "proj_coordinates": [{
                "lat": -94.09667961,
                "lng": -43.52395855,
                "message": "Adargas",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "adar-gok3sd"
            }, {
                "lat": 39.22885590999999,
                "lng": -40.84381911,
                "message": "Adelita",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "adel-sbdtui"
            }, {
                "lat": 0.2288559099999929,
                "lng": -0.8438191099999983,
                "message": "Agua Caliente",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "agca-ardrex"
            }, {
                "lat": 10.228855909999993,
                "lng": -10.843819109999998,
                "message": "Alazana",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "alaz-2tdhes"
            }, {
                "lat": 30.228855909999993,
                "lng": -10.843819109999998,
                "message": "Alaska North and Alaska South",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "alno-ki7xez"
            }, {
                "lat": 18.228855909999993,
                "lng": -14.843819109999998,
                "message": "Alex",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "alex-8gtwyn"
            }, {
                "lat": 30.228855909999993,
                "lng": -100.84381911,
                "message": "Alfa / Beta",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "al-s2wv2q"
            }, {
                "lat": 12.228855909999993,
                "lng": -1.8438191099999983,
                "message": "Alliance NW",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "alnw-5md21n"
            }, {
                "lat": 85.22885591,
                "lng": -10.843819109999998,
                "message": "Alta Gracia",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "algr-dqx50y"
            }, {
                "lat": 65.22885591,
                "lng": -40.84381911,
                "message": "Altares",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "alta-7xqhp4"
            }, {
                "lat": 78.22885591,
                "lng": -14.843819109999998,
                "message": "Altiplano",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "alti-ghdp5o"
            }, {
                "lat": 65.22885591,
                "lng": -19.84381911,
                "message": "Altiplano Plant",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "alpl-zqwknh"
            }, {
                "lat": 14.228855909999993,
                "lng": -14.843819109999998,
                "message": "Amalia",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "amal-ruz4th"
            }, {
                "lat": 33.22885590999999,
                "lng": -77.84381911,
                "message": "Amaltea",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "amal-jc93is"
            }, {
                "lat": 97.22885591,
                "lng": -1.8438191099999983,
                "message": "Amatista",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "amat-fley2m"
            }, {
                "lat": 44.22885590999999,
                "lng": -5.843819109999998,
                "message": "Amatista-La Fruta y El Mole",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "amfr-78xeaa"
            }, {
                "lat": 40.22885590999999,
                "lng": 40.84381911,
                "message": "Ana",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "ana-25bz64"
            }, {
                "lat": 40.22885590999999,
                "lng": -58.84381911,
                "message": "Ana Paula",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "anpa-lfv2ag"
            }, {
                "lat": 84.22885591,
                "lng": -74.84381911,
                "message": "Andrea (Chihuahua)",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "anch-jsuacc"
            }, {
                "lat": 17.228855909999993,
                "lng": -13.843819109999998,
                "message": "Andrea (Michoacán)",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "anmi-7t3he6"
            }, {
                "lat": 44.22885590999999,
                "lng": -43.84381911,
                "message": "Apache",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "apac-zhu8pl"
            }, {
                "lat": 34.22885590999999,
                "lng": 34.84381911,
                "message": "Aquila",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "aqui-7djz1k."
            }, {
                "lat": 45.22885590999999,
                "lng": 4.843819109999998,
                "message": "Aranjuez",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "aran-jjok0i"
            }, {
                "lat": 76.22885591,
                "lng": 45.84381911,
                "message": "Aranzazú (El Cobre)",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "arel-qpebdy"
            }, {
                "lat": 56.22885590999999,
                "lng": -56.84381911,
                "message": "Ariel",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "arie-4tbgvr"
            }, {
                "lat": 57.22885590999999,
                "lng": -53.84381911,
                "message": "Arroyo Seco",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "arse-a0arf2"
            }, {
                "lat": 34.22885590999999,
                "lng": 23.84381911,
                "message": "Arteaga (La Huerta)",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "arla-gtfj7x"
            }, {
                "lat": -43.22885590999999,
                "lng": -12.843819109999998,
                "message": "Aurea Norte",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "auno-hwrahn"
            }, {
                "lat": 23.228855909999993,
                "lng": -17.84381911,
                "message": "Aurea Sur",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "ausu-a420h9"
            }, {
                "lat": 56.22885590999999,
                "lng": -67.84381911,
                "message": "Aurena",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "aure-bpyyz5"
            }, {
                "lat": 87.22885591,
                "lng": -78.84381911,
                "message": "auro-7nvgw3",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "AuroTellurio"
            }, {
                "lat": 99.22885591,
                "lng": -9.843819109999998,
                "message": "Aurora (Guerrero)",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "augu-mn6ky3"
            }, {
                "lat": 89.22885591,
                "lng": -76.84381911,
                "message": "Aurora (Sonora)",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "auso-is0jb0"
            }, {
                "lat": 76.22885591,
                "lng": -34.84381911,
                "message": "Aztlan 8B",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "az8b-jdqulk"
            }, {
                "lat": 38.22885590999999,
                "lng": -48.84381911,
                "message": "Baborigame",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "babo-w9mh13"
            }, {
                "lat": 87.22885591,
                "lng": -56.84381911,
                "message": "Bacanora",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "baca-s7ocyy"
            }, {
                "lat": 35.22885590999999,
                "lng": -23.84381911,
                "message": "Bacanuchi",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "baca-8dtrev"
            }, {
                "lat": 45.22885590999999,
                "lng": 45.84381911,
                "message": "Bacerac",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "bace-lgwgti"
            }, {
                "lat": 20.228855909999993,
                "lng": -54.84381911,
                "message": "Badesi",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "bade-yivftq"
            }, {
                "lat": 34.22885590999999,
                "lng": -4.843819109999998,
                "message": "Bahuerachi",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "bahu-zp355e"
            }, {
                "lat": 64.22885591,
                "lng": -73.84381911,
                "message": "Baja Pacific 11-Guerrero",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "bapa-y4pbzw"
            }, {
                "lat": 17.228855909999993,
                "lng": -84.84381911,
                "message": "Baja Pacific 13-Reyna de Hierro",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "bapa-r3yzcs"
            }, {
                "lat": 73.22885591,
                "lng": -13.843819109999998,
                "message": "Baja Pacific 14-Guadalupe",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "bapa-ln5v9t"
            }, {
                "lat": 53.22885590999999,
                "lng": -93.84381911,
                "message": "Baja Pacific 4-El Tepustete",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "bapa-bw40ix"
            }, {
                "lat": 39.22885590999999,
                "lng": -63.84381911,
                "message": "Baja Pacific 5-La Costeña",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "bapa-2xi773"
            }, {
                "lat": 23.228855909999993,
                "lng": -94.84381911,
                "message": "Baja Pacific 8-Rincón",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "bapa-7hviws"
            }, {
                "lat": 23.228855909999993,
                "lng": -87.84381911,
                "message": "Baja Pacific 8-Rincón, Rincón II",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "bapa-hjvzff"
            }, {
                "lat": 45.22885590999999,
                "lng": -65.84381911,
                "message": "Baluarte",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "balu-2el7qy"
            }, {
                "lat": 39.22885590999999,
                "lng": -19.84381911,
                "message": "Barita de Sonora",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "bade-m48hya"
            }, {
                "lat": -94.09667961,
                "lng": -43.52395855,
                "message": "Adargas",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "adar-gok3sd"
            }],
            "projects": [],
            "location": [],
            "commodities": [{
                "_id": "56f8c98288a702461470900f",
                "commodity_name": "Ferrotitanium",
                "commodity_type": "mining",
                "commodity_id": "ferrotitanium"
            }],
            "sources": {},
            "transfers_query": ["56f8c98288a7024614708f34"],
            "site_coordinates": {"sites": [], "fields": []},
            "sites": []
        }

    beforeEach(inject(function ($rootScope, $controller, $httpBackend) {
        scope = $rootScope.$new();
        controllerService = $controller;
        httpMock = $httpBackend;
    }));

    it("should get 'MX' from '/api/countrycommodity'", function () {

        httpMock.expectGET('/api/countries/' + ID).respond(data);
        httpMock.expectGET('/api/countrycommodity/' + data._id).respond(data);

        ctrl = controllerService('nrgiCountryDetailCtrl', {
            $scope: scope,
            $routeParams:{
                id: ID
            }
        });

        httpMock.flush();

        expect(scope.country.iso2).toEqual(ID);
    });
});
