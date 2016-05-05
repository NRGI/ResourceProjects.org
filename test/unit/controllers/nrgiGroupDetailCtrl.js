describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var scope,
        controllerService,
        httpMock,
        ID = '56a14d8ee47b92f110ce9a58',
        data = {
            "_id": "56a14d8ee47b92f110ce9a58",
            "company_group_name": "Exxon",
            "company_group_record_established": "56747e060e8cc07115200ee3",
            "description": "<p>yes</p><p>no</p>",
            "company_group_aliases": [],
            "__v": 0,
            "companies": [{"_id": "56a13a758f224f670e6a376e", "company_name": "company 1 a"}],
            "commodities": [{
                "_id": "56f8c98288a702461470900f",
                "commodity_name": "Ferrotitanium",
                "commodity_type": "mining",
                "commodity_id": "ferrotitanium"
            }, {
                "_id": "56f8c98288a702461470903c",
                "commodity_name": "Ferrochrome",
                "commodity_type": "mining",
                "commodity_id": "ferrochrome"
            }],
            "proj_coordinates": [{
                "lat": -73.15392307,
                "lng": 17.50168983,
                "message": "Jubilee Field",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "ad-jufi-yqceeo"
            }, {
                "lat": 31.15392307,
                "lng": 47.50168983,
                "message": "Test field 1",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "field",
                "id": "56eb117c0007bf5b2a3e4b76"
            }, {
                "lat": 14.15392307,
                "lng": 19.50168983,
                "message": "Test site 1",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "site",
                "id": "56eb117c0007bf5b2a3e4b71"
            }, {
                "lat": 79.22885591,
                "lng": -44.84381911,
                "message": "Agnes",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "ad-agne-11geq3"
            }, {
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
            }]
        };

    beforeEach(inject(function ($rootScope, $controller, $httpBackend) {
        scope = $rootScope.$new();
        controllerService = $controller;
        httpMock = $httpBackend;
    }));

    it("should get '56a14d8ee47b92f110ce9a58' from '/api/companyGroups'", function () {

        httpMock.expectGET('/api/companyGroups/' + ID).respond(data);

        ctrl = controllerService('nrgiGroupDetailCtrl', {
            $scope: scope,
            $routeParams:{
                id: ID
            }
        });

        httpMock.flush();

        expect(scope.group._id).toEqual(ID);
    });
});
