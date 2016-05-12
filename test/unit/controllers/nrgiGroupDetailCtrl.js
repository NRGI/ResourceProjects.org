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
            "__v": 0
        },
        alldata = {
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
            }]
        };

    beforeEach(inject(function ($rootScope, $controller, $httpBackend) {
        scope = $rootScope.$new();
        controllerService = $controller;
        httpMock = $httpBackend;
    }));

    it("should get '56a14d8ee47b92f110ce9a58' from '/api/companyGroupData'", function () {

        httpMock.expectGET('/api/companyGroups/' + ID).respond(data);
        httpMock.expectGET('/api/companyGroupData/' + ID).respond(alldata);

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
