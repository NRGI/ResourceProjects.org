'use strict';

describe('nrgiSitesSrvc', function () {
    var siteServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiSitesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        siteServiceInstance = new nrgiSitesSrvc();
    }));

    it('requests site data for a given `siteId`', function () {
        var siteId = 1;
        $httpBackend.expectGET('/api/sites/' + siteId).respond('');
        siteServiceInstance.$get({_id: siteId});
    });
    it('requests site data list with a skip and limit var', function () {
        var limit = 10, skip = 1;
        $httpBackend.expectGET('/api/sites/' + limit + '/' + skip).respond('');
        siteServiceInstance.$get({limit: limit, skip: skip});
    });
    console.info('SITE SERVICE: UPDATE MISSING');
    console.info('SITE SERVICE: MAP AND FIELD MISSING');

    afterEach(function() {
        $httpBackend.flush();
    });
});