describe("Sunburst Directive", function() {

    var $compile, $rootScope, template, scope, ctrl, sunburstQueryStub,nvd3,
        result = {
            "data": [{
                "name": "payments",
                "children": [{"name": "Guam", "children": [], "size": 1}, {
                    "name": "Bermuda",
                    "children": [{"name": "Jubilee Field", "size": 1}, {"name": "Lagamar", "size": 1}, {
                        "name": "LAST",
                        "size": 1
                    }],
                    "size": 3
                }, {
                    "name": "Andorra",
                    "children": [{"name": "LAST", "size": 56}, {"name": "Jubilee Field", "size": 1}],
                    "size": 59
                }, {"name": "Eritrea", "children": [{"name": "Angico", "size": 1}], "size": 1}, {
                    "name": "Ireland",
                    "children": [{"name": "Serra de salitre", "size": 1}],
                    "size": 1
                }, {
                    "name": "Oman",
                    "children": [{"name": "Santa Quiteria", "size": 2}],
                    "size": 2
                }, {"name": "Philippines", "children": [{"name": "Alex", "size": 1}], "size": 1}],
                "size": 68
            }]
        },
        element;
    beforeEach(module('app'));

    beforeEach(inject(function($templateCache,_$compile_,_$rootScope_,$controller, nrgiPaymentsSrvc) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();

        $templateCache.get('/partials/directives/templates/nrgi-sunburst');

        template = '<nrgi-sunburst></nrgi-sunburst>';
        element = $compile(template)(scope);

        var sunburstDataQuerySpy;

        sunburstDataQuerySpy= sinon.spy(function (callback) {
            return callback
        });

        sunburstQueryStub = sinon.stub(nrgiPaymentsSrvc, 'query', sunburstDataQuerySpy);

        ctrl = $controller('nrgiSunburstCtrl', {
            $scope:  scope
        });

    }));


    it("should display sunburst data", function() {

        sunburstQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(sunburstQueryStub);

        scope.$digest();

        var isolateScope = element.find('svg');
        isolateScope.should.be.defined;

    })

});

