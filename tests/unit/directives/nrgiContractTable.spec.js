describe("Contract Table Directive", function() {

    var $compile, $rootScope, template, scope,usSpinnerService, ctrl, contractQueryStub,
        result = {
            contracts: [
                {
                    _id: "ocds-591adf-IQ2189765450RC",
                    id: "",
                    contract_name: "Iraqi Kurdistan, Sterling- Sangaw North Block, Production Sharing Agreement, 2007",
                    contract_country:
                    {
                        code: "IQ",
                        name: [ ]
                    },
                    contract_commodity: [
                        "Hydrocarbons"
                    ],
                    companies: 0
                }
            ]
        },
        ID = "57156908a6565c01006341f8",
        element,
        expectedParams = {_id: '57156908a6565c01006341f8',type: 'type'};
    beforeEach(module('app'));

    beforeEach(inject(function($templateCache,_$compile_,_$rootScope_,$controller, nrgiContractTablesSrvc,_usSpinnerService_) {
        usSpinnerService = _usSpinnerService_;
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();

        $templateCache.get('/partials/directives/templates/nrgi-contract-table');

        template = '<nrgi-contract-table id="\'57156908a6565c01006341f8\'" commodity = "false"  country = "false" type ="\'country\'" companies="false"></nrgi-contract-table>';
        element = $compile(template)(scope);
        scope.id=ID;

        ctrl = $controller('nrgiContractTableCtrl', {
            $scope:  scope
        });

        var contractDetailQuerySpy;

        contractDetailQuerySpy= sinon.spy(function (expectedParams,callback) {
            callback(result);
        });

        contractQueryStub = sinon.stub(nrgiContractTablesSrvc, 'get', contractDetailQuerySpy);

    }));


    it("should display contract data", function() {

        scope.getContracts('57156908a6565c01006341f8', 'type');
        contractQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(contractQueryStub, expectedParams);
        scope.contracts.should.be.equal(result.contracts);

        scope.$digest();

        var isolateScope = element.find('table');
        isolateScope.should.be.defined;

    })

});

