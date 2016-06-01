describe("Unit: Testing Admin Controllers", function() {

    beforeEach(module('app'));

    var expectedParams = {limit:0, skip:0},
        scope,
        commoditiesData = {
            "count": 200,
            "data": [
                {
                    "_id": "5734d18b3dbaf9c32c313963",
                    "commodity_name": "3PGM+Au",
                    "commodity_type": "mining",
                    "commodity_id": "3pgm+au",
                    "concessions": 0,
                    "projects": 2,
                    "fields": 3,
                    "sites": 0,
                    "contract": 0
                },
                {
                    "_id": "5734d18b3dbaf9c32c313964",
                    "commodity_name": "6PGM+Au",
                    "commodity_type": "mining",
                    "commodity_id": "6pgm+au",
                    "concessions": 1,
                    "projects": 4,
                    "fields": 0,
                    "sites": 0,
                    "contract": 77
                }]
        },
        commoditiesQueryStub,$rootScope,  ctrl;

    beforeEach(inject(function ($rootScope, $controller, nrgiCommoditiesSrvc) {
        var $rootScope = $rootScope;
        var commodityDetailQuerySpy;

        commodityDetailQuerySpy = sinon.spy(function (expectedParams, callback) {
            callback(commoditiesData);
        });


        commoditiesQueryStub = sinon.stub(nrgiCommoditiesSrvc, 'query', commodityDetailQuerySpy);

        scope = $rootScope.$new();
        ctrl = $controller('nrgiCommodityAdminCtrl', {
            $scope:  scope
        });
    }));

    it("loads the admin commodity data", function () {

        commoditiesQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(commoditiesQueryStub, expectedParams);
        scope.commodities.should.be.equal(commoditiesData.data);

    });

    afterEach(function () {
        commoditiesQueryStub.restore();
    });
});

