describe("Source Table Directive", function() {

    var $compile, $rootScope, template, scope,usSpinnerService, ctrl, sourceQueryStub,
        result = {
            sources: [
                {
                    _id: "57100211bd08c40100ac0489",
                    source_name: "Africa Power–Mining Database 2014",
                    source_type: "Africa Power–Mining Database 2014",
                    source_type_id:
                    {
                        _id: "56e873691d1d2a3824141433",
                        source_type_name: "International organization report",
                        source_type_id :"ioreport",
                        source_type_authority: "authoritative",
                        source_type_examples: "IMF, WB, EIA reports",
                        source_type_url_type: "Direct link to data in PDF report",
                        source_type_display: false
                    },
                    source_url: "https://databox.worldbank.org/resource/yd4g-ie4d.json",
                    source_archive_url: "https://drive.google.com/open?id=0BwqM4Vkn0yovekt4dXJPRlRVamM",
                    source_notes: " ",
                    staged: true,
                    possible_duplicate: false,
                    create_date: "2016-04-14T20:48:17.595Z",
                    create_author: [ ],
                    retrieve_date: "2016-02-17T00:00:00.000Z",
                    source_date: "2014-07-14T00:00:00.000Z"
                },
                {
                    _id: "57100211bd08c40100ac048s",
                    source_name: "Africa Power–Mining Database 2014",
                    source_type: "Africa Power–Mining Database 2014",
                    source_type_id:
                    {
                        _id: "56e873691d1d2a3824141433",
                        source_type_name: "International organization report",
                        source_type_id :"ioreport",
                        source_type_authority: "authoritative",
                        source_type_examples: "IMF, WB, EIA reports",
                        source_type_url_type: "Direct link to data in PDF report",
                        source_type_display: false
                    },
                    source_url: "https://databox.worldbank.org/resource/yd4g-ie4d.json",
                    source_archive_url: "https://drive.google.com/open?id=0BwqM4Vkn0yovekt4dXJPRlRVamM",
                    source_notes: " ",
                    staged: true,
                    possible_duplicate: false,
                    create_date: "2016-04-14T20:48:17.595Z",
                    create_author: [ ],
                    retrieve_date: "2016-02-17T00:00:00.000Z",
                    source_date: "2014-07-14T00:00:00.000Z"
                }
            ]
        },
        ID = "57156908a6565c01006341f8",
        element,
        expectedParams = {_id: '57156908a6565c01006341f8',type: 'type'};
    beforeEach(module('app'));

    beforeEach(inject(function($templateCache,_$compile_,_$rootScope_,$controller, nrgiSourceTablesSrvc,_usSpinnerService_) {
        usSpinnerService = _usSpinnerService_;
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();

        $templateCache.get('/partials/directives/templates/nrgi-sources-table');

        template = '<nrgi-sources-table id="\'57156908a6565c01006341f8\'" type ="\'country\'"></nrgi-sources-table>';

        element = $compile(template)(scope);
        scope.id=ID;

        ctrl = $controller('nrgiSourcesTableCtrl', {
            $scope:  scope
        });

        var sourceDetailQuerySpy;

        sourceDetailQuerySpy= sinon.spy(function (expectedParams,callback) {
            callback(result);
        });

        sourceQueryStub = sinon.stub(nrgiSourceTablesSrvc, 'get', sourceDetailQuerySpy);

    }));


    it("should display source data", function() {

        scope.getSources('57156908a6565c01006341f8', 'type');
        sourceQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(sourceQueryStub, expectedParams);
        scope.sources.should.have.members(result.sources);

        scope.$digest();

        var isolateScope = element.find('table');
        isolateScope.should.be.defined;

    })

});

