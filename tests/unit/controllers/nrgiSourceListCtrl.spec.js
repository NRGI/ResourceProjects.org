describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var expectedParams = {limit:50, skip:0},
        scope,
        sourcesData = {
            "count": 1,
            "data": [
                {
                    _id: "571654330ef3fc0100672a6e",
                    source_name: "2015 Total mandatory disclosure",
                    source_type_id: "56e8736944442a3824141429",
                    source_url: "https://www.sec.gov/Archives/edgar/data/879764/000119312516506029/d83747d20f.htm",
                    source_archive_url: "",
                    source_notes: "",
                    staged: true,
                    possible_duplicate: false,
                    create_date: "2016-04-19T15:52:19.494Z",
                    create_author: [ ],
                    retrieve_date: "2016-04-10T00:00:00.000Z",
                    source_date: "2016-04-10T00:00:00.000Z",
                    projects: 0
                },
                {
                    _id: "571654330ef3fc0100122a6e",
                    source_name: "disclosure",
                    source_type_id: "56e8736944442a3824141429",
                    source_url: "",
                    source_archive_url: "",
                    source_notes: "",
                    staged: true,
                    possible_duplicate: false,
                    create_date: "2016-04-19T15:52:19.494Z",
                    create_author: [ ],
                    retrieve_date: "2016-04-10T00:00:00.000Z",
                    source_date: "2016-04-10T00:00:00.000Z",
                    projects: 2
                },
            ]
        },
        sourceQueryStub,  ctrl;

    beforeEach(inject(function ($rootScope, $controller, nrgiSourcesSrvc) {

        var sourcesDetailQuerySpy;

        sourcesDetailQuerySpy = sinon.spy(function (expectedParams, callback) {
            callback(sourcesData);
        });


        sourceQueryStub = sinon.stub(nrgiSourcesSrvc, 'query', sourcesDetailQuerySpy);

        scope = $rootScope.$new();
        ctrl = $controller('nrgiSourceListCtrl', {
            $scope:  scope
        });
    }));

    it("loads the source data", function () {
        sourceQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(sourceQueryStub, expectedParams);
        scope.sources.should.be.equal(sourcesData.data);

        scope.loadMore();
        sourceQueryStub.called.should.be.equal(true);
    });

    afterEach(function () {
        sourceQueryStub.restore();
    });
});

