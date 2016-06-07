describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var expectedParams = {limit:50, skip:0, display: true},
        scope,
        sourceTypesData = {
            "count": 2,
            "data": [
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
        ctrl = $controller('nrgiSourceTypeListCtrl', {
            $scope:  scope
        });
    }));

    it("loads the source type data", function () {
        sourceTypeQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(sourceTypeQueryStub, expectedParams);
        scope.sourceTypes.should.be.equal(sourceTypesData.data);

        scope.loadMore();
        sourceTypeQueryStub.called.should.be.equal(true);
    });

    afterEach(function () {
        sourceTypeQueryStub.restore();
    });
});

