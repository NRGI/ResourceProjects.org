describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var ID = '56a14d8ee47b92f110ce9a58',
        expectedID = {_id: '56a14d8ee47b92f110ce9a58'},
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
        },
        groupIdSrvc, groupSrvc, controller, scope, GroupIDStub, GroupStub, ctrl;

    beforeEach(inject(function ($controller, nrgiGroupsSrvc, nrgiGroupDataSrvc, $rootScope) {
        scope = $rootScope.$new;
        controller = $controller;
        groupIdSrvc = nrgiGroupsSrvc;
        groupSrvc = nrgiGroupDataSrvc;
    }));

    it('requests group id', function () {
        var groupIDQuerySpy, groupDetailQuerySpy;

        groupIDQuerySpy = sinon.spy(function (id, callback) {
            callback(data);
        });
        groupDetailQuerySpy = sinon.spy(function (id, callback) {
            callback(alldata);
        });

        GroupIDStub = sinon.stub(groupIdSrvc, 'get', groupIDQuerySpy);
        GroupStub = sinon.stub(groupSrvc, 'get', groupDetailQuerySpy);
        ctrl = controller('nrgiGroupDetailCtrl', {
            $scope: scope,
            $routeParams: {
                id: ID
            }
        });

        groupIDQuerySpy.called.should.be.equal(true);

        sinon.assert.calledWith(groupIDQuerySpy, expectedID);

        scope.group.should.be.equal(data);

        groupDetailQuerySpy.called.should.be.equal(true);

        sinon.assert.calledWith(groupDetailQuerySpy, expectedID);


    });
    afterEach(function () {
        GroupIDStub.restore();
        GroupStub.restore();
    });
});



