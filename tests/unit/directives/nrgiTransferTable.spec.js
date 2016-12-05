describe("TransferTable Directive", function() {

    var $compile, $rootScope, template, scope,usSpinnerService, ctrl, transferQueryStub,
        result = {
            'transfers': [{
                _id: "57156908a6565c01006341f8",
                transfer_year: 2015,
                country: {
                    name: "South Africa",
                    iso2: "ZA"
                },
                transfer_type: "Royalties",
                transfer_unit: "USD",
                transfer_value: 1823000,
                transfer_level: "project",
                transfer_audit_type: "company_payment",
                proj_site: {
                    name: "Agnes",
                    _id: "ad-agne-11geq3",
                    type: "project"
                }
            }, {
                _id: "57156908a6565c01006341f8",
                transfer_year: 2015,
                country: {
                    name: "South Africa",
                    iso2: "ZA"
                },
                transfer_type: "Royalties",
                transfer_unit: "USD",
                transfer_value: 1823000,
                transfer_level: "project",
                transfer_audit_type: "company_payment",
                proj_site: {
                    name: "Agnes",
                    _id: "ad-agne-11geq3",
                    type: "project"
                }
            }]
        },
        ID = "57156908a6565c01006341f8",
        element,
        expectedParams = {_id: 'id',type: 'type',limit:50,skip:0};
    beforeEach(module('app'));

    beforeEach(inject(function($templateCache,_$compile_,_$rootScope_,$controller, nrgiTransferTablesSrvc,_usSpinnerService_) {
        usSpinnerService = _usSpinnerService_;
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();
        $templateCache.get('/partials/directives/templates/nrgi-transfer-table');

        template = '<nrgi-transfer-table id="\'57156908a6565c01006341f8\'" type="type" project= "project" projectlink= "projectlink"></nrgi-transfer-table>';
        element = $compile(template)(scope);

        scope.id=ID;

        ctrl = $controller('nrgiTransferTableCtrl', {
            $scope:  scope
        });
        var transferDetailQuerySpy;

        transferDetailQuerySpy= sinon.spy(function (expectedParams,callback) {
            callback(result);
        });

        transferQueryStub = sinon.stub(nrgiTransferTablesSrvc, 'get', transferDetailQuerySpy);

    }));


    it("should display transfer data", function() {
        scope.getTransfers('id', 'type');
        transferQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(transferQueryStub, expectedParams);
        scope.transfers.should.be.equal(result.transfers);

        var isolateScope = element.find('table');
        isolateScope.should.be.defined;
    })

});

