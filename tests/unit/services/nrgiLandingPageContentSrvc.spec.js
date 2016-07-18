'use strict';

describe('nrgiLandingPageContentSrvc', function () {
    var nrgiLandingPageContentServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiLandingPageContentSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        nrgiLandingPageContentServiceInstance = new nrgiLandingPageContentSrvc();
    }));

    it('requests landing page data', function () {
        $httpBackend.expectGET('/api/landing').respond('');
        nrgiLandingPageContentServiceInstance.$get();
    });
    it('requests landing page update data', function () {
        $httpBackend.expectPUT('/api/landing').respond('');
        nrgiLandingPageContentServiceInstance.$update();
    });
    afterEach(function() {
        $httpBackend.flush();
    });
});