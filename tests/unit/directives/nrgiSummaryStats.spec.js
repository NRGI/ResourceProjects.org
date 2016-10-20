describe("Summary stats Directive", function() {

    var $compile, $rootScope, template, scope, ctrl, summaryQueryStub, sumQueryStub,
        summary = {
            "source_type": [{"p": false, "c": false}, {"p": true, "c": false}, {"p": false, "c": true}, {
                "p": false,
                "c": true
            }, {"p": false, "c": true}, {"p": false, "c": true}, {"p": false, "c": true}, {
                "p": false,
                "c": true
            }, {"p": false, "c": true}, {"p": false, "c": true}, {"p": false, "c": true}, {
                "p": false,
                "c": true
            }, {"p": false, "c": true}, {"p": false, "c": true}, {"p": false, "c": true}, {
                "p": false,
                "c": true
            }, {"p": false, "c": true}, {"p": false, "c": true}, {"p": false, "c": true}, {
                "p": false,
                "c": true
            }, {"p": false, "c": true}, {"p": false, "c": true}, {"p": false, "c": true}, {
                "p": false,
                "c": true
            }, {"p": false, "c": true}, {"p": false, "c": true}, {"p": false, "c": true}, {
                "p": false,
                "c": true
            }, {"p": false, "c": true}, {"p": false, "c": true}, {"p": false, "c": true}, {
                "p": false,
                "c": true
            }, {"p": false, "c": true}, {"p": false, "c": true}, {"p": false, "c": true}, {
                "p": false,
                "c": true
            }, {"p": false, "c": true}, {"p": false, "c": true}, {"p": false, "c": true}, {
                "p": false,
                "c": true
            }, {"p": false, "c": true}, {"p": false, "c": true}, {"p": false, "c": false}, {
                "p": true,
                "c": false
            }, {"p": true, "c": false}, {"p": true, "c": false}, {"p": true, "c": false}, {
                "p": true,
                "c": false
            }, {"p": true, "c": false}, {"p": true, "c": false}, {"p": true, "c": false}, {
                "p": true,
                "c": false
            }, {"p": true, "c": false}, {"p": false, "c": true}, {"p": false, "c": false}, {
                "p": false,
                "c": true
            }, {"p": false, "c": true}, {"p": false, "c": true}, {"p": false, "c": true}, {
                "p": false,
                "c": true
            }, {"p": false, "c": true}, {"p": true, "c": true}, {"p": true, "c": true}, {"p": true, "c": true}],
            "none": 3,
            "context": 47,
            "payment": 11,
            "verified": 3
        },
        sumOfPayments = {"usd":233937191105.034,"gbp":4,"bbl":12},
        element;
    beforeEach(module('app'));

    beforeEach(inject(function($templateCache,_$compile_,_$rootScope_,$controller, nrgiSummaryStatsSrvc, nrgiSumOfPaymentsSrvc) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();

        $templateCache.get('/partials/directives/templates/nrgi-summary-stats');

        template = '<nrgi-summary-stats></nrgi-summary-stats>';
        element = $compile(template)(scope);

        var summaryStatsQuerySpy, sumOfPaymentsQuerySpy;

        summaryStatsQuerySpy= sinon.spy(function (callback) {
            callback(summary);
        });
        sumOfPaymentsQuerySpy= sinon.spy(function (callback) {
            callback(sumOfPayments);
        });

        summaryQueryStub = sinon.stub(nrgiSummaryStatsSrvc, 'get', summaryStatsQuerySpy);

        sumQueryStub = sinon.stub(nrgiSumOfPaymentsSrvc, 'get', sumOfPaymentsQuerySpy);

        ctrl = $controller('nrgiSummaryStatsCtrl', {
            $scope:  scope
        });

    }));


    it("should display summary stats data", function() {

        summaryQueryStub.called.should.be.equal(true);
        sumQueryStub.called.should.be.equal(true);

        sinon.assert.calledWith(summaryQueryStub);
        sinon.assert.calledWith(sumQueryStub);

        scope.summaryStats.should.be.equal(summary);
        scope.usd.should.be.equal(sumOfPayments.usd);
        scope.bbl.should.be.equal(sumOfPayments.bbl);
        scope.gbp.should.be.equal(sumOfPayments.gbp);



        scope.$digest();

        var isolateScope = element.find('p');
        isolateScope.should.be.defined;

    })

});

