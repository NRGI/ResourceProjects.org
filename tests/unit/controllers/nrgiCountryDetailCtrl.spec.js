describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var
        ID = 'MX',
        expectedID = {_id:'MX'},
        resultID = {
            "iso2": "MX",
            "name": "Mexico",
            "_id": "56f8c98288a7024614708f34",
            "country_aliases": [],
            "__v": 0
        },
        expectedDataID = {_id:'56f8c98288a7024614708f34'},
        data = {
            "iso2": "MX",
            "name": "Mexico",
            "_id": "56f8c98288a7024614708f34",
            "country_aliases": [],
            "__v": 0,

            "proj_coordinates": [{
                "lat": -94.09667961,
                "lng": -43.52395855,
                "message": "Adargas",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "adar-gok3sd"
            }, {
                "lat": 39.22885590999999,
                "lng": -40.84381911,
                "message": "Adelita",
                "timestamp": "2016-03-28T06:04:49.711Z",
                "type": "project",
                "id": "adel-sbdtui"
            }],
            "projects": [],
            "location": [],
            "commodities": [{
                "_id": "56f8c98288a702461470900f",
                "commodity_name": "Ferrotitanium",
                "commodity_type": "mining",
                "commodity_id": "ferrotitanium"
            }],
            "sources": {},
            "transfers_query": ["56f8c98288a7024614708f34"],
            "site_coordinates": {"sites": [], "fields": []},
            "sites": []
        },
        ctrl,scope,
        countryQueryStub,
        countryDataQueryStub;

    beforeEach(inject(function ($rootScope, $controller, nrgiCountriesSrvc,nrgiCountryCommoditiesSrvc) {

        var countryDetailQuerySpy, countryDataDetailQuerySpy;

        countryDetailQuerySpy= sinon.spy(function () {
            return resultID;
        });

        countryDataDetailQuerySpy= sinon.spy(function () {
            return data;
        });

        countryQueryStub = sinon.stub(nrgiCountriesSrvc, 'get', countryDetailQuerySpy);

        countryDataQueryStub = sinon.stub(nrgiCountryCommoditiesSrvc, 'get', countryDataDetailQuerySpy);

        scope = $rootScope.$new();
        scope.country  = data;
        ctrl = $controller('nrgiCountryDetailCtrl', {
            $scope:  scope,
            $routeParams:{
                id:ID
            }
        });
    }));

    it("requests country id for a given `Id`", function () {

        countryQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(countryQueryStub, expectedID);
        expect(countryQueryStub).to.have.returned(resultID)

        scope.$digest();

        countryDataQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(countryDataQueryStub, expectedDataID);
        expect(countryDataQueryStub).to.have.returned(data)
    });
    it("requests country data for a given `Id`",function(){
        scope.$digest();

        countryDataQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(countryDataQueryStub, expectedDataID);
        expect(countryDataQueryStub).to.have.returned(data)
    })

    afterEach(function () {
        countryQueryStub.restore();
        countryDataQueryStub.restore();
    });
});