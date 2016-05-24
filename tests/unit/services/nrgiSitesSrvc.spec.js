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
    it('requests site data list with a skip, limit and field var', function () {
        var limit = 10, skip = 1, field = false;
        $httpBackend.expectGET('/api/sites/' + limit + '/' + skip+ '/' + field).respond('');
        siteServiceInstance.$get({limit: limit, skip: skip, field: field});
    });
    it('requests field data list with a skip, limit and field var', function () {
        var limit = 10, skip = 1, field = true;
        $httpBackend.expectGET('/api/sites/' + limit + '/' + skip+ '/' + field).respond('');
        siteServiceInstance.$get({limit: limit, skip: skip, field: field});
    });
    it('requests site update data for a given `siteId`', function () {
        var siteId = 1;
        $httpBackend.expectPUT('/api/sites/' + siteId).respond('');
        siteServiceInstance.$update({_id: siteId});
    });
    it('requests site map with a map and field var', function () {
        var map = 'map', field = false;
        $httpBackend.expectGET('/api/sites/' + map + '/' + field).respond('');
        siteServiceInstance.$get({map: map, field: field});
    });
    it('requests field map with a map and field var', function () {
        var map = 'map', field = true;
        $httpBackend.expectGET('/api/sites/' + map + '/' + field).respond('');
        siteServiceInstance.$get({map: map, field: field});
    });
    //console.info('SITE SERVICE: UPDATE MISSING');
    //console.info('SITE SERVICE: MAP AND FIELD MISSING');

    afterEach(function() {
        $httpBackend.flush();
    });
});