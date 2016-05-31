describe("Company Operation Table Directive", function() {

    var $compile, $rootScope, template, scope,usSpinnerService, ctrl, companyOperationQueryStub,
        result = {
            companies: [
                {
                    _id: "57100215bd08c40100ac06a6",
                    company_name: "Rio Tinto",
                    company_groups: [
                        {
                            _id: "571001e7bd08c40100abff2c",
                            company_group_name: "Rio Tinto"
                        }
                    ]
                },{
                    _id: "57100215bd08c40100ac06a6",
                    company_name: "Rio",
                    company_groups: [
                        {
                            _id: "571001e7bd08c40100abff2c",
                            company_group_name: "Rio"
                        }
                    ]
                }
            ],
            query: [ ]
        },
        ID = "57156908a6565c01006341f8",
        element,
        expectedParams = {_id: '57156908a6565c01006341f8',type: 'type'};
    beforeEach(module('app'));

    beforeEach(inject(function($templateCache,_$compile_,_$rootScope_,$controller, nrgiTablesSrvc,_usSpinnerService_) {
        usSpinnerService = _usSpinnerService_;
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();

        $templateCache.get('/partials/directives/templates/nrgi-company-of-operation-table');

        template = '<nrgi-company-operation-table id="\'57156908a6565c01006341f8\'" stake = "true"  project = "true" site ="false" contract="true" concession="true" incorporated= "false" type="\'countries_of_operation\'" group="true" operation="true"></nrgi-company-operation-table>';
        element = $compile(template)(scope);

        scope.id=ID;

        ctrl = $controller('nrgiCompanyOperationTableCtrl', {
            $scope:  scope
        });

        var companyOfOperationDetailQuerySpy;

        companyOfOperationDetailQuerySpy= sinon.spy(function (expectedParams,callback) {
            callback(result);
        });

        companyOperationQueryStub = sinon.stub(nrgiTablesSrvc, 'get', companyOfOperationDetailQuerySpy);

    }));


    it("should display company of operation data", function() {

        scope.getCompanyOperation('57156908a6565c01006341f8', 'type');
        companyOperationQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(companyOperationQueryStub, expectedParams);
        scope.companies.should.be.equal(result.companies);

        scope.$digest();

        var isolateScope = element.find('table');
        isolateScope.should.be.defined;

    })

});

