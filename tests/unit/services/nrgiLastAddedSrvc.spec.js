'use strict';

describe('nrgiLastAddedSrvc', function () {
    var lastAddedServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiLastAddedSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        lastAddedServiceInstance = new nrgiLastAddedSrvc();
    }));

    it('requests last added data', function () {

        $httpBackend.expectGET('/api/last_added').respond('');
        lastAddedServiceInstance.$get();

    });

    afterEach(function() {
        $httpBackend.flush();
    });
});