describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var expectedParams = {field: false, limit:50, skip:0},
        scope,
        sitesData = {
            "count": 1,
            "sites": [
                {
                    _id: "56fcd3d8be65cd01000bd7c9",
                    site_name: "Obuasi",
                    site_established_source: "56fcd3d8be65cd01000bd79c",
                    description: "",
                    _keywords: [
                        "obuasi"
                    ],
                    site_status: {
                        source: "56fcd3d8be65cd01000bd79c",
                        _id: "56fcd3d8be65cd01000bd7ca",
                        timestamp: "2015-01-01T00:00:00.000Z",
                        string: "production"
                    },
                    site_company_share: [],
                    site_operated_by: [],
                    site_commodity: [
                        {
                            _id: "56fcd1e3be65cd01000bd278",
                            commodity_name: "Gold",
                            commodity_type: "mining",
                            commodity_id: "gold"
                        }
                    ],
                    site_coordinates: {
                        source: "56fcd3d8be65cd01000bd79c",
                        loc: [
                            6.197389,
                            -1.68703
                        ],
                        _id: "56fcd3d8be65cd01000bd7cc",
                        timestamp: "2016-03-31T07:29:38.779Z"
                    },
                    site_country: {
                        source: "56fcd3d8be65cd01000bd79c",
                        country: {
                            iso2: "GH",
                            name: "Ghana",
                            _id: "56fcd1e4be65cd01000bd32e"
                        },
                        _id: "56fcd3d8be65cd01000bd7ce",
                        timestamp: "2016-03-31T07:29:38.779Z"
                    },
                    site_address: {
                        source: "56fcd3d8be65cd01000bd79c",
                        string: "Obuasi",
                        _id: "56fcd3d8be65cd01000bd7cd",
                        timestamp: "2016-03-31T07:29:38.779Z"
                    },
                    site_aliases: [],
                    field: false,
                    transfers_query: [
                        "56fcd3d8be65cd01000bd7c9"
                    ],
                    source_type: {
                        p: false,
                        c: true
                    },
                    company_count: 0,
                    contract_count: 0,
                    project_count: 1,
                    field_count: 0,
                    site_count: 0,
                    concession_count: 0,
                    transfer_count: 17
                }
            ]
        },
        siteQueryStub,  ctrl;

    beforeEach(inject(function ($rootScope, $controller, nrgiSitesSrvc) {

        var sitesDetailQuerySpy;

        sitesDetailQuerySpy = sinon.spy(function (expectedParams, callback) {
            callback(sitesData);
        });


        siteQueryStub = sinon.stub(nrgiSitesSrvc, 'query', sitesDetailQuerySpy);

        scope = $rootScope.$new();
        ctrl = $controller('nrgiSiteListCtrl', {
            $scope:  scope
        });
    }));

    it("loads the site or field data", function () {
        siteQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(siteQueryStub, expectedParams);
        scope.sites.should.be.equal(sitesData.sites);

        scope.loadMore();
        siteQueryStub.called.should.be.equal(true);
    });

    afterEach(function () {
        siteQueryStub.restore();
    });
});

