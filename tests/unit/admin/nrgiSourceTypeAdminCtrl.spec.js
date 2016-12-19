describe("Unit: Testing Admin Controllers", function() {

    beforeEach(module('app'));

    var expectedParams = {limit:0, skip:0},
        scope,
        sourceTypesData = {
            "count": 2,
            "sourceTypes": [
                {
                    _id: "56e873691d1d2a3824141431",
                    source_type_authority: "non-authoritative",
                    source_type_display: true,
                    source_type_id: "companydb",
                    source_type_name: "Company database"
                },{
                    _id: "56e873691d1d2a3824143431",
                    source_type_authority: "authoritative",
                    source_type_display: true,
                    source_type_id: "company",
                    source_type_name: "Company"
                }
            ]
        },
        sourceTypeQueryStub,  ctrl;

    beforeEach(inject(function ($rootScope, $controller, nrgiSourceTypesSrvc) {

        var sourceTypesDetailQuerySpy;

        sourceTypesDetailQuerySpy = sinon.spy(function (expectedParams, callback) {
            callback(sourceTypesData);
        });


        sourceTypeQueryStub = sinon.stub(nrgiSourceTypesSrvc, 'query', sourceTypesDetailQuerySpy);

        scope = $rootScope.$new();
        ctrl = $controller('nrgiSourceTypeAdminCtrl', {
            $scope:  scope
        });
    }));

    it("loads the admin source type data", function () {
        sourceTypeQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(sourceTypeQueryStub, expectedParams);
        scope.sourceTypes.should.be.equal(sourceTypesData.sourceTypes);
    });

    afterEach(function () {
        sourceTypeQueryStub.restore();
    });
});

