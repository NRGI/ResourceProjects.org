describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var expectedParams = {limit:300, skip:0},
        scope,
        countriesData = {
            "count": 2,
            "data": [
                {
                    iso2: "MX",
                    name: "Mexico",
                    _id: "56f8c98288a7024614708f34",
                    country_aliases: [ ],
                    project_count: 50,
                    site_count: 0,
                    field_count: 0,
                    concession_count: 1
                },
                {
                    iso2: "AD",
                    name: "Andora",
                    _id: "56f8c98288a7024614708f35",
                    country_aliases: [ ],
                    project_count: 10,
                    site_count: 1,
                    field_count: 10,
                    concession_count: 8
                }
            ]
        },
        countryQueryStub,  ctrl;

    beforeEach(inject(function ($rootScope, $controller, nrgiCountriesSrvc) {

        var countriesDetailQuerySpy;

        countriesDetailQuerySpy = sinon.spy(function (expectedParams, callback) {
            callback(countriesData);
        });


        countryQueryStub = sinon.stub(nrgiCountriesSrvc, 'query', countriesDetailQuerySpy);

        scope = $rootScope.$new();
        ctrl = $controller('nrgiCountryListCtrl', {
            $scope:  scope
        });
    }));

    it("loads the country data", function () {
        countryQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(countryQueryStub, expectedParams);
        scope.countries.should.be.equal(countriesData.data);

        // scope.loadMore();
        countryQueryStub.called.should.be.equal(true);
    });

    afterEach(function () {
        countryQueryStub.restore();
    });
});

