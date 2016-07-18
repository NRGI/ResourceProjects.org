'use strict';

describe('nrgiGlossaryPageContentSrvc', function () {
    var nrgiGlossaryPageContentServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiGlossaryPageContentSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        nrgiGlossaryPageContentServiceInstance = new nrgiGlossaryPageContentSrvc();
    }));

    it('requests glossary page data', function () {
        $httpBackend.expectGET('/api/glossary').respond('');
        nrgiGlossaryPageContentServiceInstance.$get();
    });
    it('requests glossary page update data', function () {
        $httpBackend.expectPUT('/api/glossary').respond('');
        nrgiGlossaryPageContentServiceInstance.$update();
    });
    afterEach(function() {
        $httpBackend.flush();
    });
});