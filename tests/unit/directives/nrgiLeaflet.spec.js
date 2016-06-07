describe("Leaflet Directive", function() {

    var $compile, $rootScope, template, scope,usSpinnerService, ctrl, leafletQueryStub,
        result = {
            _id: "56a930f41b5482a31231ef43",
            proj_id: "ad-agne-11geq3",
            proj_name: "Agnes",
            proj_coordinates: [
                {
                    source: "56747e060e8cc07115200ee6",
                    loc: [
                        79.22885591,
                        -44.84381911
                    ],
                    _id: "56f8c98288a70246147090de",
                    timestamp: "2016-03-28T06:04:49.711Z"
                }, {
                    source: "56747e060e8cc07115200ee6",
                    loc: [
                        79.22885591,
                        -44.84381911
                    ],
                    _id: "56f8c98288a70246147090de",
                    timestamp: "2016-03-28T06:04:49.711Z"
                }, {
                    source: "56747e060e8cc07115200ee6",
                    loc: [
                        79.22885591,
                        -44.84381911
                    ],
                    _id: "56f8c98288a70246147090de",
                    timestamp: "2016-03-28T06:04:49.711Z"
                }, {
                    source: "56747e060e8cc07115200ee6",
                    loc: [
                        79.22885591,
                        -44.84381911
                    ],
                    _id: "56f8c98288a70246147090de",
                    timestamp: "2016-03-28T06:04:49.711Z"
                }
            ],
            coordinates: [
                {
                    lat: 79.22885591,
                    lng: -44.84381911,
                    message: "<a href='project/ad-agne-11geq3'>Agnes</a></br>Agnes",
                    timestamp: "2016-03-28T06:04:49.711Z",
                    type: "project",
                    id: "ad-agne-11geq3"
                }
            ]
        },
        ID = "57156908a6565c01006341f8",
        element,
        timer,
        expectedParams = {_id: '57156908a6565c01006341f8',type: 'type'};
    beforeEach(module('app'));

    beforeEach(inject(function($templateCache,_$compile_,_$rootScope_,$controller, nrgiCountryCoordinatesSrvc,_usSpinnerService_) {
        usSpinnerService = _usSpinnerService_;
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();

        $templateCache.get('/partials/directives/templates/nrgi-leaflet');

        template = '<nrgi-leaflet id="\'57156908a6565c01006341f8\'" site="false" project = "false" map="false" type ="\'country\'" ></nrgi-leaflet>';
        element = $compile(template)(scope);
        scope.id=ID;
        scope.show = true;
        scope.data_loading = true;

        ctrl = $controller('nrgiLeafletCtrl', {
            $scope:  scope
        });

        timer = sinon.useFakeTimers();
        var leafletDetailQuerySpy;

        leafletDetailQuerySpy= sinon.spy(function (expectedParams,callback) {
            callback(result);
        });

        leafletQueryStub = sinon.stub(nrgiCountryCoordinatesSrvc, 'get', leafletDetailQuerySpy);

    }));


    it("should display leaflet data", function() {
        scope.getCoordinate('57156908a6565c01006341f8', 'type');
        timer.tick( 2000 );
        leafletQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(leafletQueryStub, expectedParams);
        scope.alldata.should.be.equal(result.proj_coordinates);

        scope.loadCoordinate(scope.alldata,scope.polygon)
        //scope.$digest();


    })
    afterEach( function() {
        timer.restore();
    });
});

