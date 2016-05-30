'use strict';

describe('Unit: Testing Controllers', function() {

    beforeEach(module('app'));

    var MapStub,
        scope,
        ctrl,
        data = {
            "data":[
                {
                    _id: "56a930f41b5482a31231ef43",
                    proj_id: "ad-agne-11geq3",
                    proj_name: "Agnes",
                    proj_coordinates: [
                        {
                            source: "56747e060e8cc07115200ee6",
                            loc: [
                                79.22885591,
                                -44.84381911
                            ],
                            _id: "56f8c98288a70246147090de",
                            timestamp: "2016-03-28T06:04:49.711Z"
                        }
                    ],
                    coordinates: [
                        {
                            lat: 79.22885591,
                            lng: -44.84381911,
                            message: "<a href='project/ad-agne-11geq3'>Agnes</a></br>Agnes",
                            timestamp: "2016-03-28T06:04:49.711Z",
                            type: "project",
                            id: "ad-agne-11geq3"
                        }
                    ]
                },
                {
                    _id: "56a930f41b5482a31231ef49",
                    proj_id: "alaz-2tdhes",
                    proj_name: "Alazana",
                    proj_coordinates: [
                        {
                            source: "56747e060e8cc07115200ee6",
                            loc: [
                                25.22881191,
                                -40.84381911
                            ],
                            _id: "56f8c98288a70246147090de",
                            timestamp: "2016-03-28T06:04:49.711Z"
                        }
                    ],
                    coordinates: [
                        {
                            lat: 25.22881191,
                            lng: -40.84381911,
                            message: "<a href='project/alaz-2tdhes'>Alazana</a></br>Alazana",
                            timestamp: "2016-03-28T06:04:49.711Z",
                            type: "project",
                            id: "alaz-2tdhes"
                        }
                    ]
                }],
            count:2
        }

    beforeEach(inject(function ($controller, nrgiProjectsCoordinateSrvc, $rootScope) {
        scope = $rootScope.$new;
        var mapQuerySpy;

        mapQuerySpy = sinon.spy(function (callback) {
            callback(data);
        });

        MapStub = sinon.stub(nrgiProjectsCoordinateSrvc, 'get', mapQuerySpy);

        ctrl = $controller('nrgiMapCtrl', {
            $scope: scope
        });
    }));

    it('loads the project map data', function () {

        MapStub.called.should.be.equal(true);
        sinon.assert.calledWith(MapStub);
        scope.projectMarkers.should.be.equal(data.data);

    });

    afterEach(function () {
        MapStub.restore();
    });
});
