describe("Concession Table Directive", function() {

    var $compile, $rootScope, template, scope,usSpinnerService, ctrl, concessionQueryStub,
        result = {
            concessions: [
                {
                    _id: "56a2b8236e585b7316655794",
                    concession_name: "Block A",
                    concession_country: {
                        iso2: "AD",
                        name: "Andorra",
                        _id: "56f8c98288a7024614708e98",
                        country_aliases: []
                    },
                    concession_type:
                    {
                        source: "56747e060e8cc07115200ee6",
                        string: "offshore",
                        _id: "56f8c98288a7024614708fd8",
                        timestamp: "2016-03-28T06:04:49.711Z"
                    },
                    concession_commodities:[
                        {
                            source: "56747e060e8cc07115200ee5",
                            commodity: {
                                _id: "56f8c98288a702461470903c",
                                commodity_name: "Ferrochrome",
                                commodity_type: "mining",
                                commodity_id: "ferrochrome",
                                commodity_aliases: []
                            },
                            _id: "56f8c98288a7024614708fd7",
                            timestamp: "2016-03-28T06:04:49.711Z"
                        },{
                            source: "56747e060e8cc07115200ee5",
                            commodity: {
                                _id: "56f8c98288a702461470903c",
                                commodity_name: "Ferrochrome",
                                commodity_type: "mining",
                                commodity_id: "ferrochrome",
                                commodity_aliases: []
                            },
                            _id: "56f8c98288a7024614708fd7",
                            timestamp: "2016-03-28T06:04:49.711Z"
                        }
                    ]
                }
            ]
        },
        ID = "57156908a6565c01006341f8",
        element,
        expectedParams = {_id: '57156908a6565c01006341f8',type: 'type'};
    beforeEach(module('app'));

    beforeEach(inject(function($templateCache,_$compile_,_$rootScope_,$controller, nrgiConcessionTablesSrvc,_usSpinnerService_) {
        usSpinnerService = _usSpinnerService_;
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();
        $templateCache.get('/partials/directives/templates/nrgi-concession-table');
        template = '<nrgi-concession-table id="\'57156908a6565c01006341f8\'" commodity = "false"  country = "false" type ="false" status="false" projects="true" name= "\'project\'"></nrgi-concession-table>';
        element = $compile(template)(scope);
        scope.id=ID;

        ctrl = $controller('nrgiConcessionTableCtrl', {
            $scope:  scope
        });

        var concessionDetailQuerySpy;

        concessionDetailQuerySpy= sinon.spy(function (expectedParams,callback) {
            callback(result);
        });

        concessionQueryStub = sinon.stub(nrgiConcessionTablesSrvc, 'get', concessionDetailQuerySpy);

    }));


    it("should display concession data", function() {

        scope.getConcessions('57156908a6565c01006341f8', 'type');
        concessionQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(concessionQueryStub, expectedParams);
        scope.concessions.should.be.equal(result.concessions);

        scope.$digest();

        var isolateScope = element.find('table');
        isolateScope.should.be.defined;

    })

});

