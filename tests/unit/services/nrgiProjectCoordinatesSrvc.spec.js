'use strict';

describe('nrgiProjectsCoordinateSrvc', function () {
    var projectCoordinateServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiProjectsCoordinateSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        projectCoordinateServiceInstance = new nrgiProjectsCoordinateSrvc();
    }));

    it('requests project coordinates', function () {
        $httpBackend.expectGET('/api/projects').respond('');
        projectCoordinateServiceInstance.$get();
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});