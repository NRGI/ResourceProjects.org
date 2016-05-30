'use strict';

describe('Unit: Testing Controllers', function() {

    beforeEach(module('app'));

    var MapSiteStub,
        scope,
        expectParams ={map:'map',field: false},
        ctrl,
        data = {
            "data":[
                {
                    lat: -11.60706064,
                    lng: -76.14397333,
                    message: "Toromocho",
                    timestamp: "2016-04-14T20:44:33.814Z",
                    type: "site",
                    id: "571001e7bd08c40100abffce"
                },
                {
                    lat: -14.10264836,
                    lng: -72.27735102,
                    message: "Cotabambas",
                    timestamp: "2016-04-14T20:44:33.814Z",
                    type: "site",
                    id: "571001e7bd08c40100abffda"
                }]
        }

    beforeEach(inject(function ($controller, nrgiSitesSrvc, $rootScope) {
        scope = $rootScope.$new;
        var mapQuerySpy;

        mapQuerySpy = sinon.spy(function (expectParams, callback) {
            callback(data);
        });

        MapSiteStub = sinon.stub(nrgiSitesSrvc, 'get', mapQuerySpy);

        ctrl = $controller('nrgiMapSiteCtrl', {
            $scope: scope
        });
    }));

    it('loads the site or field map data', function () {

        MapSiteStub.called.should.be.equal(true);
        sinon.assert.calledWith(MapSiteStub);
        scope.siteMarkers.should.be.equal(data.data);

    });

    afterEach(function () {
        MapSiteStub.restore();
    });
});
