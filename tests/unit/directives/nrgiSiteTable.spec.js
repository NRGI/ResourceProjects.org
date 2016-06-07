describe("Site Table Directive", function() {

    var $compile, $rootScope, template, scope,usSpinnerService, ctrl, siteQueryStub,
        result = {
            sites: [
                {
                    _id: "57100216bd08c40100ac0779",
                    field: false,
                    site_name: "Bayside",
                    site_country: [
                        {
                            source: "57100211bd08c40100ac0489",
                            country:
                            {
                                iso2: "ZA",
                                name: "South Africa",
                                _id: "57100133bd08c40100abf6de",
                                country_aliases: [ ]
                            },
                            _id: "57100216bd08c40100ac077d",
                            timestamp: "2016-04-14T20:44:33.814Z"
                        }
                    ],
                    site_commodity:[
                        {
                            source: "57100211bd08c40100ac0489",
                            commodity:
                            {
                                _id: "57100132bd08c40100abf54b",
                                commodity_name: "Aluminum",
                                commodity_type: "mining",
                                commodity_id: "aluminum",
                                commodity_aliases: [ ]
                            },
                            _id: "57100216bd08c40100ac077b",
                            timestamp: "2016-04-14T20:44:33.814Z"
                        }
                    ],
                    site_status:[
                        {
                            source: "57100211bd08c40100ac0489",
                            _id: "57100216bd08c40100ac077a",
                            timestamp: null,
                            string: "production"
                        }
                    ],
                    companies: 0
                }
            ]
        },
        ID = "57156908a6565c01006341f8",
        element,
        expectedParams = {_id: '57156908a6565c01006341f8',type: 'type'};
    beforeEach(module('app'));

    beforeEach(inject(function($templateCache,_$compile_,_$rootScope_,$controller, nrgiSiteFieldTablesSrvc,_usSpinnerService_) {
        usSpinnerService = _usSpinnerService_;
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();

        $templateCache.get('/partials/directives/templates/nrgi-site-table');

        template = '<nrgi-site-table id="\'57156908a6565c01006341f8\'" status="true" projectlink = "false" commoditytype = "false" country = "false" commodity = "false"   companies = "false" type ="\'country\'" ></nrgi-site-table>';

        element = $compile(template)(scope);
        scope.id=ID;

        ctrl = $controller('nrgiSiteTableCtrl', {
            $scope:  scope
        });

        var siteDetailQuerySpy;

        siteDetailQuerySpy= sinon.spy(function (expectedParams,callback) {
            callback(result);
        });

        siteQueryStub = sinon.stub(nrgiSiteFieldTablesSrvc, 'get', siteDetailQuerySpy);

    }));


    it("should display site data", function() {

        scope.getSites('57156908a6565c01006341f8', 'type');
        siteQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(siteQueryStub, expectedParams);
        scope.sites.should.be.equal(result.sites);

        scope.$digest();

        var isolateScope = element.find('table');
        isolateScope.should.be.defined;

    })

});

