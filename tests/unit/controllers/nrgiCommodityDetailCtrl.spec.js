describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var ID = 'silica',
        expectedID = {_id:'silica'},
        data = {
            "commodity_name":"Silica",
            "commodity_type":"mining",
            "commodity_id":"silica",
            "_id":"56f8c98288a70246147090af",
            "commodity_aliases":[],
            "__v":0
        },
        companiesQueryStub,  ctrl;

    beforeEach(inject(function ($rootScope, $controller, nrgiCommoditiesSrvc) {

        var commodityDetailQuerySpy;

        commodityDetailQuerySpy = sinon.spy(function () {
            return data;
        });

        companiesQueryStub = sinon.stub(nrgiCommoditiesSrvc, 'get', commodityDetailQuerySpy);

        ctrl = $controller('nrgiCommodityDetailCtrl', {
            $scope:  $rootScope.$new(),
            $routeParams:{
                id:ID
            }
        });
    }));

    it("requests commodity data for a given `Id`", function () {

        companiesQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(companiesQueryStub, expectedID);
        expect(companiesQueryStub).to.have.returned(data)

    });

    afterEach(function () {
        companiesQueryStub.restore();
    });
});