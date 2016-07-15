'use strict';

describe('nrgiAboutPageContentSrvc', function () {
    var nrgiAboutPageContentServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiAboutPageContentSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        nrgiAboutPageContentServiceInstance = new nrgiAboutPageContentSrvc();
    }));

    it('requests about page data', function () {
        $httpBackend.expectGET('/api/about').respond('');
        nrgiAboutPageContentServiceInstance.$get();
    });
    it('requests about page update data', function () {
        $httpBackend.expectPUT('/api/about').respond('');
        nrgiAboutPageContentServiceInstance.$update();
    });
    afterEach(function() {
        $httpBackend.flush();
    });
});