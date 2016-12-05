describe("Project Table Directive", function() {

    var $compile, $rootScope, template, scope,usSpinnerService, ctrl, projectQueryStub,
        result = {
            projects: [
                {
                    _id: "57100227bd08c40100ac1651",
                    proj_id: "za-akan-dvdwqh",
                    proj_name: "Akanani Project",
                    proj_country: [
                        {
                            source: "57100211bd08c40100ac0489",
                            country:
                            {
                                iso2: "ZA",
                                name: "South Africa",
                                _id: "57100133bd08c40100abf6de",
                                country_aliases: [ ]
                            },
                            _id: "57100227bd08c40100ac1654",
                            timestamp: "2016-04-14T20:44:33.814Z"
                        }
                    ],
                    proj_commodity:[
                        {
                            source: "57100211bd08c40100ac0489",
                            commodity:
                            {
                                _id: "57100132bd08c40100abf587",
                                commodity_name: "Platinum",
                                commodity_type: "mining",
                                commodity_id: "platinum",
                                commodity_aliases: [ ]
                            },
                            _id: "57100227bd08c40100ac1652",
                            timestamp: "2016-04-14T20:44:33.814Z"
                        }
                    ],
                    proj_status: {
                        source: "57100211bd08c40100ac0489",
                        _id: "57100227bd08c40100ac1653",
                        timestamp: null,
                        string: "exploration"
                    },
                    companies: 1
                }
        ]
        },
        ID = "57156908a6565c01006341f8",
        element,
        expectedParams = {_id: '57156908a6565c01006341f8',type: 'type',limit:50,skip:0};
    beforeEach(module('app'));

    beforeEach(inject(function($templateCache,_$compile_,_$rootScope_,$controller, nrgiProjectTablesSrvc,_usSpinnerService_) {
        usSpinnerService = _usSpinnerService_;
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();

        $templateCache.get('/partials/directives/templates/nrgi-project-table');

        template = '<nrgi-project-table id="\'57156908a6565c01006341f8\'" status="true" projectlink = "false" commoditytype = "false" country = "false" commodity = "false"   companies = "false" type ="\'country\'" ></nrgi-project-table>';

        element = $compile(template)(scope);
        scope.id=ID;

        ctrl = $controller('nrgiProjectTableCtrl', {
            $scope:  scope
        });

        var projectDetailQuerySpy;

        projectDetailQuerySpy= sinon.spy(function (expectedParams,callback) {
            callback(result);
        });

        projectQueryStub = sinon.stub(nrgiProjectTablesSrvc, 'get', projectDetailQuerySpy);

    }));


    it("should display project data", function() {

        scope.getProjects('57156908a6565c01006341f8', 'type');
        projectQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(projectQueryStub, expectedParams);
        scope.projects.should.be.equal(result.projects);

        var isolateScope = element.find('table');
        isolateScope.should.be.defined;

    })

});

