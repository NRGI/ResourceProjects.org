describe("Unit: Testing Admin Controllers", function() {

    beforeEach(module('app'));

    var expectedParams = {limit:0, skip:0},
        scope,
        groupsData = {
            "count": 2,
            "data": [
                {
                    company_group_name: "African Petroleum",
                    company_group_record_established: "56fcd406be65cd01000bdca8",
                    _id: "56fcd406be65cd01000bdcb1",
                    company_group_aliases: [],
                    company_count: 1,
                    companies: [{
                        company: "56fcd407be65cd01000bdcc5"
                    }],
                    project_count: 0
                },
                {
                    company_group_name: "African",
                    company_group_record_established: "56fcd406be65cd01000bdca3",
                    _id: "56fcd406be65cd01000bdc12",
                    company_group_aliases: [],
                    company_count: 3,
                    companies: [{
                        company: "56fcd407b655cd01000bdcc5"
                    }],
                    project_count: 5
                }
            ]
        },
        groupQueryStub,  ctrl;

    beforeEach(inject(function ($rootScope, $controller, nrgiGroupsSrvc) {

        var groupsDetailQuerySpy;

        groupsDetailQuerySpy = sinon.spy(function (expectedParams, callback) {
            callback(groupsData);
        });


        groupQueryStub = sinon.stub(nrgiGroupsSrvc, 'query', groupsDetailQuerySpy);

        scope = $rootScope.$new();
        ctrl = $controller('nrgiGroupAdminCtrl', {
            $scope:  scope
        });
    }));

    it("loads the admin company group data", function () {
        groupQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(groupQueryStub, expectedParams);
        scope.groups.should.be.equal(groupsData.data);
    });

    afterEach(function () {
        groupQueryStub.restore();
    });
});

