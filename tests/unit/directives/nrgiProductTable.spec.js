describe("Production Table Directive", function() {

    var $compile, $rootScope, template, scope,usSpinnerService, ctrl, productionQueryStub,
        result = {
            production: [
                {
                    _id: "5710022fbd08c40100ac1b62",
                    production_year: 2014,
                    production_volume: 184000,
                    production_unit: "tons",
                    production_commodity:
                    {
                        _id: "57100132bd08c40100abf54b",
                        production_commodity: "Aluminum",
                        commodity_id: "aluminum"
                    },
                    production_price: 154,
                    production_price_unit: "USD",
                    production_level: "project",
                    proj_site:[
                        {
                            name: "Jubilee Field",
                            _id: "ad-jufi-yqceeo",
                            type: "project"
                        }
                    ]
                }
            ],
            production_query: [
                "5710043b76c9bc01003ae1c7",
                "57100216bd08c40100ac0775",
                "57100216bd08c40100ac0780",
                "57100217bd08c40100ac07f4",
                "57100217bd08c40100ac07ff",
                "57100217bd08c40100ac080a"
            ]
        },
        ID = "57156908a6565c01006341f8",
        element,
        expectedParams = {_id: '57156908a6565c01006341f8',type: 'type',limit:50,skip:0};
    beforeEach(module('app'));

    beforeEach(inject(function($templateCache,_$compile_,_$rootScope_,$controller, nrgiProdTablesSrvc,_usSpinnerService_) {
        usSpinnerService = _usSpinnerService_;
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();

        $templateCache.get('/partials/directives/templates/nrgi-production-table');

        template = '<nrgi-production-table id="\'57156908a6565c01006341f8\'" projectlink = "false" type ="\'country\'" ></nrgi-production-table>';
        element = $compile(template)(scope);
        scope.id=ID;

        ctrl = $controller('nrgiProductionTableCtrl', {
            $scope:  scope
        });

        var productionDetailQuerySpy;

        productionDetailQuerySpy= sinon.spy(function (expectedParams,callback) {
            callback(result);
        });

        productionQueryStub = sinon.stub(nrgiProdTablesSrvc, 'get', productionDetailQuerySpy);

    }));


    it("should display production data", function() {

        scope.getProduction('57156908a6565c01006341f8', 'type');
        productionQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(productionQueryStub, expectedParams);
        scope.production.should.be.equal(result.production);

        var isolateScope = element.find('table');
        isolateScope.should.be.defined;

    })

});

