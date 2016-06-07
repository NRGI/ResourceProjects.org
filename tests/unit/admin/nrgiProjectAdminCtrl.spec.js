describe("Unit: Testing Admin Controllers", function() {

    beforeEach(module('app'));

    var expectedParams = {limit:0, skip:0},
        scope,
        projectsData = {
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
        projectQueryStub,  ctrl;

    beforeEach(inject(function ($rootScope, $controller, nrgiProjectsSrvc) {

        var projectsDetailQuerySpy;

        projectsDetailQuerySpy = sinon.spy(function (expectedParams, callback) {
            callback(projectsData);
        });


        projectQueryStub = sinon.stub(nrgiProjectsSrvc, 'query', projectsDetailQuerySpy);

        scope = $rootScope.$new();
        ctrl = $controller('nrgiProjectAdminCtrl', {
            $scope:  scope
        });
    }));

    it("loads the admin project data", function () {
        projectQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(projectQueryStub, expectedParams);
        scope.projects.should.be.equal(projectsData.data);
    });

    afterEach(function () {
        projectQueryStub.restore();
    });
});

