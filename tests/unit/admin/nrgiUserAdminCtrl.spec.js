describe("Unit: Testing Admin Controllers", function() {

    beforeEach(module('app'));

    var scope,
        usersData = {
            "count": 2,
            "data": [
                {
                    _id: "569976c21dad48f614cc8126",
                    first_name: "User",
                    last_name: "User",
                    username: "user",
                    email: "email@resourcegovernance.org",
                    salt: "9syklqiEoKTnyMMNep5",
                    created_by: "569976c21dad48f614cc8125",
                    creation_date: "2016-03-28T06:04:50.669Z",
                    role: [
                        "user"
                    ]
                },{
                    _id: "569976c21dad48f6dfcc8126",
                    first_name: "User",
                    last_name: "User",
                    username: "user",
                    email: "email@resourcegovernance.org",
                    salt: "9syklqiEoKTnyMMNep5",
                    created_by: "569976c21dad48f614cc8125",
                    creation_date: "2016-03-28T06:04:50.669Z",
                    role: [
                        "user"
                    ]
                },
            ]
        },
        userQueryStub,  ctrl;

    beforeEach(inject(function ($rootScope, $controller, nrgiUserSrvc) {

        var usersDetailQuerySpy;

        usersDetailQuerySpy = sinon.spy(function () {
            return usersData.data;
        });

        userQueryStub = sinon.stub(nrgiUserSrvc, 'query', usersDetailQuerySpy);

        scope = $rootScope.$new();
        ctrl = $controller('nrgiUserAdminCtrl', {
            $scope:  scope
        });
    }));

    it("loads the admin users data", function () {
        userQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(userQueryStub);
        scope.users.should.be.equal(usersData.data);
    });

    afterEach(function () {
        userQueryStub.restore();
    });
});

