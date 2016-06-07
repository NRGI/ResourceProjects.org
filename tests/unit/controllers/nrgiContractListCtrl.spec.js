describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var expectedParams = {limit:50, skip:0},
        scope,
        contractsData = {
            "count": 2,
            "data": [
                {
                    _id: "56fcd5ef641ff90100865659",
                    contract_id: "ocds-591adf-GH0615661588RC",
                    rc_info: [
                        { }
                    ],
                    commodities: { },
                    commodity: { },
                    projects: 2,
                    sites: 0,
                    fields:0
                },
                {
                    _id: "56fcd5f0641ff90100865675",
                    contract_id: "ocds-591adf-GH1577304824RC",
                    rc_info: [
                        {
                            contract_name: "Tullow, Sabre, Kosmos, Ghana, 2006",
                            contract_country:
                            {
                                code: "GH",
                                name: "Ghana"
                            },
                            contract_commodity: ["Hydrocarbons"],
                            contract_type: ["Concession Agreement"]
                        }
                    ],
                    commodities: ["Hydrocarbons"],
                    commodity: [
                        {
                            commodity_name: "Hydrocarbons",
                            commodity_type: "oil_and_gas",
                            _id: "56fcd1e3be65cd01000bd2dc",
                            commodity_id: "hydrocarbons"
                        }
                    ],
                    projects: 2,
                    sites: 0,
                    fields:0
                }
            ]
        },
        contractQueryStub,  ctrl;

    beforeEach(inject(function ($rootScope, $controller, nrgiContractsSrvc) {

        var contractsDetailQuerySpy;

        contractsDetailQuerySpy = sinon.spy(function (expectedParams, callback) {
            callback(contractsData);
        });


        contractQueryStub = sinon.stub(nrgiContractsSrvc, 'query', contractsDetailQuerySpy);

        scope = $rootScope.$new();
        ctrl = $controller('nrgiContractListCtrl', {
            $scope:  scope
        });
    }));

    it("loads the contract data", function () {
        contractQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(contractQueryStub, expectedParams);
        scope.contracts.should.be.equal(contractsData.data);

        scope.loadMore();
        contractQueryStub.called.should.be.equal(true);
    });

    afterEach(function () {
        contractQueryStub.restore();
    });
});

